import { expect, it, vi } from 'vitest'
import { CanvasRenderer } from '../src/index.js'

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
