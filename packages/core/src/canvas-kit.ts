import { screenToWorld, type Point } from '@canvaskit/geometry'
import type { CanvasScene } from './model.js'
import { createScene } from './scene.js'
import { loadScene, serializeScene } from './serialization.js'
import { ViewportController } from './viewport.js'
import { SelectionController } from './selection.js'

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
