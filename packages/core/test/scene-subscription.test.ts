import { expect, it } from 'vitest'
import { addRectangle, CanvasKit } from '../src/index.js'

it('notifies subscribers with the current snapshot after setScene and stops after idempotent unsubscribe', () => {
  const kit = new CanvasKit()
  const snapshots = []
  const unsubscribe = kit.subscribe((scene) => snapshots.push(scene))
  const replacement = addRectangle(kit.getScene(), {
    id: 'rectangle', position: { x: 10, y: 20 }, size: { width: 30, height: 40 }, fill: '#fff',
  })

  kit.setScene(replacement)

  expect(snapshots).toEqual([kit.getScene()])

  unsubscribe()
  unsubscribe()
  kit.setScene(kit.getScene())

  expect(snapshots).toHaveLength(1)
})
