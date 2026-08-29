import { addEdge, addGroup, addLayer, addRectangle, connectNodes, createScene, hitTestEdge, loadScene, removeEdge, serializeScene } from '../src/index.js'
import { expect, it } from 'vitest'

it('adds a serializable arrow edge between existing nodes', () => {
  const scene = addRectangle(addRectangle(createScene(), {
    id: 'source', position: { x: 0, y: 0 }, size: { width: 20, height: 20 }, fill: '#fff',
  }), { id: 'target', position: { x: 100, y: 0 }, size: { width: 20, height: 20 }, fill: '#fff' })
  const graph = addEdge(scene, { id: 'edge-1', type: 'arrow', sourceId: 'source', targetId: 'target' })
  expect(loadScene(serializeScene(graph))).toEqual(graph)
})

it('hit-tests an edge near the line between node centers', () => {
  const scene = addRectangle(addRectangle(createScene(), { id: 'a', position: { x: 0, y: 0 }, size: { width: 20, height: 20 }, fill: '#fff' }), { id: 'b', position: { x: 100, y: 0 }, size: { width: 20, height: 20 }, fill: '#fff' })
  const graph = addEdge(scene, { id: 'edge', type: 'line', sourceId: 'a', targetId: 'b' })
  expect(hitTestEdge(graph, { x: 60, y: 12 })?.id).toBe('edge')
})

it('does not hit-test edges attached to hidden layers', () => {
  let scene = addLayer(createScene(), { id: 'hidden', name: 'Hidden', visible: false, locked: false })
  scene = addRectangle(scene, { id: 'a', layerId: 'hidden', position: { x: 0, y: 0 }, size: { width: 20, height: 20 }, fill: '#fff' })
  scene = addRectangle(scene, { id: 'b', layerId: 'hidden', position: { x: 100, y: 0 }, size: { width: 20, height: 20 }, fill: '#000' })
  scene = addEdge(scene, { id: 'hidden-edge', sourceId: 'a', targetId: 'b', type: 'line' })

  expect(hitTestEdge(scene, { x: 60, y: 10 })).toBeUndefined()
})

it('groups existing node ids', () => {
  const scene = addRectangle(createScene(), { id: 'node', position: { x: 0, y: 0 }, size: { width: 20, height: 20 }, fill: '#fff' })
  expect(addGroup(scene, { id: 'group', nodeIds: ['node'] }).groups).toEqual([{ id: 'group', nodeIds: ['node'] }])
})

it('connects two existing nodes with a generated edge id', () => {
  const scene = addRectangle(addRectangle(createScene(), { id: 'a', position: { x: 0, y: 0 }, size: { width: 1, height: 1 }, fill: '#fff' }), { id: 'b', position: { x: 10, y: 0 }, size: { width: 1, height: 1 }, fill: '#fff' })
  expect(connectNodes(scene, 'a', 'b', 'arrow').edges[0]).toMatchObject({ type: 'arrow', sourceId: 'a', targetId: 'b' })
})

it('removes an edge without changing the scene nodes', () => {
  const scene = addRectangle(addRectangle(createScene(), { id: 'a', position: { x: 0, y: 0 }, size: { width: 1, height: 1 }, fill: '#fff' }), { id: 'b', position: { x: 10, y: 0 }, size: { width: 1, height: 1 }, fill: '#fff' })
  const graph = addEdge(scene, { id: 'edge', type: 'line', sourceId: 'a', targetId: 'b' })

  const result = removeEdge(graph, 'edge')

  expect(result.edges).toEqual([])
  expect(result.nodes.map((node) => node.id)).toEqual(['a', 'b'])
})
