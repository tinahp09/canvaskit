import { expect, it } from 'vitest'
import { addRectangle, CanvasKit, type CanvasScene } from '../src/index.js'

it('reports pointer coordinates in screen and world space', () => {
  const canvas = new CanvasKit()
  canvas.viewport.panBy({ x: 10, y: 20 })

  expect(canvas.createPointerEvent({ x: 30, y: 50 }, 'pointermove')).toEqual({
    type: 'pointermove', screen: { x: 30, y: 50 }, world: { x: 20, y: 30 },
  })
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
