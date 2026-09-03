import { CanvasKit } from './canvas-kit.js'
import { serializeScene } from './serialization.js'

export interface EditorDocumentInput {
  readonly id: string
  readonly title: string
  readonly kit: CanvasKit
}

export interface EditorDocumentSnapshot {
  readonly id: string
  readonly title: string
  readonly isDirty: boolean
}

export interface EditorSessionSnapshot {
  readonly activeDocumentId?: string
  readonly documents: readonly EditorDocumentSnapshot[]
}

export type CloseDocumentResult =
  | { readonly closed: true }
  | { readonly closed: false; readonly reason: 'missing' | 'requiresConfirmation' }

export interface CloseDocumentOptions {
  readonly force?: boolean
}

type SessionDocument = {
  id: string
  title: string
  kit: CanvasKit
  baseline: string
  unsubscribe: () => void
}

export class EditorSession {
  private readonly documents = new Map<string, SessionDocument>()
  private readonly listeners = new Set<(snapshot: EditorSessionSnapshot) => void>()
  private activeDocumentId: string | undefined

  openDocument(input: EditorDocumentInput): void {
    if (this.documents.has(input.id)) {
      throw new Error(`A document with ID \"${input.id}\" is already open.`)
    }
    const document: SessionDocument = {
      id: input.id,
      title: input.title,
      kit: input.kit,
      baseline: serializeScene(input.kit.getScene()),
      unsubscribe: () => undefined,
    }
    document.unsubscribe = input.kit.subscribe(() => this.notify())
    this.documents.set(input.id, document)
    this.activeDocumentId ??= input.id
    this.notify()
  }

  activateDocument(id: string): boolean {
    if (!this.documents.has(id)) return false
    if (this.activeDocumentId !== id) {
      this.activeDocumentId = id
      this.notify()
    }
    return true
  }

  getDocument(id: string): CanvasKit | undefined {
    return this.documents.get(id)?.kit
  }

  getActiveDocument(): CanvasKit | undefined {
    return this.activeDocumentId === undefined ? undefined : this.getDocument(this.activeDocumentId)
  }

  saveDocument(id = this.activeDocumentId): boolean {
    if (id === undefined) return false
    const document = this.documents.get(id)
    if (!document) return false
    document.baseline = serializeScene(document.kit.getScene())
    this.notify()
    return true
  }

  closeDocument(id: string, options: CloseDocumentOptions = {}): CloseDocumentResult {
    const document = this.documents.get(id)
    if (!document) return { closed: false, reason: 'missing' }
    if (!options.force && this.isDirty(document)) return { closed: false, reason: 'requiresConfirmation' }

    document.unsubscribe()
    this.documents.delete(id)
    if (this.activeDocumentId === id) this.activeDocumentId = this.documents.keys().next().value
    this.notify()
    return { closed: true }
  }

  getSnapshot(): EditorSessionSnapshot {
    const documents = Object.freeze([...this.documents.values()].map((document) => Object.freeze({
      id: document.id,
      title: document.title,
      isDirty: this.isDirty(document),
    })))
    return Object.freeze({
      ...(this.activeDocumentId === undefined ? {} : { activeDocumentId: this.activeDocumentId }),
      documents,
    })
  }

  subscribe(listener: (snapshot: EditorSessionSnapshot) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  dispose(): void {
    for (const document of this.documents.values()) document.unsubscribe()
    this.documents.clear()
    this.activeDocumentId = undefined
    this.notify()
  }

  private isDirty(document: SessionDocument): boolean {
    return serializeScene(document.kit.getScene()) !== document.baseline
  }

  private notify(): void {
    const snapshot = this.getSnapshot()
    this.listeners.forEach((listener) => listener(snapshot))
  }
}
