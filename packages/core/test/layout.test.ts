import { expect, it } from 'vitest'
import { addLayer, addRectangle, createScene, LayoutController, setLayerLocked, setLayerVisibility } from '../src/index.js'

const rectangle = (id: string, x: number, y: number, layerId?: string) => ({
  id, layerId, position: { x, y }, size: { width: 100, height: 60 }, fill: '#fff',
})

it('creates, moves, and removes immutable ruler guides', () => {
  const layout = new LayoutController()
  const scene = createScene()
  const withGuide = layout.createGuide(scene, { id: 'guide-x', axis: 'vertical', position: 120 })

  expect(scene.guides).toEqual([])
  expect(withGuide.guides).toEqual([{ id: 'guide-x', axis: 'vertical', position: 120 }])
  expect(layout.moveGuide(withGuide, 'guide-x', 180).guides[0]?.position).toBe(180)
  expect(layout.removeGuide(withGuide, 'guide-x').guides).toEqual([])
})

it('snaps a selected edge to the nearest stored guide before peer geometry', () => {
  const layout = new LayoutController()
  let scene = addRectangle(createScene(), rectangle('selected', 0, 0))
  scene = addRectangle(scene, rectangle('peer', 112, 0))
  scene = layout.createGuide(scene, { id: 'guide-x', axis: 'vertical', position: 110 })

  const result = layout.snapTranslation(scene, ['selected'], { x: 9, y: 0 }, { tolerance: 12 })
  expect(result.delta).toEqual({ x: 10, y: 0 })
  expect(result.activeGuides).toContainEqual({ id: 'guide-x', axis: 'vertical', position: 110 })
})

it('ignores hidden and locked peers when deriving smart snap targets', () => {
  const layout = new LayoutController()
  let scene = addRectangle(createScene(), rectangle('selected', 0, 0))
  scene = addLayer(scene, { id: 'hidden', name: 'Hidden', visible: true, locked: false })
  scene = addLayer(scene, { id: 'locked', name: 'Locked', visible: true, locked: false })
  scene = addRectangle(scene, rectangle('hidden-peer', 110, 0, 'hidden'))
  scene = addRectangle(scene, rectangle('locked-peer', 111, 0, 'locked'))
  scene = setLayerVisibility(scene, 'hidden', false)
  scene = setLayerLocked(scene, 'locked', true)

  expect(layout.snapTranslation(scene, ['selected'], { x: 9, y: 0 }, { tolerance: 12 })).toEqual({ delta: { x: 9, y: 0 }, activeGuides: [] })
})

it('lays interactive selected nodes in stable grid order without moving locked nodes', () => {
  const layout = new LayoutController()
  let scene = addRectangle(createScene(), rectangle('a', 50, 90))
  scene = addRectangle(scene, rectangle('b', 70, 120))
  scene = addLayer(scene, { id: 'locked', name: 'Locked', visible: true, locked: true })
  scene = addRectangle(scene, rectangle('locked', 300, 300, 'locked'))

  const laidOut = layout.autoLayout(scene, ['a', 'locked', 'b'], { direction: 'grid', columns: 2, gap: { x: 20, y: 30 }, origin: { x: 10, y: 20 } })
  expect(laidOut.nodes.map((node) => [node.id, node.position])).toEqual([
    ['a', { x: 10, y: 20 }],
    ['b', { x: 130, y: 20 }],
    ['locked', { x: 300, y: 300 }],
  ])
})
