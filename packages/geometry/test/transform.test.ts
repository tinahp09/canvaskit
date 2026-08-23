import { describe, expect, it } from 'vitest'
import { screenToWorld, worldToScreen } from '../src/index.js'

describe('coordinate transforms', () => {
  const transform = { x: 100, y: 50, zoom: 2 }

  it('converts world points to screen points', () => {
    expect(worldToScreen({ x: 10, y: 20 }, transform)).toEqual({ x: 120, y: 90 })
  })

  it('round-trips screen points back to world points', () => {
    expect(screenToWorld({ x: 120, y: 90 }, transform)).toEqual({ x: 10, y: 20 })
  })
})
