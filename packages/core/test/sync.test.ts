import { expect, it } from 'vitest'
import { CanvasKit, createMemorySyncAdapter, PersistentEditorSession, serializeScene, SyncController, type StoredDocument, type SyncOutboxEntry, type SyncQueueStorageAdapter } from '../src/index.js'

function document(id: string, revision?: string): StoredDocument {
  return { id, title: id, scene: serializeScene(new CanvasKit().getScene()), updatedAt: '2026-09-14T00:00:00.000Z', ...(revision === undefined ? {} : { revision }) }
}

it('acknowledges an upload once and deduplicates its operation id', async () => {
  const remote = createMemorySyncAdapter()
  const entry: SyncOutboxEntry = { operationId: 'op-1', document: document('brief'), baseRevision: undefined, createdAt: '2026-09-14T00:00:00.000Z' }
  await expect(remote.push(entry)).resolves.toMatchObject({ status: 'acknowledged' })
  await expect(remote.push(entry)).resolves.toMatchObject({ status: 'acknowledged' })
  await expect(remote.pull({ documentId: 'brief' })).resolves.toMatchObject({ status: 'document', document: { id: 'brief' } })
})

it('reports a conflict when an upload has a stale base revision', async () => {
  const remote = createMemorySyncAdapter([document('brief', 'r2')])
  const entry: SyncOutboxEntry = { operationId: 'op-1', document: document('brief'), baseRevision: 'r1', createdAt: '2026-09-14T00:00:00.000Z' }
  await expect(remote.push(entry)).resolves.toMatchObject({ status: 'conflict', remote: { revision: { revision: 'r2' } } })
})

it('queues locally before synchronizing and clears only an acknowledged entry', async () => {
  const entries: SyncOutboxEntry[] = []
  const queue: SyncQueueStorageAdapter = { list: async () => entries, enqueue: async (entry) => { entries.push(entry) }, remove: async (id) => { entries.splice(entries.findIndex((entry) => entry.operationId === id), 1) }, loadRevision: async () => undefined, saveRevision: async () => undefined }
  const session = new PersistentEditorSession({ storage: { list: async () => [], load: async () => undefined, save: async (item) => item } })
  session.openDocument({ id: 'brief', title: 'Brief', kit: new CanvasKit() })
  const sync = new SyncController({ session, queue, adapter: createMemorySyncAdapter(), createOperationId: () => 'op-1' })
  await expect(sync.queueDocument('brief')).resolves.toBe(true)
  expect(entries).toHaveLength(1)
  await expect(sync.syncDocument('brief')).resolves.toBe(true)
  expect(entries).toEqual([])
  expect(sync.getSnapshot().documents).toContainEqual(expect.objectContaining({ id: 'brief', status: 'synced' }))
})

it('keeps a conflicting local entry until the host explicitly keeps it', async () => {
  const entries: SyncOutboxEntry[] = []
  const queue: SyncQueueStorageAdapter = { list: async () => entries, enqueue: async (entry) => { entries.push(entry) }, remove: async (id) => { const index = entries.findIndex((entry) => entry.operationId === id); if (index >= 0) entries.splice(index, 1) }, loadRevision: async () => ({ documentId: 'brief', revision: 'r1', updatedAt: '2026-09-14T00:00:00.000Z' }), saveRevision: async () => undefined }
  const session = new PersistentEditorSession({ storage: { list: async () => [], load: async () => undefined, save: async (item) => item } })
  session.openDocument({ id: 'brief', title: 'Brief', kit: new CanvasKit() })
  const sync = new SyncController({ session, queue, adapter: createMemorySyncAdapter([document('brief', 'r2')]), createOperationId: () => entries.length ? 'op-2' : 'op-1' })
  await sync.queueDocument('brief')
  await expect(sync.syncDocument('brief')).resolves.toBe(false)
  expect(sync.getSnapshot().documents[0]).toMatchObject({ status: 'conflict' })
  await expect(sync.resolveConflict('brief', { kind: 'keep-local' })).resolves.toBe(true)
  expect(entries).toHaveLength(1)
  expect(entries[0]).toMatchObject({ operationId: 'op-2', baseRevision: 'r2' })
})
