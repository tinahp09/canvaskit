import { addCircle, addRectangle, createScene, hitTestNode, moveNodes, nodesInRect, SpatialIndex } from '../src/index.js'
import { expect, it, vi } from 'vitest'

const scene = addCircle(addRectangle(createScene(), {
  id: 'rectangle', position: { x: 10, y: 10 }, size: { width: 40, height: 30 }, fill: '#fff',
}), { id: 'circle', position: { x: 100, y: 100 }, radius: 20, fill: '#fff' })

it('hit-tests rectangle and circle nodes', () => {
  expect(hitTestNode(scene, { x: 20, y: 20 })?.id).toBe('rectangle')
  expect(hitTestNode(scene, { x: 110, y: 100 })?.id).toBe('circle')
})

it('uses an index without changing topmost hit-test selection', () => {
  const overlapping = addRectangle(addRectangle(createScene(), {
    id: 'bottom', position: { x: 10, y: 10 }, size: { width: 30, height: 30 }, fill: '#fff',
  }), {
    id: 'top', position: { x: 20, y: 20 }, size: { width: 30, height: 30 }, fill: '#fff',
  })
  const index = new SpatialIndex(overlapping.nodes)
  const query = vi.spyOn(index, 'query')

  expect(hitTestNode(overlapping, { x: 25, y: 25 }, index)).toEqual(hitTestNode(overlapping, { x: 25, y: 25 }))
  expect(hitTestNode(overlapping, { x: 25, y: 25 }, index)?.id).toBe('top')
  expect(query).toHaveBeenCalled()
})

it('selects nodes fully contained by a marquee rectangle', () => {
  expect(nodesInRect(scene, { x: 0, y: 0, width: 60, height: 60 }, 'contain')).toEqual(['rectangle'])
})

it('selects every node whose bounds intersect an intersect marquee', () => {
  expect(nodesInRect(scene, { x: 40, y: 30, width: 50, height: 50 }, 'intersect')).toEqual(['rectangle'])
  expect(nodesInRect(scene, { x: 90, y: 90, width: 20, height: 20 }, 'intersect')).toEqual(['circle'])
})

it('uses an index without changing fully-contained marquee selection', () => {
  const index = new SpatialIndex(scene.nodes)
  const query = vi.spyOn(index, 'query')
  const marquee = { x: 0, y: 0, width: 60, height: 60 }

  expect(nodesInRect(scene, marquee, 'contain', index)).toEqual(nodesInRect(scene, marquee, 'contain'))
  expect(query).toHaveBeenCalled()
})

it('moves named nodes immutably in world coordinates', () => {
  const moved = moveNodes(scene, ['rectangle'], { x: 5, y: -3 })
  expect(scene.nodes[0]?.position).toEqual({ x: 10, y: 10 })
  expect(moved.nodes[0]?.position).toEqual({ x: 15, y: 7 })
})
