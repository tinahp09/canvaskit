import { expect, it, vi } from 'vitest'
import { addRectangle, AutosaveController, CanvasKit, PersistentEditorSession, type RecoveryJournalEntry, type StoredDocument } from '../src/index.js'
import { serializeScene } from '../src/serialization.js'

it('journals a dirty document before saving it after the default debounce', async () => {
  vi.useFakeTimers()
  const kit = new CanvasKit()
  const saves: StoredDocument[] = []
  const journals: RecoveryJournalEntry[] = []
  const session = new PersistentEditorSession({ storage: { list: async () => [], load: async () => undefined, save: async (document) => { saves.push(document); return document } } })
  session.openDocument({ id: 'brief', title: 'Brief', kit })
  const autosave = new AutosaveController({ session, journal: { load: async () => undefined, save: async (entry) => { journals.push(entry) }, remove: async () => undefined } })
  kit.setScene(addRectangle(kit.getScene(), { id: 'r', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#000' }))
  await vi.advanceTimersByTimeAsync(800)
  expect(journals).toHaveLength(1)
  expect(saves).toHaveLength(1)
  autosave.dispose()
  vi.useRealTimers()
})
