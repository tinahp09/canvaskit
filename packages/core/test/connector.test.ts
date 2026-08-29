import { expect, it } from 'vitest'
import { ConnectorController, createScene, deriveNodePorts, exportScene, importScene, InvalidSceneError, addRectangle, removeSelection } from '../src/index.js'

it('derives named cardinal ports from each node subtype bounds', () => {
  expect(deriveNodePorts({
    id: 'rectangle', layerId: 'layer-default', type: 'rectangle',
    position: { x: 10, y: 20 }, size: { width: 40, height: 30 }, fill: '#fff',
  })).toEqual([
    { id: 'north', direction: 'north', position: { x: 30, y: 20 } },
    { id: 'east', direction: 'east', position: { x: 50, y: 35 } },
    { id: 'south', direction: 'south', position: { x: 30, y: 50 } },
    { id: 'west', direction: 'west', position: { x: 10, y: 35 } },
  ])

  expect(deriveNodePorts({
    id: 'circle', layerId: 'layer-default', type: 'circle',
    position: { x: 100, y: 50 }, radius: 20, fill: '#fff',
  })).toEqual([
    { id: 'north', direction: 'north', position: { x: 100, y: 30 } },
    { id: 'east', direction: 'east', position: { x: 120, y: 50 } },
    { id: 'south', direction: 'south', position: { x: 100, y: 70 } },
    { id: 'west', direction: 'west', position: { x: 80, y: 50 } },
  ])

  expect(deriveNodePorts({
    id: 'text', layerId: 'layer-default', type: 'text',
    position: { x: 10, y: 30 }, text: 'Hi', fontSize: 10, fill: '#fff',
  })).toEqual([
    { id: 'north', direction: 'north', position: { x: 20, y: 20 } },
    { id: 'east', direction: 'east', position: { x: 30, y: 25 } },
    { id: 'south', direction: 'south', position: { x: 20, y: 30 } },
    { id: 'west', direction: 'west', position: { x: 10, y: 25 } },
  ])
})

it('migrates a V3 edge into a straight connector with legacy center endpoints', () => {
  const scene = importScene(JSON.stringify({
    version: 3,
    nodes: [
      { id: 'source', layerId: 'layer-default', type: 'rectangle', position: { x: 0, y: 0 }, size: { width: 20, height: 10 }, fill: '#fff' },
      { id: 'target', layerId: 'layer-default', type: 'rectangle', position: { x: 80, y: 0 }, size: { width: 20, height: 10 }, fill: '#000' },
    ],
    edges: [{ id: 'legacy', type: 'arrow', sourceId: 'source', targetId: 'target' }],
    groups: [], layers: [{ id: 'layer-default', name: 'Default', visible: true, locked: false }],
    viewport: { x: 0, y: 0, zoom: 1 }, metadata: {},
  }))

  expect(scene).toMatchObject({
    version: 4,
    connectors: [{
      id: 'legacy', sourceNodeId: 'source', sourcePortId: 'center',
      targetNodeId: 'target', targetPortId: 'center', routing: 'straight',
    }],
  })
  expect('edges' in scene).toBe(false)
})

it('creates a connector only when both referenced node ports exist', () => {
  let scene = addRectangle(createScene(), {
    id: 'source', position: { x: 0, y: 0 }, size: { width: 20, height: 20 }, fill: '#fff',
  })
  scene = addRectangle(scene, {
    id: 'target', position: { x: 100, y: 0 }, size: { width: 20, height: 20 }, fill: '#000',
  })
  const controller = new ConnectorController()

  expect(() => controller.create(scene, {
    id: 'invalid-node', sourceNodeId: 'missing', sourcePortId: 'east',
    targetNodeId: 'target', targetPortId: 'west', routing: 'straight',
  })).toThrow('Connector source node "missing" does not exist.')
  expect(() => controller.create(scene, {
    id: 'invalid-port', sourceNodeId: 'source', sourcePortId: 'missing',
    targetNodeId: 'target', targetPortId: 'west', routing: 'straight',
  })).toThrow('Connector source port "missing" does not exist on node "source".')

  const connected = controller.create(scene, {
    id: 'order', sourceNodeId: 'source', sourcePortId: 'east',
    targetNodeId: 'target', targetPortId: 'west', routing: 'orthogonal', label: 'ships',
  })

  expect(connected.connectors).toEqual([{
    id: 'order', sourceNodeId: 'source', sourcePortId: 'east',
    targetNodeId: 'target', targetPortId: 'west', routing: 'orthogonal', label: 'ships',
  }])
})

it('routes matching outbound port directions around their shared exterior side', () => {
  let scene = addRectangle(createScene(), {
    id: 'source', position: { x: 0, y: 0 }, size: { width: 20, height: 20 }, fill: '#fff',
  })
  scene = addRectangle(scene, {
    id: 'target', position: { x: 100, y: 60 }, size: { width: 20, height: 20 }, fill: '#000',
  })
  const controller = new ConnectorController()
  scene = controller.create(scene, {
    id: 'route', sourceNodeId: 'source', sourcePortId: 'east',
    targetNodeId: 'target', targetPortId: 'east', routing: 'orthogonal',
  })

  expect(controller.route(scene, 'route')).toEqual([
    { x: 20, y: 10 }, { x: 140, y: 10 }, { x: 140, y: 70 }, { x: 120, y: 70 },
  ])
})

it('removes connectors that become dangling when selected nodes are deleted', () => {
  let scene = addRectangle(createScene(), {
    id: 'source', position: { x: 0, y: 0 }, size: { width: 20, height: 20 }, fill: '#fff',
  })
  scene = addRectangle(scene, {
    id: 'target', position: { x: 100, y: 0 }, size: { width: 20, height: 20 }, fill: '#000',
  })
  scene = new ConnectorController().create(scene, {
    id: 'relation', sourceNodeId: 'source', sourcePortId: 'east',
    targetNodeId: 'target', targetPortId: 'west', routing: 'straight',
  })

  const result = removeSelection(scene, ['source'])

  expect(result.nodes.map((node) => node.id)).toEqual(['target'])
  expect(result.connectors).toEqual([])
})

it('serializes connector labels but never materializes a derived route', () => {
  let scene = addRectangle(createScene(), {
    id: 'source', position: { x: 0, y: 0 }, size: { width: 20, height: 20 }, fill: '#fff',
  })
  scene = addRectangle(scene, {
    id: 'target', position: { x: 100, y: 0 }, size: { width: 20, height: 20 }, fill: '#000',
  })
  scene = new ConnectorController().create(scene, {
    id: 'labelled', sourceNodeId: 'source', sourcePortId: 'east',
    targetNodeId: 'target', targetPortId: 'west', routing: 'orthogonal', label: 'owns',
  })

  const json = exportScene(scene)

  expect(JSON.parse(json).connectors).toEqual([{
    id: 'labelled', sourceNodeId: 'source', sourcePortId: 'east',
    targetNodeId: 'target', targetPortId: 'west', routing: 'orthogonal', label: 'owns',
  }])
  expect(JSON.parse(json)).not.toHaveProperty('edges')
  expect(importScene(json)).toEqual(scene)
})

it('rejects legacy edge records in a V4 payload instead of treating them as canonical data', () => {
  expect(() => importScene(JSON.stringify({
    version: 4, nodes: [], connectors: [], edges: [], groups: [],
    layers: [{ id: 'layer-default', name: 'Default', visible: true, locked: false }],
    viewport: { x: 0, y: 0, zoom: 1 }, metadata: {},
  }))).toThrow(InvalidSceneError)
})
