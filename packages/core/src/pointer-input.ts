import type { CanvasKit, CanvasPointerEventType } from './canvas-kit.js'

export function attachPointerInput(element: HTMLElement, canvas: CanvasKit): () => void {
  const emit = (type: CanvasPointerEventType, event: PointerEvent) => {
    const rect = element.getBoundingClientRect()
    canvas.createPointerEvent({ x: event.clientX - rect.left, y: event.clientY - rect.top }, type)
  }

  const onPointerDown = (event: PointerEvent) => emit('pointerdown', event)
  const onPointerMove = (event: PointerEvent) => emit('pointermove', event)
  const onPointerUp = (event: PointerEvent) => emit('pointerup', event)

  element.addEventListener('pointerdown', onPointerDown)
  element.addEventListener('pointermove', onPointerMove)
  element.addEventListener('pointerup', onPointerUp)

  return () => {
    element.removeEventListener('pointerdown', onPointerDown)
    element.removeEventListener('pointermove', onPointerMove)
    element.removeEventListener('pointerup', onPointerUp)
  }
}
