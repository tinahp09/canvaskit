import { CanvasKit } from './canvas-kit.js'
import type { StoredDocument } from './document-storage.js'
import type { PersistentEditorSession } from './persistent-editor-session.js'
import { loadScene } from './serialization.js'

export interface RecoveryJournalEntry { readonly document: StoredDocument; readonly capturedAt: string }
export interface RecoveryJournalStorageAdapter {
  load(documentId: string): Promise<RecoveryJournalEntry | undefined>
  save(entry: RecoveryJournalEntry): Promise<void>
  remove(documentId: string): Promise<void>
}
export interface RecoveryJournalControllerOptions { readonly session: PersistentEditorSession; readonly storage: RecoveryJournalStorageAdapter }

/** Explicit recovery lifecycle for host-owned unsaved-change journals. */
export class RecoveryJournalController {
  constructor(private readonly options: RecoveryJournalControllerOptions) {}
  async hasRecovery(id: string): Promise<boolean> { return (await this.options.storage.load(id)) !== undefined }
  async discardRecovery(id: string): Promise<boolean> { try { await this.options.storage.remove(id); return true } catch { return false } }
  async restoreRecovery(id: string): Promise<boolean> {
    try {
      const entry = await this.options.storage.load(id)
      if (!entry || entry.document.id !== id) return false
      const scene = loadScene(entry.document.scene)
      const existing = this.options.session.getDocument(id)
      if (existing) this.options.session.closeDocument(id, { force: true })
      this.options.session.openDocument({ id, title: entry.document.title, kit: new CanvasKit({ scene }) })
      return true
    } catch { return false }
  }
}
