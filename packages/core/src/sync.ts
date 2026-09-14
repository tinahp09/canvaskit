import type { StoredDocument } from './document-storage.js'
import type { PersistentEditorSession } from './persistent-editor-session.js'
import { loadScene } from './serialization.js'
import { serializeScene } from './serialization.js'

export interface SyncDocumentRevision { readonly documentId: string; readonly revision: string; readonly updatedAt: string }
export interface SyncOutboxEntry { readonly operationId: string; readonly document: StoredDocument; readonly baseRevision?: string; readonly createdAt: string }
export interface SyncPullRequest { readonly documentId: string; readonly revision?: string }
export interface SyncRemoteDocument { readonly document: StoredDocument; readonly revision: SyncDocumentRevision }
export type SyncPullResult = { readonly status: 'empty' } | ({ readonly status: 'document' } & SyncRemoteDocument)
export type SyncPushResult = { readonly status: 'acknowledged'; readonly revision: SyncDocumentRevision } | { readonly status: 'conflict'; readonly remote?: SyncRemoteDocument } | { readonly status: 'retryable-error'; readonly message: string }
export interface SyncAdapter { pull(input: SyncPullRequest): Promise<SyncPullResult>; push(entry: SyncOutboxEntry): Promise<SyncPushResult> }
export interface SyncQueueStorageAdapter { list(documentId: string): Promise<readonly SyncOutboxEntry[]>; enqueue(entry: SyncOutboxEntry): Promise<void>; remove(operationId: string): Promise<void>; loadRevision(documentId: string): Promise<SyncDocumentRevision | undefined>; saveRevision(revision: SyncDocumentRevision): Promise<void> }
export type SyncStatus = 'idle' | 'queued' | 'syncing' | 'synced' | 'conflict' | 'error'
export interface SyncDocumentSnapshot { readonly id: string; readonly status: SyncStatus; readonly error?: string; readonly remote?: SyncRemoteDocument }
export interface SyncSnapshot { readonly documents: readonly SyncDocumentSnapshot[] }
export interface SyncControllerOptions { readonly session: PersistentEditorSession; readonly queue: SyncQueueStorageAdapter; readonly adapter: SyncAdapter; readonly createOperationId?: () => string }
export type SyncConflictResolution = { readonly kind: 'accept-remote' } | { readonly kind: 'keep-local' } | { readonly kind: 'merge-document'; readonly document: StoredDocument }

/** Explicit local-first synchronization. Hosts decide when to queue and sync. */
export class SyncController {
  private readonly states = new Map<string, SyncDocumentSnapshot>()
  private readonly listeners = new Set<(snapshot: SyncSnapshot) => void>()
  private readonly running = new Map<string, Promise<boolean>>()
  private readonly conflicts = new Map<string, { entry: SyncOutboxEntry; remote?: SyncRemoteDocument }>()
  private sequence = 0
  constructor(private readonly options: SyncControllerOptions) {}
  getSnapshot(): SyncSnapshot { return Object.freeze({ documents: Object.freeze([...this.states.values()].map((item) => Object.freeze({ ...item }))) }) }
  subscribe(listener: (snapshot: SyncSnapshot) => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener) }
  dispose(): void { this.listeners.clear() }
  async queueDocument(id: string): Promise<boolean> {
    const document = this.options.session.getSnapshot().documents.find((item) => item.id === id)
    const kit = this.options.session.getDocument(id)
    if (!document || !kit) return false
    try {
      const revision = await this.options.queue.loadRevision(id)
      const entry: SyncOutboxEntry = Object.freeze({ operationId: this.options.createOperationId?.() ?? `sync-${++this.sequence}`, document: Object.freeze({ id, title: document.title, scene: serializeScene(kit.getScene()), updatedAt: new Date().toISOString(), ...(revision === undefined ? {} : { revision: revision.revision }) }), ...(revision === undefined ? {} : { baseRevision: revision.revision }), createdAt: new Date().toISOString() })
      await this.options.queue.enqueue(entry)
      this.setState(id, { id, status: 'queued' })
      return true
    } catch (error) { this.setState(id, { id, status: 'error', error: message(error) }); return false }
  }
  syncDocument(id: string): Promise<boolean> {
    const active = this.running.get(id)
    if (active) return active
    const task = this.sync(id).finally(() => this.running.delete(id))
    this.running.set(id, task)
    return task
  }
  async resolveConflict(id: string, resolution: SyncConflictResolution): Promise<boolean> {
    const conflict = this.conflicts.get(id)
    if (!conflict) return false
    try {
      if (resolution.kind === 'keep-local') {
        if (!conflict.remote) return false
        const entry = this.nextEntry(conflict.entry.document, conflict.remote.revision.revision)
        await this.options.queue.remove(conflict.entry.operationId)
        await this.options.queue.enqueue(entry)
        this.conflicts.delete(id); this.setState(id, { id, status: 'queued' }); return true
      }
      const document = resolution.kind === 'accept-remote' ? conflict.remote?.document : resolution.document
      if (!document || document.id !== id) return false
      const scene = loadScene(document.scene)
      const kit = this.options.session.getDocument(id)
      if (!kit) return false
      kit.setScene(scene)
      if (!await this.options.session.saveDocument(id)) return false
      await this.options.queue.remove(conflict.entry.operationId)
      if (resolution.kind === 'merge-document') await this.options.queue.enqueue(this.nextEntry(document, conflict.remote?.revision.revision))
      else if (conflict.remote) await this.options.queue.saveRevision(conflict.remote.revision)
      this.conflicts.delete(id); this.setState(id, { id, status: resolution.kind === 'merge-document' ? 'queued' : 'synced' }); return true
    } catch (error) { this.setState(id, { id, status: 'error', error: message(error) }); return false }
  }
  private async sync(id: string): Promise<boolean> {
    try {
      const entry = (await this.options.queue.list(id))[0]
      if (!entry) { this.setState(id, { id, status: 'idle' }); return false }
      this.setState(id, { id, status: 'syncing' })
      const remote = await this.options.adapter.pull({ documentId: id, ...(entry.baseRevision === undefined ? {} : { revision: entry.baseRevision }) })
      if (remote.status === 'document' && remote.revision.revision !== entry.baseRevision) { this.conflicts.set(id, { entry, remote }); this.setState(id, { id, status: 'conflict', remote }); return false }
      const result = await this.options.adapter.push(entry)
      if (result.status === 'acknowledged') { await this.options.queue.saveRevision(result.revision); await this.options.queue.remove(entry.operationId); this.setState(id, { id, status: 'synced' }); return true }
      if (result.status === 'conflict') { this.conflicts.set(id, { entry, ...(result.remote === undefined ? {} : { remote: result.remote }) }); this.setState(id, { id, status: 'conflict', ...(result.remote === undefined ? {} : { remote: result.remote }) }); return false }
      this.setState(id, { id, status: 'error', error: result.message }); return false
    } catch (error) { this.setState(id, { id, status: 'error', error: message(error) }); return false }
  }
  private setState(id: string, state: SyncDocumentSnapshot): void { this.states.set(id, Object.freeze({ ...state })); const snapshot = this.getSnapshot(); this.listeners.forEach((listener) => listener(snapshot)) }
  private nextEntry(document: StoredDocument, baseRevision?: string): SyncOutboxEntry { return Object.freeze({ operationId: this.options.createOperationId?.() ?? `sync-${++this.sequence}`, document: Object.freeze({ ...document }), ...(baseRevision === undefined ? {} : { baseRevision }), createdAt: new Date().toISOString() }) }
}

/** A deterministic adapter for tests and local demos; it is not a production backend. */
export function createMemorySyncAdapter(initial: readonly StoredDocument[] = []): SyncAdapter {
  const documents = new Map<string, SyncRemoteDocument>()
  const acknowledgements = new Map<string, SyncDocumentRevision>()
  for (const item of initial) {
    validateDocument(item)
    if (documents.has(item.id)) throw new Error(`Duplicate remote document ID: ${item.id}`)
    documents.set(item.id, freezeRemote(item, item.revision ?? 'r1'))
  }
  return {
    async pull(input) {
      const remote = documents.get(input.documentId)
      if (!remote || remote.revision.revision === input.revision) return Object.freeze({ status: 'empty' })
      return Object.freeze({ status: 'document', ...cloneRemote(remote) })
    },
    async push(entry) {
      validateEntry(entry)
      const acknowledged = acknowledgements.get(entry.operationId)
      if (acknowledged) return Object.freeze({ status: 'acknowledged', revision: { ...acknowledged } })
      const current = documents.get(entry.document.id)
      if (current && entry.baseRevision !== current.revision.revision) return Object.freeze({ status: 'conflict', remote: cloneRemote(current) })
      const nextRevision = `r${Number((current?.revision.revision ?? 'r0').slice(1)) + 1}`
      const revision = Object.freeze({ documentId: entry.document.id, revision: nextRevision, updatedAt: entry.document.updatedAt })
      documents.set(entry.document.id, freezeRemote(entry.document, nextRevision))
      acknowledgements.set(entry.operationId, revision)
      return Object.freeze({ status: 'acknowledged', revision: { ...revision } })
    },
  }
}

function validateEntry(entry: SyncOutboxEntry): void {
  if (!entry.operationId) throw new Error('Sync operation ID must be non-empty.')
  validateDocument(entry.document)
}
function validateDocument(document: StoredDocument): void {
  if (!document.id || !document.title || !document.updatedAt) throw new Error('Invalid sync document.')
  loadScene(document.scene)
}
function freezeRemote(document: StoredDocument, revision: string): SyncRemoteDocument {
  return Object.freeze({ document: Object.freeze({ ...document, revision }), revision: Object.freeze({ documentId: document.id, revision, updatedAt: document.updatedAt }) })
}
function cloneRemote(remote: SyncRemoteDocument): SyncRemoteDocument {
  return Object.freeze({ document: Object.freeze({ ...remote.document }), revision: Object.freeze({ ...remote.revision }) })
}
function message(error: unknown): string { return error instanceof Error ? error.message : 'Sync failed.' }
