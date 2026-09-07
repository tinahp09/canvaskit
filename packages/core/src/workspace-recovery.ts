import type { PersistentEditorSession } from './persistent-editor-session.js'

export interface WorkspaceDocumentReference {
  readonly id: string
  readonly title: string
  readonly updatedAt?: string
  readonly revision?: string
}

export interface WorkspaceSnapshot {
  readonly documents: readonly WorkspaceDocumentReference[]
  readonly activeDocumentId?: string
  readonly updatedAt: string
}

/** Storage boundary for a local-first workspace manifest. */
export interface WorkspaceStorageAdapter {
  load(): Promise<WorkspaceSnapshot | undefined>
  save(workspace: WorkspaceSnapshot): Promise<void>
}

export type WorkspaceRecoveryStatus = 'idle' | 'saving' | 'restoring' | 'ready' | 'error'

export interface WorkspaceRecoverySnapshot {
  readonly status: WorkspaceRecoveryStatus
  readonly recentDocuments: readonly WorkspaceDocumentReference[]
  readonly lastRestoredAt?: string
  readonly error?: string
}

export interface WorkspaceRecoveryControllerOptions {
  readonly session: PersistentEditorSession
  readonly storage: WorkspaceStorageAdapter
}

/**
 * Persists the editor's workspace manifest while delegating individual document
 * loading and validation to PersistentEditorSession.
 */
export class WorkspaceRecoveryController {
  private readonly listeners = new Set<(snapshot: WorkspaceRecoverySnapshot) => void>()
  private status: WorkspaceRecoveryStatus = 'idle'
  private recentDocuments: readonly WorkspaceDocumentReference[] = []
  private lastRestoredAt: string | undefined
  private error: string | undefined
  private busy = false

  constructor(private readonly options: WorkspaceRecoveryControllerOptions) {}

  async saveWorkspace(): Promise<boolean> {
    if (this.busy) return false
    this.busy = true
    this.status = 'saving'
    this.error = undefined
    this.notify()
    const session = this.options.session.getSnapshot()
    const documents = session.documents.map((document) => toReference(document))
    const workspace: WorkspaceSnapshot = Object.freeze({
      documents: Object.freeze(documents),
      ...(session.activeDocumentId === undefined ? {} : { activeDocumentId: session.activeDocumentId }),
      updatedAt: new Date().toISOString(),
    })
    try {
      await this.options.storage.save(workspace)
      this.recentDocuments = workspace.documents
      this.status = 'ready'
      return true
    } catch (error) {
      this.status = 'error'
      this.error = messageFor(error, 'Unable to save workspace.')
      return false
    } finally {
      this.busy = false
      this.notify()
    }
  }

  async restoreWorkspace(): Promise<boolean> {
    if (this.busy) return false
    this.busy = true
    this.status = 'restoring'
    this.error = undefined
    this.notify()
    try {
      const workspace = await this.options.storage.load()
      if (!workspace) {
        this.recentDocuments = []
        this.status = 'ready'
        return false
      }
      const documents = validReferences(workspace.documents)
      if (!documents) throw new Error('Workspace manifest contains invalid document references.')

      for (const document of this.options.session.getSnapshot().documents) {
        this.options.session.closeDocument(document.id, { force: true })
      }
      this.recentDocuments = documents
      let restored = 0
      for (const document of documents) {
        if (await this.options.session.loadDocument(document.id)) restored += 1
      }
      if (restored > 0 && workspace.activeDocumentId && documents.some((document) => document.id === workspace.activeDocumentId)) {
        this.options.session.activateDocument(workspace.activeDocumentId)
      }
      this.lastRestoredAt = workspace.updatedAt
      this.status = 'ready'
      return restored > 0
    } catch (error) {
      this.status = 'error'
      this.error = messageFor(error, 'Unable to restore workspace.')
      return false
    } finally {
      this.busy = false
      this.notify()
    }
  }

  getSnapshot(): WorkspaceRecoverySnapshot {
    return Object.freeze({
      status: this.status,
      recentDocuments: Object.freeze(this.recentDocuments.map((document) => Object.freeze({ ...document }))),
      ...(this.lastRestoredAt === undefined ? {} : { lastRestoredAt: this.lastRestoredAt }),
      ...(this.error === undefined ? {} : { error: this.error }),
    })
  }

  subscribe(listener: (snapshot: WorkspaceRecoverySnapshot) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify(): void {
    const snapshot = this.getSnapshot()
    this.listeners.forEach((listener) => listener(snapshot))
  }
}

function toReference(document: { id: string; title: string; updatedAt?: string; revision?: string }): WorkspaceDocumentReference {
  return Object.freeze({
    id: document.id,
    title: document.title,
    ...(document.updatedAt === undefined ? {} : { updatedAt: document.updatedAt }),
    ...(document.revision === undefined ? {} : { revision: document.revision }),
  })
}

function validReferences(documents: readonly WorkspaceDocumentReference[]): readonly WorkspaceDocumentReference[] | undefined {
  const seen = new Set<string>()
  const references: WorkspaceDocumentReference[] = []
  for (const document of documents) {
    if (!document || typeof document.id !== 'string' || document.id.length === 0 || typeof document.title !== 'string' || seen.has(document.id)) return undefined
    seen.add(document.id)
    references.push(Object.freeze({
      id: document.id,
      title: document.title,
      ...(typeof document.updatedAt === 'string' ? { updatedAt: document.updatedAt } : {}),
      ...(typeof document.revision === 'string' ? { revision: document.revision } : {}),
    }))
  }
  return Object.freeze(references)
}

function messageFor(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}
