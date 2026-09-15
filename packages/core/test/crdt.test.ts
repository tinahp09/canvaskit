import { expect, it } from 'vitest'
import { addRectangle, CrdtRuntime, createScene, serializeScene } from '../src/index.js'

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
