import { addCircle, addRectangle, createScene, hitTestNode, moveNodes, nodesInRect } from '../src/index.js'
import { expect, it } from 'vitest'

const scene = addCircle(addRectangle(createScene(), {
  id: 'rectangle', position: { x: 10, y: 10 }, size: { width: 40, height: 30 }, fill: '#fff',
}), { id: 'circle', position: { x: 100, y: 100 }, radius: 20, fill: '#fff' })

it('hit-tests rectangle and circle nodes', () => {
  expect(hitTestNode(scene, { x: 20, y: 20 })?.id).toBe('rectangle')
  expect(hitTestNode(scene, { x: 110, y: 100 })?.id).toBe('circle')
})

it('selects nodes fully contained by a marquee rectangle', () => {
  expect(nodesInRect(scene, { x: 0, y: 0, width: 60, height: 60 })).toEqual(['rectangle'])
})

it('moves named nodes immutably in world coordinates', () => {
  const moved = moveNodes(scene, ['rectangle'], { x: 5, y: -3 })
  expect(scene.nodes[0]?.position).toEqual({ x: 10, y: 10 })
  expect(moved.nodes[0]?.position).toEqual({ x: 15, y: 7 })
})
