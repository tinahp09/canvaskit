import type { CanvasKit, CanvasPointerEventType } from './canvas-kit.js'

export function attachPointerInput(element: HTMLElement, canvas: CanvasKit): () => void {
  let lastPanPoint: { x: number; y: number } | undefined

  const screenPoint = (event: MouseEvent) => {
    const rect = element.getBoundingClientRect()
    const scale = typeof HTMLCanvasElement !== 'undefined' && element instanceof HTMLCanvasElement
      ? { x: element.width / rect.width, y: element.height / rect.height }
      : { x: 1, y: 1 }
    return { x: (event.clientX - rect.left) * scale.x, y: (event.clientY - rect.top) * scale.y }
  }

  const emit = (type: CanvasPointerEventType, event: PointerEvent, screen = screenPoint(event)) => {
    const modifiers = { shiftKey: event.shiftKey, metaKey: event.metaKey, ctrlKey: event.ctrlKey }
    canvas.createPointerEvent(
      screen,
      type,
      modifiers.shiftKey || modifiers.metaKey || modifiers.ctrlKey ? modifiers : undefined,
      event.button,
      event.buttons,
    )
  }

  const onPointerDown = (event: PointerEvent) => {
    const screen = screenPoint(event)
    if (event.button === 1) lastPanPoint = screen
    emit('pointerdown', event, screen)
  }
  const onPointerMove = (event: PointerEvent) => {
    const screen = screenPoint(event)
    if (lastPanPoint) {
      canvas.viewport.panBy({ x: screen.x - lastPanPoint.x, y: screen.y - lastPanPoint.y })
      lastPanPoint = screen
    }
    emit('pointermove', event, screen)
  }
  const onPointerUp = (event: PointerEvent) => {
    if (event.button === 1) lastPanPoint = undefined
    emit('pointerup', event)
  }
  const onWheel = (event: WheelEvent) => {
    canvas.viewport.zoomAt(
      screenPoint(event),
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
