import { expect, it } from 'vitest'
import { addRectangle, CollaborationRuntime, createScene, validateCollaborationOperation } from '../src/index.js'

function sceneWithFill(fill: string) {
  return addRectangle(createScene(), {
    id: `node-${fill.slice(1)}`,
    position: { x: 10, y: 20 },
    size: { width: 120, height: 60 },
    fill,
  })
}

function operation(id: string, actorId: string, clock: number, scene = createScene()) {
  return { id, actorId, clock, target: 'scene', kind: 'scene' as const, scene }
}

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

it('records local scene operations with a monotonic actor clock', () => {
  const runtime = new CollaborationRuntime('ada')

  expect(runtime.recordLocal(createScene())).toMatchObject({
    id: 'ada:1', actorId: 'ada', clock: 1, target: 'scene', kind: 'scene',
  })
  expect(runtime.recordLocal(sceneWithFill('#38bdf8'))).toMatchObject({ id: 'ada:2', clock: 2 })
})

it('ignores duplicate and stale remote operations without changing the scene', () => {
  const runtime = new CollaborationRuntime('ada')
  const remote = operation('bea:2', 'bea', 2, sceneWithFill('#38bdf8'))
  const applied = runtime.applyRemote(remote, createScene())

  expect(applied).toEqual({ scene: remote.scene, applied: true })
  expect(runtime.applyRemote(remote, applied.scene)).toEqual({ scene: remote.scene, applied: false, reason: 'duplicate' })
  expect(runtime.applyRemote(operation('bea:1', 'bea', 1), applied.scene)).toEqual({ scene: remote.scene, applied: false, reason: 'stale' })
})

it('uses actor ID to order same-clock operations and advances after remote clocks', () => {
  const runtime = new CollaborationRuntime('ada')
  const ada = operation('ada:3', 'ada', 3, sceneWithFill('#f97316'))
  const bea = operation('bea:3', 'bea', 3, sceneWithFill('#34d399'))

  expect(runtime.applyRemote(ada, createScene())).toMatchObject({ applied: true, scene: ada.scene })
  expect(runtime.applyRemote(bea, ada.scene)).toMatchObject({ applied: true, scene: bea.scene })
  expect(runtime.recordLocal(bea.scene)).toMatchObject({ id: 'ada:4', clock: 4 })
})

it('keeps ephemeral presence outside Scene serialization in stable actor order', () => {
  const runtime = new CollaborationRuntime('ada')
  runtime.setPresence({ actorId: 'bea', updatedAt: 20, selection: ['b'] })
  runtime.setPresence({ actorId: 'ada', updatedAt: 10, selection: ['a'], cursor: { x: 4, y: 8 } })

  expect(runtime.getPresence()).toEqual([
    { actorId: 'ada', updatedAt: 10, selection: ['a'], cursor: { x: 4, y: 8 } },
    { actorId: 'bea', updatedAt: 20, selection: ['b'] },
  ])
  expect(JSON.stringify(createScene())).not.toContain('bea')
  runtime.removePresence('ada')
  expect(runtime.getPresence()).toEqual([{ actorId: 'bea', updatedAt: 20, selection: ['b'] }])
})
