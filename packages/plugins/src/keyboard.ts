import { attachKeyboardInput, type CanvasPlugin } from '@canvaskit/core'

export function createKeyboardPlugin(element: HTMLElement): CanvasPlugin {
  return {
    id: 'keyboard',
    install: (canvas) => attachKeyboardInput(element, canvas),
  }
}
