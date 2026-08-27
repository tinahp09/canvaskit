import { expect, it } from 'vitest'
import { SpatialIndex, nodeBounds, type CanvasNode } from '../src/index.js'

it('returns bounds for rectangle, circle, and text nodes', () => {
  const nodes: CanvasNode[] = [
    { id: 'rectangle', type: 'rectangle', position: { x: 10, y: 20 }, size: { width: 30, height: 40 }, fill: '#fff' },
    { id: 'circle', type: 'circle', position: { x: 60, y: 70 }, radius: 12, fill: '#fff' },
    { id: 'text', type: 'text', position: { x: 100, y: 110 }, text: 'Hi', fontSize: 16, fill: '#000' },
  ]

  expect(nodes.map(nodeBounds)).toEqual([
    { x: 10, y: 20, width: 30, height: 40 },
    { x: 48, y: 58, width: 24, height: 24 },
    { x: 100, y: 94, width: 32, height: 16 },
  ])
})

it('returns each intersecting node once in original scene order', () => {
  const nodes: CanvasNode[] = [
    { id: 'wide', type: 'rectangle', position: { x: 0, y: 85 }, size: { width: 200, height: 20 }, fill: '#fff' },
    { id: 'circle', type: 'circle', position: { x: 90, y: 90 }, radius: 15, fill: '#fff' },
    { id: 'text', type: 'text', position: { x: 220, y: 90 }, text: 'far', fontSize: 10, fill: '#000' },
    { id: 'overlap', type: 'rectangle', position: { x: 80, y: 80 }, size: { width: 30, height: 30 }, fill: '#fff' },
  ]

  const index = new SpatialIndex(nodes)

  expect(index.query({ x: 85, y: 85, width: 20, height: 20 }).map((node) => node.id)).toEqual([
    'wide', 'circle', 'overlap',
  ])
})

it('excludes nodes that only touch the query boundary', () => {
  const index = new SpatialIndex<CanvasNode>([
    { id: 'touching', type: 'rectangle', position: { x: 10, y: 0 }, size: { width: 5, height: 5 }, fill: '#fff' },
    { id: 'inside', type: 'rectangle', position: { x: 9, y: 0 }, size: { width: 5, height: 5 }, fill: '#fff' },
  ])

  expect(index.query({ x: 0, y: 0, width: 10, height: 10 }).map((node) => node.id)).toEqual(['inside'])
})
