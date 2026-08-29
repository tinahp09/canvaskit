import { expect, it, vi } from 'vitest'
import { CanvasRenderer } from '../src/index.js'
import type { TransformOverlay } from '@canvaskit/core'

it('draws rectangles in transformed world coordinates', () => {
  const fillRect = vi.fn()
  const context = {
    clearRect: vi.fn(),
    fillRect,
    fillStyle: '',
  } as unknown as CanvasRenderingContext2D
  const element = {
    getContext: () => context,
    width: 800,
    height: 600,
  } as unknown as HTMLCanvasElement

  new CanvasRenderer(element).render({
    version: 1,
    nodes: [{ id: 'a', type: 'rectangle', position: { x: 10, y: 20 }, size: { width: 30, height: 40 }, fill: '#fff' }],
    viewport: { x: 5, y: 6, zoom: 2 },
    metadata: {},
  })

  expect(fillRect).toHaveBeenCalledWith(25, 46, 60, 80)
})

it('culls off-screen nodes and edges without a visible endpoint', () => {
  const fillRect = vi.fn(); const moveTo = vi.fn(); const lineTo = vi.fn()
  const context = {
    clearRect: vi.fn(), fillRect, beginPath: vi.fn(), moveTo, lineTo, stroke: vi.fn(), fillStyle: '', strokeStyle: '', lineWidth: 1,
  } as unknown as CanvasRenderingContext2D
  const element = { getContext: () => context, width: 100, height: 100 } as unknown as HTMLCanvasElement

  const result = new CanvasRenderer(element).render({ version: 1, nodes: [
    { id: 'visible', type: 'rectangle', position: { x: 20, y: 20 }, size: { width: 20, height: 20 }, fill: '#fff' },
    { id: 'offscreen', type: 'rectangle', position: { x: 200, y: 20 }, size: { width: 20, height: 20 }, fill: '#fff' },
    { id: 'also-offscreen', type: 'rectangle', position: { x: 300, y: 20 }, size: { width: 20, height: 20 }, fill: '#fff' },
  ], edges: [
    { id: 'visible-edge', type: 'line', sourceId: 'visible', targetId: 'offscreen' },
    { id: 'offscreen-edge', type: 'line', sourceId: 'offscreen', targetId: 'also-offscreen' },
  ], groups: [], viewport: { x: 0, y: 0, zoom: 1 }, metadata: {} })

  expect(fillRect).toHaveBeenCalledExactlyOnceWith(20, 20, 20, 20)
  expect(result.visibleNodeCount).toBe(1)
  expect(moveTo).toHaveBeenCalledTimes(1)
  expect(lineTo).toHaveBeenCalledTimes(1)
})

it('retains edges that cross the viewport with both endpoints off-screen', () => {
  const moveTo = vi.fn(); const lineTo = vi.fn()
  const context = {
    clearRect: vi.fn(), fillRect: vi.fn(), beginPath: vi.fn(), moveTo, lineTo, stroke: vi.fn(), fillStyle: '', strokeStyle: '', lineWidth: 1,
  } as unknown as CanvasRenderingContext2D
  const element = { getContext: () => context, width: 100, height: 100 } as unknown as HTMLCanvasElement

  new CanvasRenderer(element).render({ version: 1, nodes: [
    { id: 'left', type: 'rectangle', position: { x: -40, y: 45 }, size: { width: 10, height: 10 }, fill: '#fff' },
    { id: 'right', type: 'rectangle', position: { x: 130, y: 45 }, size: { width: 10, height: 10 }, fill: '#fff' },
  ], edges: [{ id: 'crossing', type: 'line', sourceId: 'left', targetId: 'right' }], groups: [], viewport: { x: 0, y: 0, zoom: 1 }, metadata: {} })

  expect(moveTo).toHaveBeenCalledWith(-35, 50)
  expect(lineTo).toHaveBeenCalledWith(135, 50)
})

it('renders panned nodes with negative zoom', () => {
  const fillRect = vi.fn()
  const context = { clearRect: vi.fn(), fillRect, fillStyle: '' } as unknown as CanvasRenderingContext2D
  const element = { getContext: () => context, width: 100, height: 100 } as unknown as HTMLCanvasElement

  new CanvasRenderer(element).render({ version: 1, nodes: [
    { id: 'visible', type: 'rectangle', position: { x: 10, y: 20 }, size: { width: 10, height: 10 }, fill: '#fff' },
  ], edges: [], groups: [], viewport: { x: 80, y: 70, zoom: -2 }, metadata: {} })

  expect(fillRect).toHaveBeenCalledWith(60, 30, -20, -20)
})

it('draws circle and text nodes', () => {
  const arc = vi.fn()
  const fillText = vi.fn()
  const context = { clearRect: vi.fn(), fillRect: vi.fn(), beginPath: vi.fn(), arc, fill: vi.fn(), fillText, fillStyle: '', font: '' } as unknown as CanvasRenderingContext2D
  const element = { getContext: () => context, width: 800, height: 600 } as unknown as HTMLCanvasElement
  new CanvasRenderer(element).render({ version: 1, nodes: [
    { id: 'c', type: 'circle', position: { x: 10, y: 20 }, radius: 5, fill: '#fff' },
    { id: 't', type: 'text', position: { x: 30, y: 40 }, text: 'Hi', fontSize: 12, fill: '#000' },
  ], viewport: { x: 0, y: 0, zoom: 2 }, metadata: {} })
  expect(arc).toHaveBeenCalledWith(20, 40, 10, 0, Math.PI * 2)
  expect(fillText).toHaveBeenCalledWith('Hi', 60, 80)
})

it('draws graph edges between node centers', () => {
  const moveTo = vi.fn(); const lineTo = vi.fn()
  const context = { clearRect: vi.fn(), fillRect: vi.fn(), beginPath: vi.fn(), moveTo, lineTo, stroke: vi.fn(), fillStyle: '', strokeStyle: '', lineWidth: 1 } as unknown as CanvasRenderingContext2D
  const element = { getContext: () => context, width: 800, height: 600 } as unknown as HTMLCanvasElement
  new CanvasRenderer(element).render({ version: 1, nodes: [
    { id: 'a', type: 'rectangle', position: { x: 0, y: 0 }, size: { width: 20, height: 20 }, fill: '#fff' },
    { id: 'b', type: 'rectangle', position: { x: 100, y: 0 }, size: { width: 20, height: 20 }, fill: '#fff' },
  ], edges: [{ id: 'edge', type: 'line', sourceId: 'a', targetId: 'b' }], groups: [], viewport: { x: 0, y: 0, zoom: 1 }, metadata: {} })
  expect(moveTo).toHaveBeenCalledWith(10, 10)
  expect(lineTo).toHaveBeenCalledWith(110, 10)
})

it('draws an arrowhead and a Bezier edge', () => {
  const moveTo = vi.fn(); const lineTo = vi.fn(); const bezierCurveTo = vi.fn()
  const context = { clearRect: vi.fn(), fillRect: vi.fn(), beginPath: vi.fn(), moveTo, lineTo, bezierCurveTo, stroke: vi.fn(), fill: vi.fn(), fillStyle: '', strokeStyle: '', lineWidth: 1 } as unknown as CanvasRenderingContext2D
  const element = { getContext: () => context, width: 800, height: 600 } as unknown as HTMLCanvasElement

  new CanvasRenderer(element).render({ version: 1, nodes: [
    { id: 'a', type: 'rectangle', position: { x: 0, y: 0 }, size: { width: 20, height: 20 }, fill: '#fff' },
    { id: 'b', type: 'rectangle', position: { x: 100, y: 40 }, size: { width: 20, height: 20 }, fill: '#fff' },
  ], edges: [
    { id: 'arrow', type: 'arrow', sourceId: 'a', targetId: 'b' },
    { id: 'curve', type: 'bezier', sourceId: 'a', targetId: 'b' },
  ], groups: [], viewport: { x: 0, y: 0, zoom: 1 }, metadata: {} })

  expect(bezierCurveTo).toHaveBeenCalledWith(60, 10, 60, 50, 110, 50)
  expect(lineTo).toHaveBeenCalledTimes(3)
})

it('draws a connection handle for a selected rectangle', () => {
  const arc = vi.fn()
  const context = { clearRect: vi.fn(), fillRect: vi.fn(), beginPath: vi.fn(), arc, fill: vi.fn(), fillStyle: '', strokeStyle: '', lineWidth: 1 } as unknown as CanvasRenderingContext2D
  const element = { getContext: () => context, width: 800, height: 600 } as unknown as HTMLCanvasElement

  new CanvasRenderer(element).render({ version: 1, nodes: [
    { id: 'a', type: 'rectangle', position: { x: 10, y: 20 }, size: { width: 30, height: 40 }, fill: '#fff' },
  ], edges: [], groups: [], viewport: { x: 0, y: 0, zoom: 2 }, metadata: {} }, ['a'])

  expect(arc).toHaveBeenCalledWith(80, 80, 6, 0, Math.PI * 2)
})

it('draws a selected transform overlay in viewport coordinates', () => {
  const strokeRect = vi.fn(); const fillRect = vi.fn(); const moveTo = vi.fn(); const lineTo = vi.fn(); const arc = vi.fn(); const setLineDash = vi.fn()
  const context = {
    clearRect: vi.fn(), fillRect, strokeRect, beginPath: vi.fn(), moveTo, lineTo, arc, fill: vi.fn(), stroke: vi.fn(), setLineDash,
    fillStyle: '', strokeStyle: '', lineWidth: 1,
  } as unknown as CanvasRenderingContext2D
  const element = { getContext: () => context, width: 800, height: 600 } as unknown as HTMLCanvasElement
  const overlay: TransformOverlay = {
    bounds: { x: 10, y: 20, width: 30, height: 40 },
    handles: {
      'north-west': { x: 10, y: 20 }, north: { x: 25, y: 20 }, 'north-east': { x: 40, y: 20 }, east: { x: 40, y: 40 },
      'south-east': { x: 40, y: 60 }, south: { x: 25, y: 60 }, 'south-west': { x: 10, y: 60 }, west: { x: 10, y: 40 },
      rotate: { x: 25, y: -4 },
    },
    rotation: 0,
  }

  new CanvasRenderer(element).render({ version: 2, nodes: [], edges: [], groups: [], viewport: { x: 5, y: 6, zoom: 2 }, metadata: {} }, [], overlay)

  expect(strokeRect).toHaveBeenCalledWith(25, 46, 60, 80)
  expect(setLineDash).toHaveBeenCalledWith([4, 4])
  expect(setLineDash).toHaveBeenLastCalledWith([])
  expect(fillRect).toHaveBeenCalledTimes(8)
  expect(fillRect).toHaveBeenCalledWith(21, 42, 8, 8)
  expect(fillRect).toHaveBeenCalledWith(81, 122, 8, 8)
  expect(moveTo).toHaveBeenCalledWith(55, 46)
  expect(lineTo).toHaveBeenCalledWith(55, -2)
  expect(arc).toHaveBeenCalledWith(55, -2, 5, 0, Math.PI * 2)
})
