import { expect, it } from 'vitest'
import { addRectangle, createScene } from '../src/index.js'

it('adds an immutable rectangle node to a new scene', () => {
  const scene = createScene()
  const updated = addRectangle(scene, {
    id: 'welcome',
    position: { x: -20, y: 40 },
    size: { width: 180, height: 80 },
    fill: '#7C7FF2',
  })

  expect(scene.nodes).toEqual([])
  expect(updated.nodes).toHaveLength(1)
  expect(updated.nodes[0]?.id).toBe('welcome')
})

it('rejects duplicate node ids', () => {
  const scene = addRectangle(createScene(), {
    id: 'welcome', position: { x: 0, y: 0 }, size: { width: 1, height: 1 }, fill: '#fff',
  })

  expect(() => addRectangle(scene, {
    id: 'welcome', position: { x: 0, y: 0 }, size: { width: 1, height: 1 }, fill: '#fff',
  })).toThrow('A node with id "welcome" already exists.')
})
