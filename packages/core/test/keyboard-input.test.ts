import { addEdge, addGroup, addRectangle, attachKeyboardInput, CanvasKit, createScene, importScene } from '../src/index.js'
import { expect, it } from 'vitest'

class FakeKeyboardTarget {
  readonly handlers = new Map<string, EventListener>()
  addEventListener(type: string, listener: EventListener): void { this.handlers.set(type, listener) }
  removeEventListener(type: string): void { this.handlers.delete(type) }
  dispatch(event: KeyboardEvent): void { this.handlers.get('keydown')?.(event) }
}

it('maps workflow shortcuts to CanvasKit commands', () => {
  const target = new FakeKeyboardTarget()
  const canvas = new CanvasKit({ scene: addRectangle(createScene(), { id: 'a', position: { x: 0, y: 0 }, size: { width: 1, height: 1 }, fill: '#fff' }) })
  attachKeyboardInput(target as unknown as HTMLElement, canvas)

  const dispatch = (event: Partial<KeyboardEvent>) => {
    let prevented = false
    target.dispatch({ preventDefault: () => { prevented = true }, ...event } as KeyboardEvent)
    return prevented
  }

  expect(dispatch({ key: 'a', metaKey: true })).toBe(true)
  expect(canvas.selection.get()).toEqual(['a'])
  expect(dispatch({ key: 'c', ctrlKey: true })).toBe(true)
  expect(dispatch({ key: 'v', ctrlKey: true })).toBe(true)
  expect(canvas.getScene().nodes.map((node) => node.id)).toEqual(['a', 'a-copy'])
  expect(dispatch({ key: 'd', metaKey: true })).toBe(true)
  expect(canvas.getScene().nodes.map((node) => node.id)).toEqual(['a', 'a-copy', 'a-copy-copy'])
  expect(dispatch({ key: 'x', ctrlKey: true })).toBe(true)
  expect(canvas.getScene().nodes.map((node) => node.id)).toEqual(['a', 'a-copy'])
  expect(dispatch({ key: 'Escape' })).toBe(true)
  expect(canvas.selection.get()).toEqual([])
  expect(dispatch({ key: 'a', ctrlKey: true })).toBe(true)
  expect(dispatch({ key: 'Backspace' })).toBe(true)
  expect(canvas.getScene().nodes).toEqual([])
})

it('maps Delete and leaves ordinary typing inside editable descendants untouched', () => {
  const target = new FakeKeyboardTarget()
  const canvas = new CanvasKit({ scene: addRectangle(createScene(), { id: 'a', position: { x: 0, y: 0 }, size: { width: 1, height: 1 }, fill: '#fff' }) })
  attachKeyboardInput(target as unknown as HTMLElement, canvas)

  target.dispatch({ key: 'a', metaKey: true, preventDefault() {} } as KeyboardEvent)
  target.dispatch({ key: 'Delete', preventDefault() {} } as KeyboardEvent)
  expect(canvas.getScene().nodes).toEqual([])

  for (const editableTarget of [
    { tagName: 'INPUT' },
    { tagName: 'TEXTAREA' },
    { tagName: 'SELECT' },
    { tagName: 'SPAN', isContentEditable: true },
    { tagName: 'SPAN', closest: () => ({}) },
  ]) {
    let prevented = false
    target.dispatch({
      key: 'a', metaKey: true, target: editableTarget,
      preventDefault: () => { prevented = true },
    } as unknown as KeyboardEvent)
    expect(prevented).toBe(false)
  }
})

it('maps Delete to relation-safe graph removal', () => {
  const target = new FakeKeyboardTarget()
  let scene = addRectangle(createScene(), { id: 'a', position: { x: 0, y: 0 }, size: { width: 1, height: 1 }, fill: '#fff' })
  scene = addRectangle(scene, { id: 'b', position: { x: 2, y: 0 }, size: { width: 1, height: 1 }, fill: '#000' })
  scene = addEdge(scene, { id: 'ab', sourceId: 'a', targetId: 'b', type: 'line' })
  scene = addGroup(scene, { id: 'pair', nodeIds: ['a', 'b'] })
  const canvas = new CanvasKit({ scene })
  canvas.selection.set(['a'])
  attachKeyboardInput(target as unknown as HTMLElement, canvas)

  target.dispatch({ key: 'Delete', preventDefault() {} } as KeyboardEvent)

  expect(canvas.getScene().nodes.map((node) => node.id)).toEqual(['b'])
  expect(canvas.getScene().connectors).toEqual([])
  expect(canvas.getScene().groups).toEqual([{ id: 'pair', nodeIds: ['b'], visible: true, locked: false }])
  expect(importScene(canvas.toJSON())).toEqual(canvas.getScene())
})
