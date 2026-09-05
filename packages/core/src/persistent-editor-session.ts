import { CanvasKit } from './canvas-kit.js'
import type { DocumentPersistenceStatus, DocumentStorageAdapter, StoredDocument } from './document-storage.js'
import { EditorSession, type EditorDocumentInput, type EditorDocumentSnapshot } from './editor-session.js'
import { loadScene, serializeScene } from './serialization.js'

export interface PersistentEditorSessionOptions {
  readonly storage: DocumentStorageAdapter
  readonly createCanvasKit?: (document: StoredDocument) => CanvasKit
}

export interface PersistentEditorDocumentSnapshot extends EditorDocumentSnapshot {
  readonly persistence: DocumentPersistenceStatus
  readonly updatedAt?: string
  readonly revision?: string
  readonly error?: string
}

export interface PersistentEditorSessionSnapshot {
  readonly activeDocumentId?: string
  readonly documents: readonly PersistentEditorDocumentSnapshot[]
  readonly isRestoring: boolean
}

type PersistenceRecord = {
  persistence: DocumentPersistenceStatus
  updatedAt?: string
  revision?: string
  error?: string
}

/** Async, host-storage orchestration layered over a storage-free EditorSession. */
export class PersistentEditorSession {
  private readonly session = new EditorSession()
  private readonly states = new Map<string, PersistenceRecord>()
  private readonly listeners = new Set<(snapshot: PersistentEditorSessionSnapshot) => void>()
  private readonly unsubscribeSession: () => void
  private isRestoring = false
  private disposed = false

  constructor(private readonly options: PersistentEditorSessionOptions) {
    this.unsubscribeSession = this.session.subscribe(() => this.notify())
  }

  get commands(): EditorSession['commands'] { return this.session.commands }

  openDocument(input: EditorDocumentInput): void {
    this.assertNotDisposed()
    this.session.openDocument(input)
    this.states.set(input.id, { persistence: 'idle' })
    this.notify()
  }

  async restore(): Promise<boolean> {
    this.assertNotDisposed()
    this.isRestoring = true
    this.notify()
    let records: readonly StoredDocument[]
    try {
      records = await this.options.storage.list()
    } catch {
      this.isRestoring = false
      this.notify()
      return false
    }

    for (const document of this.session.getSnapshot().documents) this.session.closeDocument(document.id, { force: true })
    this.states.clear()
    let restored = true
    for (const record of records) restored = (this.openStoredDocument(record) && restored)
    this.isRestoring = false
    this.notify()
    return restored
  }

  async loadDocument(id: string): Promise<boolean> {
    this.assertNotDisposed()
    this.setState(id, { persistence: 'loading' })
    try {
      const record = await this.options.storage.load(id)
      if (!record) return false
      return this.openStoredDocument(record)
    } catch (error) {
      this.setState(id, { persistence: 'error', error: messageFor(error) })
      return false
    }
  }

  async saveDocument(id = this.session.getSnapshot().activeDocumentId): Promise<boolean> {
    this.assertNotDisposed()
    if (id === undefined) return false
    const document = this.session.getSnapshot().documents.find((candidate) => candidate.id === id)
    const kit = this.session.getDocument(id)
    const current = this.states.get(id)
    if (!document || !kit || current?.persistence === 'saving') return false

    const capturedScene = serializeScene(kit.getScene())
    this.setState(id, { ...current, persistence: 'saving', error: undefined })
    try {
      const persisted = await this.options.storage.save({
        id,
        title: document.title,
        scene: capturedScene,
        updatedAt: current?.updatedAt ?? new Date().toISOString(),
        ...(current?.revision === undefined ? {} : { revision: current.revision }),
      })
      this.setState(id, {
        persistence: 'saved',
        updatedAt: persisted.updatedAt,
        ...(persisted.revision === undefined ? {} : { revision: persisted.revision }),
      })
      this.session.markDocumentSaved(id, capturedScene)
      return true
    } catch (error) {
      this.setState(id, { ...current, persistence: 'error', error: messageFor(error, 'Unable to save document.') })
      return false
    }
  }

  retrySave(id = this.session.getSnapshot().activeDocumentId): Promise<boolean> {
    return this.saveDocument(id)
  }

  activateDocument(id: string): boolean { return this.session.activateDocument(id) }
  getDocument(id: string): CanvasKit | undefined { return this.session.getDocument(id) }
  getActiveDocument(): CanvasKit | undefined { return this.session.getActiveDocument() }

  getSnapshot(): PersistentEditorSessionSnapshot {
    const session = this.session.getSnapshot()
    const documents = Object.freeze(session.documents.map((document) => {
      const state = this.states.get(document.id) ?? { persistence: 'idle' as const }
      return Object.freeze({
        ...document,
        persistence: state.persistence,
        ...(state.updatedAt === undefined ? {} : { updatedAt: state.updatedAt }),
        ...(state.revision === undefined ? {} : { revision: state.revision }),
        ...(state.error === undefined ? {} : { error: state.error }),
      })
    }))
    return Object.freeze({
      ...(session.activeDocumentId === undefined ? {} : { activeDocumentId: session.activeDocumentId }),
      documents,
      isRestoring: this.isRestoring,
    })
  }

  subscribe(listener: (snapshot: PersistentEditorSessionSnapshot) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.unsubscribeSession()
    this.session.dispose()
    this.states.clear()
    this.listeners.clear()
  }

  private openStoredDocument(record: StoredDocument): boolean {
    try {
      const scene = loadScene(record.scene)
      const existing = this.session.getDocument(record.id)
      if (existing) return this.session.activateDocument(record.id)
      const kit = this.options.createCanvasKit?.(record) ?? new CanvasKit({ scene })
      this.session.openDocument({ id: record.id, title: record.title, kit })
      this.states.set(record.id, {
        persistence: 'saved',
        updatedAt: record.updatedAt,
        ...(record.revision === undefined ? {} : { revision: record.revision }),
      })
      this.notify()
      return true
    } catch (error) {
      this.setState(record.id, { persistence: 'error', error: messageFor(error) })
      return false
    }
  }

  private setState(id: string, state: PersistenceRecord): void {
    this.states.set(id, state)
    this.notify()
  }

  private notify(): void {
    if (this.disposed) return
    const snapshot = this.getSnapshot()
    this.listeners.forEach((listener) => listener(snapshot))
  }

  private assertNotDisposed(): void {
    if (this.disposed) throw new Error('PersistentEditorSession is disposed.')
  }
}

function messageFor(error: unknown, fallback = 'Unable to load document.'): string {
  return error instanceof Error ? error.message : fallback
}
