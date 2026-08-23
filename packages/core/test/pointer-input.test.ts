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
