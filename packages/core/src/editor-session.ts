import { CanvasKit } from './canvas-kit.js'
import { CommandRegistry, type CommandResult, type CommandSnapshot, type EditorCommandDefinition } from './command-registry.js'
import type { EditorCommand } from './editor-command.js'
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

/** Command surface bound to the session's active document. */
export class EditorSessionCommands {
  private readonly registry = new CommandRegistry()

  constructor(
    private readonly getActiveDocument: () => CanvasKit | undefined,
    private readonly getActiveDocumentId: () => string | undefined,
  ) {
    for (const command of builtInCommands) {
      this.registry.register({
        id: command.id,
        title: command.title,
        ...(command.shortcut ? { shortcut: command.shortcut } : {}),
        isEnabled: () => this.isBuiltInEnabled(command.id),
        execute: () => { this.getActiveDocument()?.executeCommand(command.id) },
      })
    }
  }

  register(definition: EditorCommandDefinition): void {
    this.registry.register(definition)
  }

  unregister(id: string): boolean {
    return this.registry.unregister(id)
  }

  getSnapshot(): readonly CommandSnapshot[] {
    return Object.freeze(this.registry.getSnapshot(this.context()).filter((command) => command.enabled))
  }

  findByShortcut(shortcut: string): CommandSnapshot | undefined {
    const command = this.registry.findByShortcut(shortcut)
    return this.getSnapshot().find((snapshot) => snapshot.id === command?.id)
  }

  execute(id: string): CommandResult {
    return this.registry.execute(id, this.context())
  }

  private context() {
    const activeDocumentId = this.getActiveDocumentId()
    return activeDocumentId === undefined ? {} : { activeDocumentId }
  }

  private isBuiltInEnabled(command: EditorCommand): boolean {
    const kit = this.getActiveDocument()
    if (!kit) return false
    const selectionCount = kit.selection.get().length
    const hasSelection = selectionCount > 0 || kit.getSelectedConnector() !== undefined
    switch (command) {
      case 'select-all': return kit.getScene().nodes.some((node) => kit.isNodeInteractive(node.id))
      case 'clear-selection':
      case 'delete-selection': return hasSelection
      case 'group-selection':
      case 'ungroup-selection':
      case 'copy':
      case 'cut':
      case 'duplicate': return selectionCount > 0
      case 'align-left':
      case 'align-center':
      case 'align-right':
      case 'align-top':
      case 'align-middle':
      case 'align-bottom':
      case 'distribute-horizontal':
      case 'distribute-vertical': return selectionCount > 1
      case 'paste': return true
    }
  }
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
  readonly commands = new EditorSessionCommands(
    () => this.getActiveDocument(),
    () => this.activeDocumentId,
  )

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

const builtInCommands: readonly Readonly<{ id: EditorCommand; title: string; shortcut?: string }>[] = [
  { id: 'select-all', title: 'Select all', shortcut: 'Mod+A' },
  { id: 'clear-selection', title: 'Clear selection', shortcut: 'Escape' },
  { id: 'delete-selection', title: 'Delete selection', shortcut: 'Backspace' },
  { id: 'group-selection', title: 'Group selection', shortcut: 'Mod+G' },
  { id: 'ungroup-selection', title: 'Ungroup selection', shortcut: 'Mod+Shift+G' },
  { id: 'copy', title: 'Copy', shortcut: 'Mod+C' },
  { id: 'cut', title: 'Cut', shortcut: 'Mod+X' },
  { id: 'paste', title: 'Paste', shortcut: 'Mod+V' },
  { id: 'duplicate', title: 'Duplicate', shortcut: 'Mod+D' },
  { id: 'align-left', title: 'Align left' },
  { id: 'align-center', title: 'Align center' },
  { id: 'align-right', title: 'Align right' },
  { id: 'align-top', title: 'Align top' },
  { id: 'align-middle', title: 'Align middle' },
  { id: 'align-bottom', title: 'Align bottom' },
  { id: 'distribute-horizontal', title: 'Distribute horizontally' },
  { id: 'distribute-vertical', title: 'Distribute vertically' },
]
