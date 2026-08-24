import type { CanvasKit } from './canvas-kit.js'

export function attachKeyboardInput(element: HTMLElement, canvas: CanvasKit): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a') {
      event.preventDefault()
      canvas.selection.selectAll()
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault()
      canvas.deleteSelection()
    }
  }
  element.addEventListener('keydown', onKeyDown)
  return () => element.removeEventListener('keydown', onKeyDown)
}
