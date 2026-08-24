import { addRectangle, attachKeyboardInput, CanvasKit, createScene } from '../src/index.js'
import { expect, it } from 'vitest'

class FakeKeyboardTarget {
  readonly handlers = new Map<string, EventListener>()
  addEventListener(type: string, listener: EventListener): void { this.handlers.set(type, listener) }
  removeEventListener(type: string): void { this.handlers.delete(type) }
  dispatch(event: KeyboardEvent): void { this.handlers.get('keydown')?.(event) }
}

it('selects all with primary modifier and deletes selection', () => {
  const target = new FakeKeyboardTarget()
  const canvas = new CanvasKit({ scene: addRectangle(createScene(), { id: 'a', position: { x: 0, y: 0 }, size: { width: 1, height: 1 }, fill: '#fff' }) })
  attachKeyboardInput(target as unknown as HTMLElement, canvas)
  target.dispatch({ key: 'a', metaKey: true, preventDefault() {} } as KeyboardEvent)
  expect(canvas.selection.get()).toEqual(['a'])
  target.dispatch({ key: 'Delete', preventDefault() {} } as KeyboardEvent)
  expect(canvas.getScene().nodes).toEqual([])
})
