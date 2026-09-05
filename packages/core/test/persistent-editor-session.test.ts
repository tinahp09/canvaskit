import { expect, it, vi } from 'vitest'
import { addRectangle, CanvasKit, EditorSession, PersistentEditorSession, type StoredDocument } from '../src/index.js'
import { serializeScene } from '../src/serialization.js'

it('records a captured current scene as the clean baseline', () => {
  const session = new EditorSession()
  const kit = new CanvasKit()
  session.openDocument({ id: 'brief', title: 'Brief', kit })

  expect(session.markDocumentSaved('brief', serializeScene(kit.getScene()))).toBe(true)
  expect(session.getSnapshot().documents).toEqual([{ id: 'brief', title: 'Brief', isDirty: false }])
})

function stored(id: string, title = id): StoredDocument {
  return { id, title, scene: serializeScene(new CanvasKit().getScene()), updatedAt: '2026-09-05T12:00:00.000Z' }
}

function createMemoryStorage(records: readonly StoredDocument[]) {
  return {
    list: async () => records,
    load: async (id: string) => records.find((record) => record.id === id),
    save: async (record: StoredDocument) => record,
  }
}

it('restores listed records in adapter order and activates the first document', async () => {
  const session = new PersistentEditorSession({
    storage: createMemoryStorage([stored('brief', 'Brief'), stored('poster', 'Poster')]),
  })

  await expect(session.restore()).resolves.toBe(true)
  expect(session.getSnapshot()).toMatchObject({
    activeDocumentId: 'brief',
    isRestoring: false,
    documents: [
      { id: 'brief', title: 'Brief', persistence: 'saved', isDirty: false },
      { id: 'poster', title: 'Poster', persistence: 'saved', isDirty: false },
    ],
  })
})

it('returns false when an adapter load has no record', async () => {
  const session = new PersistentEditorSession({ storage: createMemoryStorage([]) })

  await expect(session.loadDocument('missing')).resolves.toBe(false)
})

function addTestRectangle(kit: CanvasKit, id: string): void {
  const before = kit.getScene()
  kit.execute({
    label: `add ${id}`,
    execute: (scene) => addRectangle(scene, {
      id,
      position: { x: 10, y: 20 },
      size: { width: 30, height: 40 },
      fill: '#5b8def',
    }),
    undo: () => before,
  })
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((next) => { resolve = next })
  return { promise, resolve }
}

function openPersistentSession(save: (record: StoredDocument) => Promise<StoredDocument>): PersistentEditorSession {
  const session = new PersistentEditorSession({
    storage: { list: async () => [], load: async () => undefined, save },
  })
  session.openDocument({ id: 'brief', title: 'Brief', kit: new CanvasKit() })
  return session
}

it('keeps a document dirty when it changes while an earlier save is pending', async () => {
  const pending = deferred<StoredDocument>()
  const session = openPersistentSession(async () => pending.promise)
  addTestRectangle(session.getActiveDocument()!, 'one')
  const saving = session.saveDocument()
  addTestRectangle(session.getActiveDocument()!, 'two')
  pending.resolve({
    id: 'brief', title: 'Brief', scene: serializeScene(session.getActiveDocument()!.getScene()), updatedAt: '2026-09-05T12:00:00.000Z',
  })

  await expect(saving).resolves.toBe(true)
  expect(session.getSnapshot().documents[0]).toMatchObject({ persistence: 'saved', isDirty: true })
})

it('retains a dirty document after failure and retries from its current scene', async () => {
  const save = vi.fn()
    .mockRejectedValueOnce(new Error('Offline'))
    .mockImplementationOnce(async (record: StoredDocument) => ({ ...record, updatedAt: '2026-09-05T12:01:00.000Z' }))
  const session = openPersistentSession(save)
  addTestRectangle(session.getActiveDocument()!, 'one')

  await expect(session.saveDocument()).resolves.toBe(false)
  expect(session.getSnapshot().documents[0]).toMatchObject({ persistence: 'error', error: 'Offline', isDirty: true })
  await expect(session.retrySave()).resolves.toBe(true)
  expect(session.getSnapshot().documents[0]).toMatchObject({ persistence: 'saved', isDirty: false })
  expect(save).toHaveBeenCalledTimes(2)
})
