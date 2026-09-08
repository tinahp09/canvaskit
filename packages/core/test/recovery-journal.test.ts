import { expect, it } from 'vitest'
import { CanvasKit, PersistentEditorSession, RecoveryJournalController, type RecoveryJournalEntry, type StoredDocument } from '../src/index.js'
import { serializeScene } from '../src/serialization.js'

function document(id: string, title: string): StoredDocument {
  return { id, title, scene: serializeScene(new CanvasKit().getScene()), updatedAt: '2026-09-08T00:00:00.000Z' }
}

it('detects, restores, and discards a journal entry through the persistent session', async () => {
  const record = document('brief', 'Recovered brief')
  let entry: RecoveryJournalEntry | undefined = { document: record, capturedAt: '2026-09-08T00:01:00.000Z' }
  const session = new PersistentEditorSession({ storage: { list: async () => [], load: async () => undefined, save: async (item) => item } })
  const journal = new RecoveryJournalController({
    session,
    storage: {
      load: async () => entry,
      save: async () => undefined,
      remove: async () => { entry = undefined },
    },
  })

  await expect(journal.hasRecovery('brief')).resolves.toBe(true)
  await expect(journal.restoreRecovery('brief')).resolves.toBe(true)
  expect(session.getSnapshot()).toMatchObject({ documents: [{ id: 'brief', title: 'Recovered brief' }] })
  await expect(journal.discardRecovery('brief')).resolves.toBe(true)
  await expect(journal.hasRecovery('brief')).resolves.toBe(false)
})
