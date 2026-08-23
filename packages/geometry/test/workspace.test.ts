import { expect, it } from 'vitest'
import { PACKAGE_NAME } from '../src/index.js'

it('exposes geometry package identity', () => {
  expect(PACKAGE_NAME).toBe('@canvaskit/geometry')
})
