import { expect, it } from 'vitest'
import { CanvasKit } from '../src/index.js'

it('reports pointer coordinates in screen and world space', () => {
  const canvas = new CanvasKit()
  canvas.viewport.panBy({ x: 10, y: 20 })

  expect(canvas.createPointerEvent({ x: 30, y: 50 }, 'pointermove')).toEqual({
    type: 'pointermove', screen: { x: 30, y: 50 }, world: { x: 20, y: 30 },
  })
})

it('loads serialized scene data', () => {
  const canvas = new CanvasKit()
  canvas.load('{"version":1,"nodes":[],"viewport":{"x":4,"y":5,"zoom":2},"metadata":{}}')
  expect(canvas.getScene().viewport).toEqual({ x: 4, y: 5, zoom: 2 })
})
