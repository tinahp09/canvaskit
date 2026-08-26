import type { CanvasScene } from './model.js'

export type SceneListener = (scene: CanvasScene) => void

export class SceneSubscription {
  private readonly listeners = new Set<SceneListener>()

  subscribe(listener: SceneListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  notify(scene: CanvasScene): void {
    this.listeners.forEach((listener) => listener(scene))
  }
}
