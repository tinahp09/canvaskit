import { expect, it } from 'vitest'
import { CanvasKit, PersistentEditorSession, WorkspaceRecoveryController, type StoredDocument } from '../src/index.js'
import { serializeScene } from '../src/serialization.js'

function stored(id: string, title: string): StoredDocument {
  return { id, title, scene: serializeScene(new CanvasKit().getScene()), updatedAt: '2026-09-07T00:00:00.000Z' }
}

function createSession(records: readonly StoredDocument[]) {
  return new PersistentEditorSession({
    storage: {
      list: async () => records,
      load: async (id) => records.find((record) => record.id === id),
      save: async (record) => record,
    },
  })
}

it('saves open-document order and active document as a workspace manifest', async () => {
  const session = createSession([stored('brief', 'Brief'), stored('poster', 'Poster')])
  await session.restore()
  session.activateDocument('poster')
  let saved: unknown
  const recovery = new WorkspaceRecoveryController({ session, storage: { load: async () => undefined, save: async (workspace) => { saved = workspace } } })

  await expect(recovery.saveWorkspace()).resolves.toBe(true)
  expect(saved).toMatchObject({ activeDocumentId: 'poster', documents: [{ id: 'brief' }, { id: 'poster' }] })
})

it('restores manifest order and active document through the V7 session', async () => {
  const session = createSession([stored('brief', 'Brief'), stored('poster', 'Poster')])
  const recovery = new WorkspaceRecoveryController({
    session,
    storage: { load: async () => ({ documents: [{ id: 'poster', title: 'Poster' }, { id: 'brief', title: 'Brief' }], activeDocumentId: 'brief', updatedAt: '2026-09-07T00:00:00.000Z' }), save: async () => undefined },
  })

  await expect(recovery.restoreWorkspace()).resolves.toBe(true)
  expect(session.getSnapshot()).toMatchObject({ activeDocumentId: 'brief', documents: [{ id: 'poster' }, { id: 'brief' }] })
  expect(recovery.getSnapshot()).toMatchObject({ status: 'ready', recentDocuments: [{ id: 'poster' }, { id: 'brief' }] })
})

it('keeps the open workspace intact when no manifest exists', async () => {
  const session = createSession([stored('brief', 'Brief')])
  await session.loadDocument('brief')
  const recovery = new WorkspaceRecoveryController({
    session,
    storage: { load: async () => undefined, save: async () => undefined },
  })

  await expect(recovery.restoreWorkspace()).resolves.toBe(false)
  expect(session.getSnapshot().documents).toHaveLength(1)
  expect(recovery.getSnapshot()).toMatchObject({ status: 'ready', recentDocuments: [] })
})

it('surfaces invalid manifest errors without closing the current workspace', async () => {
  const session = createSession([stored('brief', 'Brief')])
  await session.loadDocument('brief')
  const recovery = new WorkspaceRecoveryController({
    session,
    storage: {
      load: async () => ({ documents: [{ id: '', title: 'Broken' }], updatedAt: '2026-09-07T00:00:00.000Z' }),
      save: async () => undefined,
    },
  })

  await expect(recovery.restoreWorkspace()).resolves.toBe(false)
  expect(session.getSnapshot().documents).toHaveLength(1)
  expect(recovery.getSnapshot()).toMatchObject({ status: 'error', error: 'Workspace manifest contains invalid document references.' })
})

it('returns false for a competing save while a workspace operation is in progress', async () => {
  const session = createSession([stored('brief', 'Brief')])
  let resolveSave: (() => void) | undefined
  const recovery = new WorkspaceRecoveryController({
    session,
    storage: {
      load: async () => undefined,
      save: async () => new Promise<void>((resolve) => { resolveSave = resolve }),
    },
  })

  const saving = recovery.saveWorkspace()
  await expect(recovery.restoreWorkspace()).resolves.toBe(false)
  resolveSave?.()
  await expect(saving).resolves.toBe(true)
})
