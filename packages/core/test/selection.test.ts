import { addCircle, addLayer, addRectangle, CanvasKit, createScene, SelectionController } from '../src/index.js'
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

it('applies selection mutations in scene order', () => {
  const canvas = canvasWithNodes()

  canvas.selection.set(['circle', 'rectangle'])
  expect(canvas.selection.get()).toEqual(['rectangle', 'circle'])

  canvas.selection.remove(['rectangle'])
  expect(canvas.selection.get()).toEqual(['circle'])

  canvas.selection.add(['rectangle'])
  expect(canvas.selection.get()).toEqual(['rectangle', 'circle'])

  canvas.selection.toggle(['circle', 'rectangle'])
  expect(canvas.selection.get()).toEqual([])
})

it('rejects unknown node ids for every selection mutation', () => {
  const canvas = canvasWithNodes()

  expect(() => canvas.selection.set(['missing'])).toThrow('Unknown node id: missing.')
  expect(() => canvas.selection.add(['missing'])).toThrow('Unknown node id: missing.')
  expect(() => canvas.selection.remove(['missing'])).toThrow('Unknown node id: missing.')
  expect(() => canvas.selection.toggle(['missing'])).toThrow('Unknown node id: missing.')
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

it('ignores hidden and locked nodes in every selection entry point', () => {
  let scene = addLayer(createScene(), { id: 'locked', name: 'Locked', visible: true, locked: true })
  scene = addLayer(scene, { id: 'hidden', name: 'Hidden', visible: false, locked: false })
  scene = addRectangle(scene, { id: 'visible', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff' })
  scene = addRectangle(scene, { id: 'locked-node', layerId: 'locked', position: { x: 20, y: 0 }, size: { width: 10, height: 10 }, fill: '#000' })
  scene = addRectangle(scene, { id: 'hidden-node', layerId: 'hidden', position: { x: 40, y: 0 }, size: { width: 10, height: 10 }, fill: '#123' })
  const canvas = new CanvasKit({ scene })

  expect(canvas.isNodeInteractive('visible')).toBe(true)
  expect(canvas.isNodeInteractive('locked-node')).toBe(false)
  expect(canvas.isNodeInteractive('hidden-node')).toBe(false)
  canvas.selection.set(['visible', 'locked-node', 'hidden-node'])
  expect(canvas.selection.get()).toEqual(['visible'])
  canvas.selection.add(['locked-node', 'hidden-node'])
  expect(canvas.selection.get()).toEqual(['visible'])
  canvas.selection.toggle(['locked-node', 'hidden-node'])
  expect(canvas.selection.get()).toEqual(['visible'])
  canvas.selection.selectAll()
  expect(canvas.selection.get()).toEqual(['visible'])
  expect(canvas.getScene()).toEqual(scene)
})

it('enforces document interaction state when used without CanvasKit', () => {
  let scene = addLayer(createScene(), { id: 'hidden', name: 'Hidden', visible: false, locked: false })
  scene = addRectangle(scene, { id: 'hidden-node', layerId: 'hidden', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff' })
  const selection = new SelectionController(() => scene)

  selection.select('hidden-node')
  expect(selection.get()).toEqual([])
})
