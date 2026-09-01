import { expect, it } from 'vitest'
import { addCircle, addRectangle, addText, createScene, groupNodes, setGroupParent, TransformController, UnsupportedPersistentRotationError } from '../src/index.js'

const controller = new TransformController()

it('returns a normalized bounding overlay and world-space handles for a multi-node selection', () => {
  const scene = addCircle(addRectangle(createScene(), {
    id: 'rectangle', position: { x: 40, y: 60 }, size: { width: -20, height: -30 }, fill: '#fff',
  }), {
    id: 'circle', position: { x: -10, y: 10 }, radius: 5, fill: '#000',
  })

  expect(controller.getOverlay(scene, ['rectangle', 'circle'])).toEqual({
    bounds: { x: -15, y: 5, width: 55, height: 55 },
    handles: {
      'north-west': { x: -15, y: 5 },
      north: { x: 12.5, y: 5 },
      'north-east': { x: 40, y: 5 },
      east: { x: 40, y: 32.5 },
      'south-east': { x: 40, y: 60 },
      south: { x: 12.5, y: 60 },
      'south-west': { x: -15, y: 60 },
      west: { x: -15, y: 32.5 },
      rotate: { x: 12.5, y: -19 },
    },
    rotation: 0,
  })
})

it('resizes a rectangle from its north-west handle without mutating the input scene', () => {
  const scene = addRectangle(createScene(), {
    id: 'rectangle', position: { x: 10, y: 20 }, size: { width: 30, height: 40 }, fill: '#fff',
  })

  const resized = controller.resize(scene, ['rectangle'], 'north-west', { x: 0, y: 10 })

  expect(resized.nodes[0]).toMatchObject({
    type: 'rectangle', position: { x: 0, y: 10 }, size: { width: 40, height: 50 }, fill: '#fff',
  })
  expect(scene.nodes[0]).toMatchObject({ position: { x: 10, y: 20 }, size: { width: 30, height: 40 } })
})

it('resizes a circle from its east handle by updating its center and radius', () => {
  const scene = addCircle(createScene(), {
    id: 'circle', position: { x: 10, y: 20 }, radius: 10, fill: '#000',
  })

  const resized = controller.resize(scene, ['circle'], 'east', { x: 40, y: 30 })

  expect(resized.nodes[0]).toEqual({
    id: 'circle', layerId: 'layer-default', type: 'circle', position: { x: 20, y: 20 }, radius: 20, fill: '#000',
  })
})

it('resizes text from its south handle with a uniform, centered cross-axis expansion', () => {
  const scene = addText(createScene(), {
    id: 'text', position: { x: 10, y: 30 }, text: 'hi', fontSize: 10, fill: '#123',
  })

  const resized = controller.resize(scene, ['text'], 'south', { x: 20, y: 40 })

  expect(resized.nodes[0]).toEqual({
    id: 'text', layerId: 'layer-default', type: 'text', position: { x: 0, y: 40 }, text: 'hi', runs: [{ text: 'hi' }], fontSize: 20, fill: '#123',
  })
  expect(controller.getOverlay(resized, ['text'])?.bounds).toEqual({ x: 0, y: 20, width: 40, height: 20 })
})

it('enforces selection minimum dimensions from the dragged edge', () => {
  const scene = addRectangle(createScene(), {
    id: 'rectangle', position: { x: 10, y: 20 }, size: { width: 30, height: 40 }, fill: '#fff',
  })

  const resized = controller.resize(scene, ['rectangle'], 'west', { x: 39, y: 20 }, { minWidth: 12 })

  expect(resized.nodes[0]).toMatchObject({ position: { x: 28, y: 20 }, size: { width: 12, height: 40 } })
})

it('locks the original aspect ratio when resizing from a corner', () => {
  const scene = addRectangle(createScene(), {
    id: 'rectangle', position: { x: 10, y: 20 }, size: { width: 40, height: 20 }, fill: '#fff',
  })

  const resized = controller.resize(scene, ['rectangle'], 'south-east', { x: 90, y: 50 }, { preserveAspectRatio: true })

  expect(resized.nodes[0]).toMatchObject({ position: { x: 10, y: 20 }, size: { width: 80, height: 40 } })
})

it('projects a mixed rectangle and circle selection to one uniform corner transform with stable bounds', () => {
  const scene = addCircle(addRectangle(createScene(), {
    id: 'rectangle', position: { x: 0, y: 0 }, size: { width: 20, height: 20 }, fill: '#fff',
  }), {
    id: 'circle', position: { x: 40, y: 10 }, radius: 10, fill: '#000',
  })

  const resized = controller.resize(scene, ['rectangle', 'circle'], 'south-east', { x: 100, y: 30 })

  expect(resized.nodes[1]).toEqual({
    id: 'circle', layerId: 'layer-default', type: 'circle', position: { x: 80, y: 20 }, radius: 20, fill: '#000',
  })
  expect(controller.getOverlay(resized, ['rectangle', 'circle'])?.bounds).toEqual({ x: 0, y: 0, width: 100, height: 40 })
  expect(controller.getOverlay(resized, ['rectangle', 'circle'])?.handles['south-east']).toEqual({ x: 100, y: 40 })
})

it('projects a mixed rectangle and text selection to one uniform corner transform with stable bounds', () => {
  const scene = addText(addRectangle(createScene(), {
    id: 'rectangle', position: { x: 0, y: 0 }, size: { width: 20, height: 20 }, fill: '#fff',
  }), {
    id: 'text', position: { x: 30, y: 10 }, text: 'hi', fontSize: 10, fill: '#123',
  })

  const resized = controller.resize(scene, ['rectangle', 'text'], 'south-east', { x: 100, y: 30 })

  expect(resized.nodes[1]).toEqual({
    id: 'text', layerId: 'layer-default', type: 'text', position: { x: 60, y: 20 }, text: 'hi', runs: [{ text: 'hi' }], fontSize: 20, fill: '#123',
  })
  expect(controller.getOverlay(resized, ['rectangle', 'text'])?.bounds).toEqual({ x: 0, y: 0, width: 100, height: 40 })
  expect(controller.getOverlay(resized, ['rectangle', 'text'])?.handles['south-east']).toEqual({ x: 100, y: 40 })
})

it('leaves the scene untouched when selection is empty or includes an unknown node', () => {
  const scene = addRectangle(createScene(), {
    id: 'rectangle', position: { x: 10, y: 20 }, size: { width: 30, height: 40 }, fill: '#fff',
  })

  expect(controller.getOverlay(scene, [])).toBeUndefined()
  expect(controller.getOverlay(scene, ['missing'])).toBeUndefined()
  expect(controller.resize(scene, [], 'east', { x: 60, y: 20 })).toBe(scene)
  expect(controller.resize(scene, ['rectangle', 'missing'], 'east', { x: 60, y: 20 })).toBe(scene)
})

it('leaves a degenerate selection untouched rather than producing non-finite geometry', () => {
  const scene = addText(createScene(), {
    id: 'empty-text', position: { x: 10, y: 30 }, text: '', fontSize: 10, fill: '#123',
  })

  expect(controller.resize(scene, ['empty-text'], 'east', { x: 40, y: 30 })).toBe(scene)
})

it('rotates selected nodes around their common centre and persists the angle', () => {
  const scene = addRectangle(createScene(), {
    id: 'left', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff',
  })
  const withRight = addRectangle(scene, { id: 'right', position: { x: 20, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff' })

  const rotated = controller.rotate(withRight, ['left', 'right'], Math.PI / 2)

  expect(rotated.nodes).toMatchObject([
    { id: 'left', position: { x: 10, y: -10 }, rotation: Math.PI / 2 },
    { id: 'right', position: { x: 10, y: 10 }, rotation: Math.PI / 2 },
  ])
  expect(withRight.nodes).not.toHaveProperty('0.rotation')
})

it('resolves nested group selections to each leaf exactly once for transforms', () => {
  let scene = addRectangle(createScene(), { id: 'left', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff' })
  scene = addRectangle(scene, { id: 'right', position: { x: 20, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff' })
  scene = groupNodes(scene, { id: 'child', nodeIds: ['right'] })
  scene = groupNodes(scene, { id: 'parent', nodeIds: ['left'] })
  scene = setGroupParent(scene, 'child', 'parent')

  const rotated = controller.rotate(scene, ['parent', 'child'], Math.PI / 2)

  expect(controller.getOverlay(scene, ['parent'])?.bounds).toEqual({ x: 0, y: 0, width: 30, height: 10 })
  expect(rotated.nodes).toMatchObject([
    { id: 'left', position: { x: 10, y: -10 }, rotation: Math.PI / 2 },
    { id: 'right', position: { x: 10, y: 10 }, rotation: Math.PI / 2 },
  ])
})
