import { expect, it } from 'vitest'
import { addRectangle, CrdtRuntime, createScene, serializeScene, validateCrdtOperation } from '../src/index.js'

it('converges concurrent entity upserts regardless of delivery order', () => {
  const ada = new CrdtRuntime('ada')
  const bea = new CrdtRuntime('bea')
  const base = createScene()
  const adaScene = addRectangle(base, { id: 'ada-node', position: { x: 10, y: 10 }, size: { width: 80, height: 40 }, fill: '#8b5cf6' })
  const beaScene = addRectangle(base, { id: 'bea-node', position: { x: 120, y: 10 }, size: { width: 80, height: 40 }, fill: '#38bdf8' })
  const adaOperation = ada.recordLocal(base, adaScene)
  const beaOperation = bea.recordLocal(base, beaScene)

  const onAda = ada.applyRemote(beaOperation, adaScene)
  const onBea = bea.applyRemote(adaOperation, beaScene)

  expect(serializeScene(onAda.scene)).toBe(serializeScene(onBea.scene))
})

it('does not resurrect a node after a newer tombstone', () => {
  const runtime = new CrdtRuntime('ada')
  const withNode = addRectangle(createScene(), { id: 'node', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#000' })
  const removed = { ...withNode, nodes: [] }
  const remove = runtime.recordLocal(withNode, removed)
  const staleUpsert = { id: 'bea:0', actorId: 'bea', clock: 0, target: 'scene', kind: 'node-upsert' as const, nodeId: 'node', node: withNode.nodes[0] }
  const result = runtime.applyRemote(staleUpsert, removed)
  expect(remove.kind).toBe('node-remove')
  expect(result).toMatchObject({ applied: false, reason: 'stale' })
  expect(result.scene.nodes).toEqual([])
})

it('is idempotent for duplicate remote operations', () => {
  const source = new CrdtRuntime('ada')
  const target = new CrdtRuntime('bea')
  const base = createScene()
  const scene = addRectangle(base, { id: 'node', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#000' })
  const operation = source.recordLocal(base, scene)
  const applied = target.applyRemote(operation, base)
  expect(target.applyRemote(operation, applied.scene)).toMatchObject({ applied: false, reason: 'duplicate' })
})

it('rejects malformed remote operations before mutating a scene', () => {
  const scene = createScene()
  expect(() => validateCrdtOperation({ id: 'bad', actorId: 'ada', clock: 1, target: 'scene', kind: 'node-upsert', nodeId: 'node' })).toThrow('Invalid CRDT operation.')
  const runtime = new CrdtRuntime('ada')
  expect(() => runtime.applyRemote({ id: '', actorId: 'ada' }, scene)).toThrow('Invalid CRDT operation.')
  expect(scene.nodes).toEqual([])
})
