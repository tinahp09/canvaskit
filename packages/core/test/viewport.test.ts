import { expect, it } from 'vitest'
import { screenToWorld } from '@canvaskit/geometry'
import { ViewportController } from '../src/index.js'

it('keeps the pointer world point fixed during zoom', () => {
  const viewport = new ViewportController({ x: 0, y: 0, zoom: 1 })
  const pointer = { x: 300, y: 200 }
  const before = screenToWorld(pointer, viewport.getTransform())

  viewport.zoomAt(pointer, 2)

  expect(screenToWorld(pointer, viewport.getTransform())).toEqual(before)
})

it('clamps zoom to the supported range', () => {
  const viewport = new ViewportController({ x: 0, y: 0, zoom: 1 })
  viewport.setZoom(100)
  expect(viewport.getTransform().zoom).toBe(4)
})
