import { screenToWorld, type Point } from '@canvaskit/geometry'
import type { CanvasScene } from './model.js'
import { createScene } from './scene.js'
import { loadScene, serializeScene } from './serialization.js'
import { ViewportController } from './viewport.js'
import { SelectionController } from './selection.js'
import { HistoryController, type SceneCommand } from './history.js'
import { copySelection, pasteSelection, type SceneClipboard } from './clipboard.js'

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
  private readonly history = new HistoryController()
  private clipboard: SceneClipboard = { nodes: [], edges: [], groups: [] }
  viewport: ViewportController
  readonly selection: SelectionController

  constructor(options: CanvasKitOptions = {}) {
    this.scene = options.scene ?? createScene()
    this.viewport = new ViewportController(this.scene.viewport)
    this.selection = new SelectionController(() => this.getScene())
  }

  getScene(): CanvasScene {
    return { ...this.scene, viewport: this.viewport.getTransform() }
  }

  setScene(scene: CanvasScene): void {
    this.scene = scene
    this.viewport = new ViewportController(scene.viewport)
  }

  execute(command: SceneCommand): CanvasScene {
    this.setScene(this.history.execute(this.getScene(), command))
    return this.getScene()
  }

  undo(): CanvasScene {
    this.setScene(this.history.undo(this.getScene()))
    return this.getScene()
  }

  redo(): CanvasScene {
    this.setScene(this.history.redo(this.getScene()))
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

  toJSON(): string { return serializeScene(this.getScene()) }

  load(json: string): void { this.setScene(loadScene(json)) }

  deleteSelection(): void {
    const ids = new Set(this.selection.get())
    this.scene = { ...this.scene, nodes: this.scene.nodes.filter((node) => !ids.has(node.id)) }
    this.selection.clear()
  }

  onPointer(listener: (event: CanvasPointerEvent) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  createPointerEvent(screen: Point, type: CanvasPointerEventType): CanvasPointerEvent {
    const event = { type, screen, world: screenToWorld(screen, this.viewport.getTransform()) }
    this.listeners.forEach((listener) => listener(event))
    return event
  }
}
