import { expect, it } from 'vitest'
import { addRectangle, createScene, DiagramRuntime } from '../src/index.js'

it('accepts only connection pairs allowed by a typed diagram policy', () => {
  const scene = addRectangle(addRectangle(createScene(), {
    id: 'source', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff',
  }), {
    id: 'target', position: { x: 30, y: 0 }, size: { width: 10, height: 10 }, fill: '#000',
  })
  const runtime = new DiagramRuntime([{ id: 'flow', source: { nodeTypes: ['rectangle'], ports: ['east'] }, target: { nodeTypes: ['rectangle'], ports: ['west'] } }])

  expect(runtime.canConnect(scene, { sourceNodeId: 'source', sourcePortId: 'east', targetNodeId: 'target', targetPortId: 'west' })).toBe(true)
  expect(runtime.canConnect(scene, { sourceNodeId: 'source', sourcePortId: 'north', targetNodeId: 'target', targetPortId: 'west' })).toBe(false)
  expect(runtime.create(scene, { id: 'flow-1', sourceNodeId: 'source', sourcePortId: 'east', targetNodeId: 'target', targetPortId: 'west' }).connectors).toHaveLength(1)
  expect(() => runtime.create(scene, { id: 'flow-2', sourceNodeId: 'source', sourcePortId: 'north', targetNodeId: 'target', targetPortId: 'west' })).toThrow('Diagram connection violates every registered policy.')
})
