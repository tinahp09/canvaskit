import { expect, it } from 'vitest'
import { addCircle, addText, createScene, loadScene, serializeScene } from '../src/index.js'

it('round-trips circle and text nodes through serialization', () => {
  const scene = addText(addCircle(createScene(), {
    id: 'circle', position: { x: 20, y: 30 }, radius: 12, fill: '#fff',
  }), {
    id: 'text', position: { x: 80, y: 60 }, text: 'CanvasKit', fill: '#000', fontSize: 14,
  })

  expect(loadScene(serializeScene(scene))).toEqual(scene)
})
