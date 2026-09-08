import type { PersistentEditorSession } from './persistent-editor-session.js'
import type { RecoveryJournalEntry, RecoveryJournalStorageAdapter } from './recovery-journal.js'
import { serializeScene } from './serialization.js'

export type AutosaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'
export interface AutosaveDocumentSnapshot { readonly id: string; readonly status: AutosaveStatus; readonly error?: string }
export interface AutosaveSnapshot { readonly documents: readonly AutosaveDocumentSnapshot[] }
export interface AutosaveControllerOptions { readonly session: PersistentEditorSession; readonly journal: RecoveryJournalStorageAdapter; readonly delayMs?: number }

/** Debounced host-neutral save orchestration that journals before durable writes. */
export class AutosaveController {
  private readonly listeners = new Set<(snapshot: AutosaveSnapshot) => void>()
  private readonly states = new Map<string, AutosaveDocumentSnapshot>()
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>()
  private readonly unsubscribe: () => void
  private disposed = false
  private readonly delay: number
  constructor(private readonly options: AutosaveControllerOptions) {
    this.delay = options.delayMs ?? 800
    this.unsubscribe = options.session.subscribe((snapshot) => {
      for (const document of snapshot.documents) if (document.isDirty) this.schedule(document.id)
    })
  }
  getSnapshot(): AutosaveSnapshot { return Object.freeze({ documents: Object.freeze([...this.states.values()].map((item) => Object.freeze({ ...item }))) }) }
  subscribe(listener: (snapshot: AutosaveSnapshot) => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener) }
  dispose(): void { this.disposed = true; this.unsubscribe(); this.timers.forEach(clearTimeout); this.timers.clear() }
  private schedule(id: string): void {
    if (this.disposed || this.timers.has(id) || this.states.get(id)?.status === 'saving') return
    this.setState(id, { id, status: 'pending' })
    this.timers.set(id, setTimeout(() => { this.timers.delete(id); void this.save(id) }, this.delay))
  }
  private async save(id: string): Promise<void> {
    if (this.disposed) return
    const document = this.options.session.getSnapshot().documents.find((item) => item.id === id)
    const kit = this.options.session.getDocument(id)
    if (!document?.isDirty || !kit) return
    const entry: RecoveryJournalEntry = { document: { id, title: document.title, scene: serializeScene(kit.getScene()), updatedAt: new Date().toISOString() }, capturedAt: new Date().toISOString() }
    this.setState(id, { id, status: 'saving' })
    try {
      await this.options.journal.save(entry)
      if (!await this.options.session.saveDocument(id)) throw new Error('Unable to save document.')
      if (!this.options.session.getSnapshot().documents.find((item) => item.id === id)?.isDirty) await this.options.journal.remove(id)
      this.setState(id, { id, status: 'saved' })
    } catch (error) { this.setState(id, { id, status: 'error', error: error instanceof Error ? error.message : 'Autosave failed.' }) }
  }
  private setState(id: string, state: AutosaveDocumentSnapshot): void { this.states.set(id, state); const snapshot = this.getSnapshot(); this.listeners.forEach((listener) => listener(snapshot)) }
}
