import { expect, it } from 'vitest'
import {
  addLayer,
  addCircle,
  addRectangle,
  addText,
  createScene,
  exportScene,
  groupNodes,
  importScene,
  InvalidSceneError,
  isNodeInteractive,
  moveNodesToLayer,
  pasteSelection,
  removeLayer,
  reorderLayer,
  reorderNodeInLayer,
  setLayerLocked,
  setLayerVisibility,
  ungroupNodes,
} from '../src/index.js'

it('creates the default layer and assigns new nodes to it', () => {
  const scene = addRectangle(createScene(), {
    id: 'welcome', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff',
  })

  expect(scene.layers).toEqual([{ id: 'layer-default', name: 'Default', visible: true, locked: false }])
  expect(scene.nodes[0]?.layerId).toBe('layer-default')
})

it('treats a legacy flat scene node as interactive for compatibility helpers', () => {
  const legacyScene = {
    nodes: [{ id: 'legacy', type: 'rectangle' as const, position: { x: 0, y: 0 }, size: { width: 1, height: 1 }, fill: '#fff' }],
    edges: [],
  }

  expect(isNodeInteractive(legacyScene as never, 'legacy')).toBe(true)
})

it('adds, reorders, and updates layer state without changing the source scene', () => {
  const scene = createScene()
  const withForeground = addLayer(scene, { id: 'foreground', name: 'Foreground', visible: true, locked: false })
  const updated = setLayerLocked(setLayerVisibility(reorderLayer(withForeground, 'foreground', 0), 'foreground', false), 'foreground', true)

  expect(scene.layers.map((layer) => layer.id)).toEqual(['layer-default'])
  expect(updated.layers).toEqual([
    { id: 'foreground', name: 'Foreground', visible: false, locked: true },
    { id: 'layer-default', name: 'Default', visible: true, locked: false },
  ])
})

it('moves validated nodes to a layer and reorders only their local stack', () => {
  let scene = addRectangle(createScene(), { id: 'a', position: { x: 0, y: 0 }, size: { width: 1, height: 1 }, fill: '#fff' })
  scene = addLayer(scene, { id: 'foreground', name: 'Foreground', visible: true, locked: false })
  scene = addRectangle(scene, { id: 'b', layerId: 'foreground', position: { x: 10, y: 0 }, size: { width: 1, height: 1 }, fill: '#fff' })
  scene = addRectangle(scene, { id: 'c', position: { x: 20, y: 0 }, size: { width: 1, height: 1 }, fill: '#fff' })

  const moved = moveNodesToLayer(scene, ['a'], 'foreground')
  const reordered = reorderNodeInLayer(moved, 'b', 0)

  expect(reordered.nodes.map((node) => [node.id, node.layerId])).toEqual([
    ['b', 'foreground'],
    ['a', 'foreground'],
    ['c', 'layer-default'],
  ])
  expect(() => moveNodesToLayer(scene, ['missing'], 'foreground')).toThrow('Unknown node id: missing.')
  expect(() => moveNodesToLayer(scene, ['a'], 'missing')).toThrow('Unknown layer id: missing.')
})

it('moves a node later within its layer without crossing another layer', () => {
  let scene = addRectangle(createScene(), { id: 'a', position: { x: 0, y: 0 }, size: { width: 1, height: 1 }, fill: '#fff' })
  scene = addLayer(scene, { id: 'foreground', name: 'Foreground', visible: true, locked: false })
  scene = addRectangle(scene, { id: 'b', position: { x: 10, y: 0 }, size: { width: 1, height: 1 }, fill: '#fff' })
  scene = moveNodesToLayer(scene, ['a', 'b'], 'foreground')
  scene = addRectangle(scene, { id: 'middle', layerId: 'layer-default', position: { x: 20, y: 0 }, size: { width: 1, height: 1 }, fill: '#fff' })

  expect(reorderNodeInLayer(scene, 'a', 1).nodes.map((node) => node.id)).toEqual(['b', 'a', 'middle'])
})

it('does not remove nonempty layers', () => {
  const scene = addRectangle(createScene(), { id: 'a', position: { x: 0, y: 0 }, size: { width: 1, height: 1 }, fill: '#fff' })

  expect(() => removeLayer(scene, 'layer-default')).toThrow('Cannot remove a nonempty layer.')
})

it('preserves the default layer after a reordered-layer removal attempt', () => {
  let scene = addLayer(createScene(), { id: 'foreground', name: 'Foreground', visible: true, locked: false })
  scene = reorderLayer(scene, 'foreground', 0)

  expect(() => removeLayer(scene, 'layer-default')).toThrow('Cannot remove the default layer.')
  expect(scene.layers.map((layer) => layer.id)).toEqual(['foreground', 'layer-default'])
})

it('assigns legacy node helpers to the default layer even after layer reordering', () => {
  let scene = addLayer(createScene(), { id: 'foreground', name: 'Foreground', visible: true, locked: false })
  scene = reorderLayer(scene, 'foreground', 0)
  scene = addRectangle(scene, { id: 'rectangle', position: { x: 0, y: 0 }, size: { width: 1, height: 1 }, fill: '#fff' })
  scene = addCircle(scene, { id: 'circle', position: { x: 10, y: 0 }, radius: 1, fill: '#fff' })
  scene = addText(scene, { id: 'text', position: { x: 20, y: 0 }, text: 'text', fontSize: 1, fill: '#fff' })

  expect(scene.nodes.map((node) => node.layerId)).toEqual(['layer-default', 'layer-default', 'layer-default'])
})

it('uses the first canonical layer for legacy adds in an imported V3 document without layer-default', () => {
  const imported = importScene('{"version":3,"nodes":[],"edges":[],"groups":[],"layers":[{"id":"custom","name":"Custom","visible":true,"locked":false}],"viewport":{"x":0,"y":0,"zoom":1},"metadata":{}}')

  const updated = addRectangle(imported, { id: 'rectangle', position: { x: 0, y: 0 }, size: { width: 1, height: 1 }, fill: '#fff' })

  expect(updated.nodes[0]?.layerId).toBe('custom')
  expect(importScene(exportScene(updated))).toEqual(updated)
})

it('rejects unknown layer ids before reordering the layer stack', () => {
  const scene = createScene()

  expect(() => reorderLayer(scene, 'missing', 0)).toThrow('Unknown layer id: missing.')
  expect(scene.layers.map((layer) => layer.id)).toEqual(['layer-default'])
})

it('groups and ungroups validated node members immutably', () => {
  let scene = addRectangle(createScene(), { id: 'a', position: { x: 0, y: 0 }, size: { width: 1, height: 1 }, fill: '#fff' })
  scene = addRectangle(scene, { id: 'b', position: { x: 10, y: 0 }, size: { width: 1, height: 1 }, fill: '#fff' })
  const grouped = groupNodes(scene, { id: 'pair', nodeIds: ['a', 'b'] })

  expect(scene.groups).toEqual([])
  expect(grouped.groups).toEqual([{ id: 'pair', nodeIds: ['a', 'b'] }])
  expect(ungroupNodes(grouped, 'pair').groups).toEqual([])
  expect(() => groupNodes(scene, { id: 'bad', nodeIds: ['missing'] })).toThrow('Group nodes must exist.')
})

it('pastes a node into an existing destination layer when its source layer is absent', () => {
  let source = addLayer(createScene(), { id: 'foreground', name: 'Foreground', visible: true, locked: false })
  source = addRectangle(source, { id: 'a', layerId: 'foreground', position: { x: 0, y: 0 }, size: { width: 1, height: 1 }, fill: '#fff' })
  const clipboard = { nodes: [source.nodes[0]!], edges: [], groups: [] }

  const pasted = pasteSelection(createScene(), clipboard, { x: 0, y: 0 })

  expect(pasted.scene.nodes[0]?.layerId).toBe('layer-default')
})

it('uses layer-default when a cross-document paste falls back after layer reorder', () => {
  let source = addLayer(createScene(), { id: 'source-layer', name: 'Source', visible: true, locked: false })
  source = addRectangle(source, { id: 'a', layerId: 'source-layer', position: { x: 0, y: 0 }, size: { width: 1, height: 1 }, fill: '#fff' })
  let destination = addLayer(createScene(), { id: 'foreground', name: 'Foreground', visible: true, locked: false })
  destination = reorderLayer(destination, 'foreground', 0)

  const pasted = pasteSelection(destination, { nodes: [source.nodes[0]!], edges: [], groups: [] }, { x: 0, y: 0 })

  expect(pasted.scene.nodes[0]?.layerId).toBe('layer-default')
})

it('discards clipboard groups with duplicate members before returning a serializable scene', () => {
  const source = addRectangle(createScene(), { id: 'seed', position: { x: 0, y: 0 }, size: { width: 1, height: 1 }, fill: '#fff' })
  const clipboard = { nodes: [source.nodes[0]!], edges: [], groups: [{ id: 'duplicate-members', nodeIds: ['seed', 'seed'] }] }

  const pasted = pasteSelection(createScene(), clipboard, { x: 0, y: 0 })

  expect(pasted.scene.groups).toEqual([])
  expect(importScene(exportScene(pasted.scene))).toEqual(pasted.scene)
})

it('refuses to serialize a scene whose node references a missing layer', () => {
  const invalidScene = {
    ...createScene(),
    nodes: [{ id: 'orphan', layerId: 'missing', type: 'rectangle' as const, position: { x: 0, y: 0 }, size: { width: 1, height: 1 }, fill: '#fff' }],
  }

  expect(() => exportScene(invalidScene)).toThrow(InvalidSceneError)
})

it.each([
  '{"version":3,"nodes":[],"edges":[],"groups":[],"layers":[],"viewport":{"x":0,"y":0,"zoom":1},"metadata":{}}',
  '{"version":3,"nodes":[{"id":"orphan","layerId":"missing","type":"rectangle","position":{"x":0,"y":0},"size":{"width":1,"height":1},"fill":"#fff"}],"edges":[],"groups":[],"layers":[{"id":"layer-default","name":"Default","visible":true,"locked":false}],"viewport":{"x":0,"y":0,"zoom":1},"metadata":{}}',
  '{"version":3,"nodes":[],"edges":[],"groups":[],"layers":[{"id":"layer-default","name":"Default","visible":true,"locked":false},{"id":"layer-default","name":"Duplicate","visible":true,"locked":false}],"viewport":{"x":0,"y":0,"zoom":1},"metadata":{}}',
])('rejects V3 scenes with invalid layer references', (json) => {
  expect(() => importScene(json)).toThrow(InvalidSceneError)
})

it('migrates every version 2 node into the default layer without changing its order', () => {
  const scene = importScene('{"version":2,"nodes":[{"id":"first","type":"rectangle","position":{"x":0,"y":0},"size":{"width":10,"height":10},"fill":"#fff"},{"id":"second","type":"rectangle","position":{"x":20,"y":0},"size":{"width":10,"height":10},"fill":"#000"}],"edges":[],"groups":[],"viewport":{"x":0,"y":0,"zoom":1},"metadata":{}}')

  expect(scene).toMatchObject({
    version: 4,
    layers: [{ id: 'layer-default', name: 'Default', visible: true, locked: false }],
  })
  expect(scene.nodes.map((node) => [node.id, node.layerId])).toEqual([
    ['first', 'layer-default'],
    ['second', 'layer-default'],
  ])
})
