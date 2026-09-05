import { expect, it } from 'vitest'
import { CanvasKit, EditorSession, PersistentEditorSession, type StoredDocument } from '../src/index.js'
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
