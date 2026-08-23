import { expect, it } from 'vitest'
import { addRectangle, createScene, loadScene, serializeScene, UnsupportedSceneVersionError } from '../src/index.js'

it('restores a serialized rectangle scene', () => {
  const scene = addRectangle(createScene(), {
    id: 'welcome', position: { x: -20, y: 40 }, size: { width: 180, height: 80 }, fill: '#7C7FF2',
  })

  expect(loadScene(serializeScene(scene))).toEqual(scene)
})

it('rejects unsupported schema versions', () => {
  expect(UnsupportedSceneVersionError).toBeTypeOf('function')
  expect(() => loadScene('{"version":2,"nodes":[],"viewport":{"x":0,"y":0,"zoom":1},"metadata":{}}'))
    .toThrow(UnsupportedSceneVersionError)
})
