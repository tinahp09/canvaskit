import { addCircle, addLayer, addRectangle, createScene, hitTestNode, isNodeInteractive, moveNodes, nodesInRect, SpatialIndex } from '../src/index.js'
import { expect, it, vi } from 'vitest'

const scene = addCircle(addRectangle(createScene(), {
  id: 'rectangle', position: { x: 10, y: 10 }, size: { width: 40, height: 30 }, fill: '#fff',
}), { id: 'circle', position: { x: 100, y: 100 }, radius: 20, fill: '#fff' })

it('hit-tests rectangle and circle nodes', () => {
  expect(hitTestNode(scene, { x: 20, y: 20 })?.id).toBe('rectangle')
  expect(hitTestNode(scene, { x: 110, y: 100 })?.id).toBe('circle')
})

it('excludes hidden and locked nodes from interactive hit and marquee results', () => {
  let layered = addLayer(createScene(), { id: 'locked', name: 'Locked', visible: true, locked: true })
  layered = addLayer(layered, { id: 'hidden', name: 'Hidden', visible: false, locked: false })
  layered = addRectangle(layered, { id: 'visible', position: { x: 0, y: 0 }, size: { width: 20, height: 20 }, fill: '#fff' })
  layered = addRectangle(layered, { id: 'locked-node', layerId: 'locked', position: { x: 0, y: 0 }, size: { width: 20, height: 20 }, fill: '#000' })
  layered = addRectangle(layered, { id: 'hidden-node', layerId: 'hidden', position: { x: 0, y: 0 }, size: { width: 20, height: 20 }, fill: '#123' })

  expect(isNodeInteractive(layered, 'visible')).toBe(true)
  expect(isNodeInteractive(layered, 'locked-node')).toBe(false)
  expect(isNodeInteractive(layered, 'hidden-node')).toBe(false)
  expect(hitTestNode(layered, { x: 10, y: 10 })?.id).toBe('visible')
  expect(nodesInRect(layered, { x: 0, y: 0, width: 20, height: 20 })).toEqual(['visible'])
})

it('hit-tests the last rendered visible layer before raw node order', () => {
  let layered = addLayer(createScene(), { id: 'below', name: 'Below', visible: true, locked: false })
  layered = addLayer(layered, { id: 'above', name: 'Above', visible: true, locked: false })
  layered = addRectangle(layered, { id: 'above-node', layerId: 'above', position: { x: 10, y: 10 }, size: { width: 30, height: 30 }, fill: '#fff' })
  layered = addRectangle(layered, { id: 'below-node', layerId: 'below', position: { x: 10, y: 10 }, size: { width: 30, height: 30 }, fill: '#000' })

  expect(hitTestNode(layered, { x: 20, y: 20 })?.id).toBe('above-node')
  expect(hitTestNode(layered, { x: 20, y: 20 }, new SpatialIndex(layered.nodes))?.id).toBe('above-node')
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

it('defaults existing marquee calls to contain mode', () => {
  expect(nodesInRect(scene, { x: 40, y: 30, width: 50, height: 50 })).toEqual([])
})

it('accepts an index in the existing third argument position', () => {
  const index = new SpatialIndex(scene.nodes)
  const query = vi.spyOn(index, 'query')

  expect(nodesInRect(scene, { x: 40, y: 30, width: 50, height: 50 }, index)).toEqual([])
  expect(query).toHaveBeenCalled()
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

it('preserves scene order for indexed intersect marquee selection', () => {
  const overlapping = addRectangle(addRectangle(addRectangle(createScene(), {
    id: 'first', position: { x: 20, y: 20 }, size: { width: 20, height: 20 }, fill: '#fff',
  }), {
    id: 'second', position: { x: 0, y: 0 }, size: { width: 50, height: 50 }, fill: '#fff',
  }), {
    id: 'third', position: { x: 40, y: 40 }, size: { width: 20, height: 20 }, fill: '#fff',
  })
  const marquee = { x: 15, y: 15, width: 30, height: 30 }
  const index = new SpatialIndex(overlapping.nodes)

  expect(nodesInRect(overlapping, marquee, 'intersect', index)).toEqual(['first', 'second', 'third'])
  expect(nodesInRect(overlapping, marquee, 'intersect', index)).toEqual(nodesInRect(overlapping, marquee, 'intersect'))
})

it('moves named nodes immutably in world coordinates', () => {
  const moved = moveNodes(scene, ['rectangle'], { x: 5, y: -3 })
  expect(scene.nodes[0]?.position).toEqual({ x: 10, y: 10 })
  expect(moved.nodes[0]?.position).toEqual({ x: 15, y: 7 })
})
