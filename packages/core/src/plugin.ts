import type { CanvasKit } from './canvas-kit.js'
import type { CanvasScene } from './model.js'

export interface CanvasPlugin {
  id: string
  install(canvas: CanvasKit): void | (() => void)
}

export interface Renderer {
  render(scene: CanvasScene): void
}
