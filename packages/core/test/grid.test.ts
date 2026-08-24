import { snapPointToGrid } from '../src/index.js'
import { expect, it } from 'vitest'

it('snaps a point to the nearest grid intersection', () => {
  expect(snapPointToGrid({ x: 31, y: 49 }, 20)).toEqual({ x: 40, y: 40 })
})
