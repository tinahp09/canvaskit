import { expect, it } from 'vitest'
import { ConnectorController, createScene, deriveNodePorts, exportScene, importScene, InvalidSceneError, addRectangle, pasteSelection, removeSelection, type SceneClipboard } from '../src/index.js'

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

it.each([1, 2, 3])('rejects an invalid legacy edge type while migrating V%s scenes', (version) => {
  const nodes = version === 3
    ? [
      { id: 'source', layerId: 'layer-default', type: 'rectangle', position: { x: 0, y: 0 }, size: { width: 20, height: 20 }, fill: '#fff' },
      { id: 'target', layerId: 'layer-default', type: 'rectangle', position: { x: 100, y: 0 }, size: { width: 20, height: 20 }, fill: '#000' },
    ]
    : [
      { id: 'source', type: 'rectangle', position: { x: 0, y: 0 }, size: { width: 20, height: 20 }, fill: '#fff' },
      { id: 'target', type: 'rectangle', position: { x: 100, y: 0 }, size: { width: 20, height: 20 }, fill: '#000' },
    ]
  const scene = {
    version,
    nodes,
    edges: [{ id: 'bad', type: 'nonsense', sourceId: 'source', targetId: 'target' }],
    groups: [],
    ...(version === 3 ? { layers: [{ id: 'layer-default', name: 'Default', visible: true, locked: false }] } : {}),
    viewport: { x: 0, y: 0, zoom: 1 }, metadata: {},
  }

  expect(() => importScene(JSON.stringify(scene))).toThrow(InvalidSceneError)
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

it('reconnects, rejects an invalid replacement without mutation, and removes connectors', () => {
  let scene = addRectangle(createScene(), {
    id: 'source', position: { x: 0, y: 0 }, size: { width: 20, height: 20 }, fill: '#fff',
  })
  scene = addRectangle(scene, {
    id: 'target', position: { x: 100, y: 0 }, size: { width: 20, height: 20 }, fill: '#000',
  })
  scene = addRectangle(scene, {
    id: 'replacement', position: { x: 200, y: 0 }, size: { width: 20, height: 20 }, fill: '#123',
  })
  const controller = new ConnectorController()
  scene = controller.create(scene, {
    id: 'relation', sourceNodeId: 'source', sourcePortId: 'east', targetNodeId: 'target', targetPortId: 'west', routing: 'straight',
  })

  const reconnected = controller.reconnect(scene, 'relation', { target: { nodeId: 'replacement', portId: 'north' } })

  expect(scene.connectors[0]).toMatchObject({ targetNodeId: 'target', targetPortId: 'west' })
  expect(reconnected.connectors[0]).toMatchObject({ targetNodeId: 'replacement', targetPortId: 'north' })
  expect(() => controller.reconnect(reconnected, 'relation', { target: { nodeId: 'replacement', portId: 'missing' } })).toThrow('Connector target port "missing" does not exist on node "replacement".')
  expect(reconnected.connectors[0]).toMatchObject({ targetNodeId: 'replacement', targetPortId: 'north' })
  expect(controller.remove(reconnected, 'relation').connectors).toEqual([])
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

it('honors every source and target port normal across all target quadrants', () => {
  const directions = ['north', 'east', 'south', 'west'] as const
  const targetPositions = [
    { x: 100, y: 100 }, { x: -120, y: 100 }, { x: 100, y: -120 }, { x: -120, y: -120 },
  ]
  const controller = new ConnectorController()

  for (const targetPosition of targetPositions) {
    for (const sourcePortId of directions) {
      for (const targetPortId of directions) {
        let scene = addRectangle(createScene(), {
          id: 'source', position: { x: 0, y: 0 }, size: { width: 20, height: 20 }, fill: '#fff',
        })
        scene = addRectangle(scene, {
          id: 'target', position: targetPosition, size: { width: 20, height: 20 }, fill: '#000',
        })
        scene = controller.create(scene, {
          id: 'route', sourceNodeId: 'source', sourcePortId, targetNodeId: 'target', targetPortId, routing: 'orthogonal',
        })

        const points = controller.route(scene, 'route')
        expect(firstDirection(points)).toBe(sourcePortId)
        expect(lastArrivalDirection(points)).toBe(targetPortId)
        expect(points.every((point, index) => index === 0 || point.x === points[index - 1]!.x || point.y === points[index - 1]!.y)).toBe(true)
      }
    }
  }
})

it('never immediately reverses or backtracks from source and target stubs in the 64-case route matrix', () => {
  const directions = ['north', 'east', 'south', 'west'] as const
  const targetPositions = [
    { x: 100, y: 100 }, { x: -120, y: 100 }, { x: 100, y: -120 }, { x: -120, y: -120 },
  ]
  const controller = new ConnectorController()

  for (const targetPosition of targetPositions) {
    for (const sourcePortId of directions) {
      for (const targetPortId of directions) {
        let scene = addRectangle(createScene(), {
          id: 'source', position: { x: 0, y: 0 }, size: { width: 20, height: 20 }, fill: '#fff',
        })
        scene = addRectangle(scene, {
          id: 'target', position: targetPosition, size: { width: 20, height: 20 }, fill: '#000',
        })
        scene = controller.create(scene, {
          id: 'route', sourceNodeId: 'source', sourcePortId, targetNodeId: 'target', targetPortId, routing: 'orthogonal',
        })

        const directionsAlongRoute = routeDirections(controller.route(scene, 'route'))
        expect(directionsAlongRoute[0]).toBe(sourcePortId)
        expect(directionsAlongRoute.at(-1)).toBe(oppositeDirection(targetPortId))
        expect(
          directionsAlongRoute.every((direction, index) => index === 0 || direction !== oppositeDirection(directionsAlongRoute[index - 1]!)),
          `${sourcePortId} -> ${targetPortId} at (${targetPosition.x}, ${targetPosition.y}): ${directionsAlongRoute.join(', ')}`,
        ).toBe(true)
      }
    }
  }
})

it('recomputes a connector route from moved node bounds without persisting route points', () => {
  let scene = addRectangle(createScene(), {
    id: 'source', position: { x: 0, y: 0 }, size: { width: 20, height: 20 }, fill: '#fff',
  })
  scene = addRectangle(scene, {
    id: 'target', position: { x: 100, y: 0 }, size: { width: 20, height: 20 }, fill: '#000',
  })
  const controller = new ConnectorController()
  scene = controller.create(scene, {
    id: 'relation', sourceNodeId: 'source', sourcePortId: 'east', targetNodeId: 'target', targetPortId: 'west', routing: 'straight',
  })

  const moved = {
    ...scene,
    nodes: scene.nodes.map((node) => node.id === 'target' ? { ...node, position: { x: 160, y: 40 } } : node),
  }

  expect(controller.route(scene, 'relation')).toEqual([{ x: 20, y: 10 }, { x: 100, y: 10 }])
  expect(controller.route(moved, 'relation')).toEqual([{ x: 20, y: 10 }, { x: 160, y: 50 }])
  expect(moved.connectors[0]).not.toHaveProperty('points')
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

it('drops clipboard connectors whose remapped source or target port is invalid', () => {
  const clipboard: SceneClipboard = {
    nodes: [
      { id: 'source', layerId: 'layer-default', type: 'rectangle', position: { x: 0, y: 0 }, size: { width: 20, height: 20 }, fill: '#fff' },
      { id: 'target', layerId: 'layer-default', type: 'rectangle', position: { x: 100, y: 0 }, size: { width: 20, height: 20 }, fill: '#000' },
    ],
    connectors: [
      { id: 'invalid-source', sourceNodeId: 'source', sourcePortId: 'missing', targetNodeId: 'target', targetPortId: 'west', routing: 'straight' },
      { id: 'invalid-target', sourceNodeId: 'source', sourcePortId: 'east', targetNodeId: 'target', targetPortId: 'missing', routing: 'orthogonal' },
    ],
    edges: [], groups: [],
  }

  const result = pasteSelection(createScene(), clipboard, { x: 0, y: 0 })

  expect(result.scene.connectors).toEqual([])
  expect(() => exportScene(result.scene)).not.toThrow()
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

function firstDirection(points: readonly { x: number; y: number }[]): 'north' | 'east' | 'south' | 'west' {
  return direction(points[0]!, points[1]!)
}

function lastArrivalDirection(points: readonly { x: number; y: number }[]): 'north' | 'east' | 'south' | 'west' {
  const incoming = direction(points.at(-2)!, points.at(-1)!)
  return ({ north: 'south', east: 'west', south: 'north', west: 'east' } as const)[incoming]
}

function direction(from: { x: number; y: number }, to: { x: number; y: number }): 'north' | 'east' | 'south' | 'west' {
  if (from.x === to.x) return to.y > from.y ? 'south' : 'north'
  return to.x > from.x ? 'east' : 'west'
}

function routeDirections(points: readonly { x: number; y: number }[]): Array<'north' | 'east' | 'south' | 'west'> {
  return points.slice(1).map((point, index) => direction(points[index]!, point))
}

function oppositeDirection(direction: 'north' | 'east' | 'south' | 'west'): 'north' | 'east' | 'south' | 'west' {
  return ({ north: 'south', east: 'west', south: 'north', west: 'east' } as const)[direction]
}
