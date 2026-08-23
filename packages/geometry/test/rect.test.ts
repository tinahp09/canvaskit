import { expect, it } from 'vitest'
import { rectContainsPoint } from '../src/index.js'

it('includes left and top edges but excludes right and bottom edges', () => {
  const rect = { x: 10, y: 20, width: 30, height: 40 }
  expect(rectContainsPoint(rect, { x: 10, y: 20 })).toBe(true)
  expect(rectContainsPoint(rect, { x: 40, y: 60 })).toBe(false)
})
