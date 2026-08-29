import { expect, it } from 'vitest'
import { addEdge, addGroup, addRectangle, CanvasKit, createScene, importScene, UnsupportedPersistentRotationError, type CanvasScene } from '../src/index.js'

it('reports pointer coordinates in screen and world space', () => {
  const canvas = new CanvasKit()
  canvas.viewport.panBy({ x: 10, y: 20 })

  expect(canvas.createPointerEvent({ x: 30, y: 50 }, 'pointermove')).toEqual({
    type: 'pointermove', screen: { x: 30, y: 50 }, world: { x: 20, y: 30 },
  })
})

it('applies marquee results with explicit selection semantics', () => {
  const scene = addRectangle(addRectangle(createScene(), {
    id: 'a', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff',
  }), {
    id: 'b', position: { x: 20, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff',
  })
  const canvas = new CanvasKit({ scene })

  expect(canvas.selectInRect({ x: 0, y: 0, width: 10, height: 10 })).toEqual(['a'])
  expect(canvas.selectInRect({ x: 25, y: 0, width: 10, height: 10 }, { mode: 'intersect', selection: 'add' })).toEqual(['b'])
  expect(canvas.selection.get()).toEqual(['a', 'b'])
})

it('deletes through the command without leaving dangling graph records and restores one scene on undo', () => {
  let scene = addRectangle(createScene(), { id: 'a', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff' })
  scene = addRectangle(scene, { id: 'b', position: { x: 20, y: 0 }, size: { width: 10, height: 10 }, fill: '#000' })
  scene = addRectangle(scene, { id: 'c', position: { x: 40, y: 0 }, size: { width: 10, height: 10 }, fill: '#123' })
  scene = addEdge(scene, { id: 'ab', sourceId: 'a', targetId: 'b', type: 'line' })
  scene = addEdge(scene, { id: 'bc', sourceId: 'b', targetId: 'c', type: 'arrow' })
  scene = addGroup(scene, { id: 'pair', nodeIds: ['a', 'b'] })
  scene = addGroup(scene, { id: 'only-a', nodeIds: ['a'] })
  const kit = new CanvasKit({ scene })
  kit.selection.set(['a'])

  expect(kit.executeCommand('delete-selection')).toBe(true)
  expect(kit.getScene().nodes.map((node) => node.id)).toEqual(['b', 'c'])
  expect(kit.getScene().edges).toEqual([{ id: 'bc', sourceId: 'b', targetId: 'c', type: 'arrow' }])
  expect(kit.getScene().groups).toEqual([{ id: 'pair', nodeIds: ['b'] }])
  expect(importScene(kit.toJSON())).toEqual(kit.getScene())
  expect(kit.undo()).toEqual(scene)
})

it('loads serialized scene data', () => {
  const canvas = new CanvasKit()
  canvas.load('{"version":1,"nodes":[],"viewport":{"x":4,"y":5,"zoom":2},"metadata":{}}')
  expect(canvas.getScene().viewport).toEqual({ x: 4, y: 5, zoom: 2 })
})

it('reflects viewport navigation in the scene snapshot', () => {
  const canvas = new CanvasKit()
  canvas.viewport.panBy({ x: 10, y: 20 })
  expect(canvas.getScene().viewport).toEqual({ x: 10, y: 20, zoom: 1 })
})

it('undoes then redoes an executed scene command', () => {
  const kit = new CanvasKit()
  const before = kit.getScene()

  kit.execute({
    label: 'add',
    execute: (scene) => addRectangle(scene, {
      id: 'a', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff',
    }),
    undo: () => before,
  })

  expect(kit.undo().nodes).toEqual([])
  expect(kit.redo().nodes).toHaveLength(1)
})

it('clears redo history when a direct scene replacement creates a newer state', () => {
  const kit = new CanvasKit()
  const before = kit.getScene()
  kit.execute({
    label: 'add a',
    execute: (scene) => addRectangle(scene, { id: 'a', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff' }),
    undo: () => before,
  })
  kit.undo()
  kit.setScene(addRectangle(kit.getScene(), { id: 'newer', position: { x: 10, y: 0 }, size: { width: 10, height: 10 }, fill: '#000' }))

  expect(kit.redo().nodes.map((node) => node.id)).toEqual(['newer'])
})

it('clears redo history when panning after undo without recording navigation', () => {
  const kit = new CanvasKit()
  const before = kit.getScene()
  kit.execute({
    label: 'add a',
    execute: (scene) => addRectangle(scene, { id: 'a', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff' }),
    undo: () => before,
  })
  kit.undo()
  kit.viewport.panBy({ x: 12, y: 24 })

  expect(kit.undo().nodes).toEqual([])
  expect(kit.getScene().viewport).toEqual({ x: 12, y: 24, zoom: 1 })

  expect(kit.redo().nodes).toEqual([])
  expect(kit.getScene().viewport).toEqual({ x: 12, y: 24, zoom: 1 })
})

it('clears redo history when zooming after undo without recording navigation', () => {
  const kit = new CanvasKit()
  const before = kit.getScene()
  kit.execute({
    label: 'add a',
    execute: (scene) => addRectangle(scene, { id: 'a', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff' }),
    undo: () => before,
  })
  kit.undo()
  kit.viewport.zoomAt({ x: 100, y: 50 }, 2)

  expect(kit.undo().nodes).toEqual([])
  expect(kit.getScene().viewport).toEqual({ x: -100, y: -50, zoom: 2 })

  expect(kit.redo().nodes).toEqual([])
  expect(kit.getScene().viewport).toEqual({ x: -100, y: -50, zoom: 2 })
})

it('rejects setScene during an active transaction without replacing the scene or history', () => {
  const kit = new CanvasKit()
  const initial = kit.getScene()
  kit.execute({
    label: 'add a',
    execute: (scene) => addRectangle(scene, { id: 'a', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff' }),
    undo: () => initial,
  })
  const beforeReplacement = kit.getScene()
  kit.beginTransaction('active')

  expect(() => kit.setScene(addRectangle(beforeReplacement, { id: 'b', position: { x: 10, y: 0 }, size: { width: 10, height: 10 }, fill: '#000' }))).toThrow('Cannot clear history for while a history transaction is active.')
  expect(kit.getScene()).toEqual(beforeReplacement)

  kit.commitTransaction()
  expect(kit.undo()).toEqual(initial)
})

it('clears undo and redo history after importing a scene', () => {
  const kit = new CanvasKit()
  const before = kit.getScene()

  kit.execute({
    label: 'add',
    execute: (scene) => addRectangle(scene, {
      id: 'a', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff',
    }),
    undo: () => before,
  })
  kit.clearHistory()

  expect(kit.undo()).toEqual(kit.getScene())

  kit.execute({
    label: 'add again',
    execute: (scene) => addRectangle(scene, {
      id: 'b', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff',
    }),
    undo: () => before,
  })
  kit.undo()
  kit.clearHistory()

  expect(kit.redo()).toEqual(kit.getScene())
})

it('undoes a transaction as one history entry', () => {
  const kit = new CanvasKit()
  const before = kit.getScene()
  const add = (id: string) => ({
    label: `add ${id}`,
    execute: (scene: CanvasScene) => addRectangle(scene, {
      id, position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff',
    }),
    undo: () => before,
  })

  kit.beginTransaction('build workflow')
  kit.execute(add('a'))
  kit.execute(add('b'))
  kit.commitTransaction()

  expect(kit.undo().nodes).toEqual([])
})

it('resizes the current selection as one undoable history command', () => {
  const scene = addRectangle(createScene(), {
    id: 'rectangle', position: { x: 10, y: 20 }, size: { width: 30, height: 40 }, fill: '#fff',
  })
  const kit = new CanvasKit({ scene })
  kit.selection.select('rectangle')

  expect(kit.resizeSelection('east', { x: 70, y: 40 })).toBe(true)
  expect(kit.getScene().nodes[0]).toMatchObject({ position: { x: 10, y: 20 }, size: { width: 60, height: 40 } })
  expect(kit.undo()).toEqual(scene)
  expect(kit.redo().nodes[0]).toMatchObject({ position: { x: 10, y: 20 }, size: { width: 60, height: 40 } })
  expect(kit.undo()).toEqual(scene)
  expect(kit.undo()).toEqual(scene)
})

it('returns false when resize selection cannot alter the scene', () => {
  const scene = addRectangle(createScene(), {
    id: 'rectangle', position: { x: 10, y: 20 }, size: { width: 30, height: 40 }, fill: '#fff',
  })
  const kit = new CanvasKit({ scene })

  expect(kit.resizeSelection('east', { x: 40, y: 40 })).toBe(false)
  kit.selection.select('rectangle')
  expect(kit.resizeSelection('east', { x: 40, y: 40 })).toBe(false)
  expect(kit.undo()).toEqual(scene)
})

it('preserves the controller typed rotation error without recording history', () => {
  const scene = addRectangle(createScene(), {
    id: 'rectangle', position: { x: 10, y: 20 }, size: { width: 30, height: 40 }, fill: '#fff',
  })
  const kit = new CanvasKit({ scene })
  kit.selection.select('rectangle')

  expect(() => kit.resizeSelection('rotate', { x: 25, y: 0 })).toThrow(UnsupportedPersistentRotationError)
  expect(kit.getScene()).toEqual(scene)
  expect(kit.undo()).toEqual(scene)
})

it('aligns the current selection without disturbing graph and group relationships', () => {
  let scene = addRectangle(createScene(), {
    id: 'left', position: { x: 0, y: 10 }, size: { width: 10, height: 10 }, fill: '#fff',
  })
  scene = addRectangle(scene, {
    id: 'right', position: { x: 30, y: 20 }, size: { width: 20, height: 10 }, fill: '#000',
  })
  scene = addEdge(scene, { id: 'edge', sourceId: 'left', targetId: 'right', type: 'line' })
  scene = addGroup(scene, { id: 'pair', nodeIds: ['left', 'right'] })
  const kit = new CanvasKit({ scene })
  kit.selection.set(['left', 'right'])

  expect(kit.alignSelection('left')).toBe(true)
  expect(kit.getScene().nodes.map((node) => node.position)).toEqual([{ x: 0, y: 10 }, { x: 0, y: 20 }])
  expect(kit.getScene().edges).toEqual(scene.edges)
  expect(kit.getScene().groups).toEqual(scene.groups)
  expect(kit.undo()).toEqual(scene)
  expect(kit.redo().nodes.map((node) => node.position)).toEqual([{ x: 0, y: 10 }, { x: 0, y: 20 }])
  expect(kit.undo()).toEqual(scene)
  expect(kit.undo()).toEqual(scene)
})

it('does not record history for an already aligned multi-selection', () => {
  let scene = addRectangle(createScene(), {
    id: 'first', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff',
  })
  scene = addRectangle(scene, {
    id: 'second', position: { x: 0, y: 20 }, size: { width: 10, height: 10 }, fill: '#000',
  })
  const kit = new CanvasKit({ scene })
  kit.selection.selectAll()

  expect(kit.alignSelection('left')).toBe(false)
  expect(kit.undo()).toEqual(scene)
})

it('distributes the current selection and treats insufficient or unchanged selections as no-ops', () => {
  let scene = addRectangle(createScene(), {
    id: 'first', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff',
  })
  scene = addRectangle(scene, {
    id: 'middle', position: { x: 30, y: 0 }, size: { width: 10, height: 10 }, fill: '#000',
  })
  scene = addRectangle(scene, {
    id: 'last', position: { x: 80, y: 0 }, size: { width: 10, height: 10 }, fill: '#123',
  })
  const kit = new CanvasKit({ scene })

  expect(kit.distributeSelection('horizontal')).toBe(false)
  kit.selection.select('first')
  expect(kit.distributeSelection('horizontal')).toBe(false)
  kit.selection.set(['first', 'middle', 'last'])
  expect(kit.distributeSelection('horizontal')).toBe(true)
  expect(kit.getScene().nodes.map((node) => node.position)).toEqual([{ x: 0, y: 0 }, { x: 40, y: 0 }, { x: 80, y: 0 }])
  expect(kit.undo()).toEqual(scene)
  expect(kit.redo().nodes.map((node) => node.position)).toEqual([{ x: 0, y: 0 }, { x: 40, y: 0 }, { x: 80, y: 0 }])
  expect(kit.undo()).toEqual(scene)
  expect(kit.undo()).toEqual(scene)
})

it('does not record history for an already distributed multi-selection', () => {
  let scene = addRectangle(createScene(), {
    id: 'first', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff',
  })
  scene = addRectangle(scene, {
    id: 'second', position: { x: 40, y: 0 }, size: { width: 10, height: 10 }, fill: '#000',
  })
  scene = addRectangle(scene, {
    id: 'third', position: { x: 80, y: 0 }, size: { width: 10, height: 10 }, fill: '#123',
  })
  const kit = new CanvasKit({ scene })
  kit.selection.selectAll()

  expect(kit.distributeSelection('horizontal')).toBe(false)
  expect(kit.undo()).toEqual(scene)
})
