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
