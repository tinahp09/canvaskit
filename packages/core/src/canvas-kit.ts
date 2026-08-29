import { screenToWorld, type Point } from '@canvaskit/geometry'
import type { CanvasScene } from './model.js'
import { createScene } from './scene.js'
import { loadScene, serializeScene } from './serialization.js'
import { ViewportController } from './viewport.js'
import { SelectionController } from './selection.js'
import { HistoryController, type SceneCommand } from './history.js'
import { copySelection, pasteSelection, removeSelection, type SceneClipboard } from './clipboard.js'
import type { EditorCommand } from './editor-command.js'
import type { CanvasPlugin } from './plugin.js'
import { EdgeRegistry, NodeRegistry } from './registry.js'
import { SceneSubscription, type SceneListener } from './scene-subscription.js'

export type CanvasPointerEventType = 'pointerdown' | 'pointermove' | 'pointerup'

export interface CanvasPointerEvent {
  type: CanvasPointerEventType
  screen: Point
  world: Point
}

export interface CanvasKitOptions {
  scene?: CanvasScene
}

export class CanvasKit {
  private scene: CanvasScene
  private readonly listeners = new Set<(event: CanvasPointerEvent) => void>()
  private readonly sceneSubscription = new SceneSubscription()
  private readonly history = new HistoryController()
  private clipboard: SceneClipboard = { nodes: [], edges: [], groups: [] }
  private readonly pluginIds = new Set<string>()
  private readonly pluginCleanups: Array<() => void> = []
  viewport: ViewportController
  readonly selection: SelectionController
  readonly nodes = new NodeRegistry()
  readonly edges = new EdgeRegistry()

  constructor(options: CanvasKitOptions = {}) {
    this.scene = options.scene ?? createScene()
    this.viewport = this.createViewport(this.scene)
    this.selection = new SelectionController(() => this.getScene(), () => this.notifyScene())
  }

  getScene(): CanvasScene {
    return { ...this.scene, viewport: this.viewport.getTransform() }
  }

  setScene(scene: CanvasScene): void {
    this.clearHistory()
    this.applyScene(scene)
    this.notifyScene()
  }

  private createViewport(scene: CanvasScene): ViewportController {
    return new ViewportController(scene.viewport, () => {
      this.history.clearRedo()
      this.notifyScene()
    })
  }

  private applyScene(scene: CanvasScene): void {
    this.scene = scene
    this.viewport = this.createViewport(scene)
    this.selection.retainExisting()
  }

  execute(command: SceneCommand): CanvasScene {
    this.applyScene(this.history.execute(this.getScene(), command))
    this.notifyScene()
    return this.getScene()
  }

  undo(): CanvasScene {
    this.applyScene(this.history.undo(this.getScene()))
    this.notifyScene()
    return this.getScene()
  }

  redo(): CanvasScene {
    this.applyScene(this.history.redo(this.getScene()))
    this.notifyScene()
    return this.getScene()
  }

  clearHistory(): void {
    this.history.clear()
  }

  beginTransaction(label: string): void {
    this.history.beginTransaction(label)
  }

  commitTransaction(): void {
    this.history.commitTransaction()
  }

  copy(): SceneClipboard {
    this.clipboard = copySelection(this.getScene(), this.selection.get())
    return this.clipboard
  }

  cut(): SceneClipboard {
    const ids = this.selection.get()
    if (ids.length === 0) return this.clipboard

    const before = this.getScene()
    this.clipboard = copySelection(before, ids)
    const after = removeSelection(before, [...ids])
    this.execute({
      label: 'cut selection',
      execute: () => after,
      undo: () => before,
    })
    this.selection.clear()
    return this.clipboard
  }

  paste(offset: Point = { x: 20, y: 20 }): string[] {
    const before = this.getScene()
    const result = pasteSelection(before, this.clipboard, offset)
    if (result.ids.length === 0) return []

    this.execute({
      label: 'paste selection',
      execute: () => result.scene,
      undo: () => before,
    })
    this.selection.clear()
    this.selection.selectMultiple(result.ids)
    return result.ids
  }

  duplicate(): string[] {
    this.copy()
    return this.paste({ x: 20, y: 20 })
  }

  executeCommand(command: EditorCommand): boolean {
    switch (command) {
      case 'select-all':
        this.selection.selectAll()
        return true
      case 'clear-selection':
        this.selection.clear()
        return true
      case 'delete-selection':
        this.deleteSelection()
        return true
      case 'copy':
        if (this.selection.get().length === 0) return false
        this.copy()
        return true
      case 'cut':
        if (this.selection.get().length === 0) return false
        this.cut()
        return true
      case 'paste':
        return this.paste().length > 0
      case 'duplicate':
        if (this.selection.get().length === 0) return false
        return this.duplicate().length > 0
    }
  }

  use(plugin: CanvasPlugin): void {
    if (this.pluginIds.has(plugin.id)) {
      throw new Error(`Plugin "${plugin.id}" is already installed.`)
    }
    this.pluginIds.add(plugin.id)
    try {
      const cleanup = plugin.install(this)
      if (cleanup) this.pluginCleanups.push(cleanup)
    } catch (error) {
      this.pluginIds.delete(plugin.id)
      throw error
    }
  }

  dispose(): void {
    while (this.pluginCleanups.length > 0) {
      this.pluginCleanups.pop()?.()
    }
  }

  toJSON(): string { return serializeScene(this.getScene()) }

  load(json: string): void { this.setScene(loadScene(json)) }

  deleteSelection(): void {
    const ids = new Set(this.selection.get())
    if (ids.size === 0) return
    const before = this.getScene()
    const after = { ...before, nodes: before.nodes.filter((node) => !ids.has(node.id)) }
    this.execute({ label: 'delete selection', execute: () => after, undo: () => before })
    this.selection.clear()
  }

  onPointer(listener: (event: CanvasPointerEvent) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  subscribe(listener: SceneListener): () => void {
    return this.sceneSubscription.subscribe(listener)
  }

  private notifyScene(): void {
    this.sceneSubscription.notify(this.getScene())
  }

  createPointerEvent(screen: Point, type: CanvasPointerEventType): CanvasPointerEvent {
    const event = { type, screen, world: screenToWorld(screen, this.viewport.getTransform()) }
    this.listeners.forEach((listener) => listener(event))
    return event
  }
}
