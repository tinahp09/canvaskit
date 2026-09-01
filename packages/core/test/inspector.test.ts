import { expect, it } from 'vitest'
import { addRectangle, createScene, InspectorRuntime } from '../src/index.js'

const fill = {
  id: 'fill', label: 'Fill', nodeTypes: ['rectangle'] as const,
  read: (node: { fill: string }) => node.fill,
  write: (node: { fill: string }, value: string) => ({ ...node, fill: value }),
}

it('reports a concrete or mixed property value across an applicable selection', () => {
  let scene = addRectangle(createScene(), { id: 'a', position: { x: 0, y: 0 }, size: { width: 1, height: 1 }, fill: '#fff' })
  scene = addRectangle(scene, { id: 'b', position: { x: 2, y: 0 }, size: { width: 1, height: 1 }, fill: '#fff' })
  const inspector = new InspectorRuntime([fill])

  expect(inspector.read(scene, ['a', 'b'], 'fill')).toEqual({ kind: 'value', value: '#fff' })
  expect(inspector.read({ ...scene, nodes: [{ ...scene.nodes[0]!, fill: '#000' }, scene.nodes[1]! ] }, ['a', 'b'], 'fill')).toEqual({ kind: 'mixed' })
})

it('applies a property atomically to all applicable selected nodes', () => {
  let scene = addRectangle(createScene(), { id: 'a', position: { x: 0, y: 0 }, size: { width: 1, height: 1 }, fill: '#fff' })
  scene = addRectangle(scene, { id: 'b', position: { x: 2, y: 0 }, size: { width: 1, height: 1 }, fill: '#fff' })
  const inspector = new InspectorRuntime([fill])

  expect(inspector.apply(scene, ['a', 'b'], 'fill', '#123').nodes.map((node) => node.fill)).toEqual(['#123', '#123'])
  expect(() => inspector.apply(scene, ['a', 'missing'], 'fill', '#123')).toThrow('Unknown inspector target: missing.')
  expect(scene.nodes.map((node) => node.fill)).toEqual(['#fff', '#fff'])
})
