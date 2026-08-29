import type { CanvasKit, CanvasPointerEventType } from './canvas-kit.js'

export function attachPointerInput(element: HTMLElement, canvas: CanvasKit): () => void {
  let lastPanPoint: { x: number; y: number } | undefined

  const emit = (type: CanvasPointerEventType, event: PointerEvent) => {
    const rect = element.getBoundingClientRect()
    const scale = typeof HTMLCanvasElement !== 'undefined' && element instanceof HTMLCanvasElement
      ? { x: element.width / rect.width, y: element.height / rect.height }
      : { x: 1, y: 1 }
    const modifiers = { shiftKey: event.shiftKey, metaKey: event.metaKey, ctrlKey: event.ctrlKey }
    canvas.createPointerEvent(
      { x: (event.clientX - rect.left) * scale.x, y: (event.clientY - rect.top) * scale.y },
      type,
      modifiers.shiftKey || modifiers.metaKey || modifiers.ctrlKey ? modifiers : undefined,
    )
  }

  const onPointerDown = (event: PointerEvent) => {
    if (event.button === 1) lastPanPoint = { x: event.clientX, y: event.clientY }
    emit('pointerdown', event)
  }
  const onPointerMove = (event: PointerEvent) => {
    if (lastPanPoint) {
      canvas.viewport.panBy({ x: event.clientX - lastPanPoint.x, y: event.clientY - lastPanPoint.y })
      lastPanPoint = { x: event.clientX, y: event.clientY }
    }
    emit('pointermove', event)
  }
  const onPointerUp = (event: PointerEvent) => {
    lastPanPoint = undefined
    emit('pointerup', event)
  }
  const onWheel = (event: WheelEvent) => {
    const rect = element.getBoundingClientRect()
    canvas.viewport.zoomAt(
      { x: event.clientX - rect.left, y: event.clientY - rect.top },
      Math.exp(-event.deltaY * 0.001),
    )
    event.preventDefault()
  }

  element.addEventListener('pointerdown', onPointerDown)
  element.addEventListener('pointermove', onPointerMove)
  element.addEventListener('pointerup', onPointerUp)
  element.addEventListener('wheel', onWheel, { passive: false })

  return () => {
    element.removeEventListener('pointerdown', onPointerDown)
    element.removeEventListener('pointermove', onPointerMove)
    element.removeEventListener('pointerup', onPointerUp)
    element.removeEventListener('wheel', onWheel)
  }
}
