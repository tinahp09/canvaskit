import { expect, it } from 'vitest'
import { createScene, validateCollaborationOperation } from '../src/index.js'

it('accepts a serializable canonical Scene V7 collaboration operation', () => {
  const scene = createScene()

  expect(validateCollaborationOperation({
    id: 'ada:1',
    actorId: 'ada',
    clock: 1,
    target: 'scene',
    kind: 'scene',
    scene,
  })).toEqual({
    id: 'ada:1',
    actorId: 'ada',
    clock: 1,
    target: 'scene',
    kind: 'scene',
    scene,
  })
})

it.each([
  { id: '', actorId: 'ada', clock: 1, target: 'scene', kind: 'scene', scene: createScene() },
  { id: 'ada:1', actorId: '', clock: 1, target: 'scene', kind: 'scene', scene: createScene() },
  { id: 'ada:1', actorId: 'ada', clock: -1, target: 'scene', kind: 'scene', scene: createScene() },
  { id: 'ada:1', actorId: 'ada', clock: 1, target: '', kind: 'scene', scene: createScene() },
  { id: 'ada:1', actorId: 'ada', clock: 1, target: 'scene', kind: 'patch', scene: createScene() },
])('rejects malformed collaboration operation %#', (operation) => {
  expect(() => validateCollaborationOperation(operation)).toThrow('Invalid collaboration operation')
})

it('rejects an operation whose scene cannot be parsed canonically', () => {
  expect(() => validateCollaborationOperation({
    id: 'ada:1',
    actorId: 'ada',
    clock: 1,
    target: 'scene',
    kind: 'scene',
    scene: { ...createScene(), layers: [] },
  })).toThrow('Scene must contain at least one layer.')
})
