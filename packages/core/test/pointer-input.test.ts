import { expect, it } from 'vitest'
import { attachPointerInput, CanvasKit } from '../src/index.js'

class FakeElement {
  readonly handlers = new Map<string, EventListener>()

  addEventListener(type: string, listener: EventListener): void { this.handlers.set(type, listener) }
  removeEventListener(type: string): void { this.handlers.delete(type) }
  getBoundingClientRect(): DOMRect { return { left: 10, top: 20 } as DOMRect }
  dispatch(type: string, event: Event): void { this.handlers.get(type)?.(event) }
}

it('emits element-local pointer coordinates', () => {
  const element = new FakeElement()
  const canvas = new CanvasKit()
  const received: unknown[] = []
  canvas.onPointer((event) => received.push(event))

  attachPointerInput(element as unknown as HTMLElement, canvas)
  element.dispatch('pointermove', { clientX: 35, clientY: 65 } as PointerEvent)

  expect(received).toContainEqual({
    type: 'pointermove', screen: { x: 25, y: 45 }, world: { x: 25, y: 45 },
  })
})

it('forwards selection modifier state with pointer events', () => {
  const element = new FakeElement()
  const canvas = new CanvasKit()
  const received: unknown[] = []
  canvas.onPointer((event) => received.push(event))

  attachPointerInput(element as unknown as HTMLElement, canvas)
  element.dispatch('pointerdown', { clientX: 35, clientY: 65, shiftKey: true, metaKey: true, ctrlKey: false } as PointerEvent)

  expect(received).toContainEqual({
    type: 'pointerdown', screen: { x: 25, y: 45 }, world: { x: 25, y: 45 },
    modifiers: { shiftKey: true, metaKey: true, ctrlKey: false },
  })
})

it('forwards pointer button state with pointer events', () => {
  const element = new FakeElement()
  const canvas = new CanvasKit()
  const received: unknown[] = []
  canvas.onPointer((event) => received.push(event))

  attachPointerInput(element as unknown as HTMLElement, canvas)
  element.dispatch('pointerdown', { button: 1, buttons: 4, clientX: 35, clientY: 65 } as PointerEvent)

  expect(received).toContainEqual({
    type: 'pointerdown', screen: { x: 25, y: 45 }, world: { x: 25, y: 45 },
    button: 1, buttons: 4,
  })
})

it('pans with a middle-button drag', () => {
  const element = new FakeElement()
  const canvas = new CanvasKit()

  attachPointerInput(element as unknown as HTMLElement, canvas)
  element.dispatch('pointerdown', { button: 1, clientX: 10, clientY: 20 } as PointerEvent)
  element.dispatch('pointermove', { clientX: 30, clientY: 50 } as PointerEvent)
  element.dispatch('pointerup', { button: 1, clientX: 30, clientY: 50 } as PointerEvent)

  expect(canvas.viewport.getTransform()).toMatchObject({ x: 20, y: 30 })
})

it('zooms at the wheel pointer location', () => {
  const element = new FakeElement()
  const canvas = new CanvasKit()

  attachPointerInput(element as unknown as HTMLElement, canvas)
  element.dispatch('wheel', { clientX: 310, clientY: 220, deltaY: -100, preventDefault() {} } as WheelEvent)

  expect(canvas.viewport.getTransform().zoom).toBeGreaterThan(1)
  expect(canvas.createPointerEvent({ x: 300, y: 200 }, 'pointermove').world).toEqual({ x: 300, y: 200 })
})
