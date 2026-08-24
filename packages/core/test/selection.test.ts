import { addCircle, addRectangle, CanvasKit, createScene } from '../src/index.js'
import { expect, it } from 'vitest'

function canvasWithNodes(): CanvasKit {
  return new CanvasKit({ scene: addCircle(addRectangle(createScene(), {
    id: 'rectangle', position: { x: 0, y: 0 }, size: { width: 20, height: 20 }, fill: '#fff',
  }), { id: 'circle', position: { x: 50, y: 50 }, radius: 10, fill: '#fff' }) })
}

it('replaces and extends selection with scene node ids', () => {
  const canvas = canvasWithNodes()
  canvas.selection.select('rectangle')
  canvas.selection.selectMultiple(['circle'])
  expect(canvas.selection.get()).toEqual(['rectangle', 'circle'])
  canvas.selection.select('circle')
  expect(canvas.selection.get()).toEqual(['circle'])
})

it('clears and selects all scene nodes', () => {
  const canvas = canvasWithNodes()
  canvas.selection.selectAll()
  expect(canvas.selection.get()).toEqual(['rectangle', 'circle'])
  canvas.selection.clear()
  expect(canvas.selection.get()).toEqual([])
})

it('deletes selected nodes from the scene', () => {
  const canvas = canvasWithNodes()
  canvas.selection.select('rectangle')
  canvas.deleteSelection()
  expect(canvas.getScene().nodes.map((node) => node.id)).toEqual(['circle'])
  expect(canvas.selection.get()).toEqual([])
})
