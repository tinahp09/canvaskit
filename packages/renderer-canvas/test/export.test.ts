import { expect, it, vi } from 'vitest'
import { exportPNG } from '../src/index.js'

it('returns the canvas PNG data URL', () => {
  const toDataURL = vi.fn(() => 'data:image/png;base64,abc123')
  const canvas = { toDataURL } as unknown as HTMLCanvasElement

  expect(exportPNG(canvas)).toBe('data:image/png;base64,abc123')
  expect(toDataURL).toHaveBeenCalledWith('image/png')
})

it('throws a clear error when the canvas cannot be exported', () => {
  const canvas = {
    toDataURL: vi.fn(() => {
      throw new Error('Tainted canvases may not be exported.')
    }),
  } as unknown as HTMLCanvasElement

  expect(() => exportPNG(canvas)).toThrow('Unable to export canvas as PNG.')
})
