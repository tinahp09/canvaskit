import { expect, it } from 'vitest'
import { addRectangle, createScene, HistoryController, type CanvasScene, type SceneCommand } from '../src/index.js'

function addRectangleCommand(id: string): SceneCommand {
  return {
    label: `add ${id}`,
    execute: (scene) => addRectangle(scene, {
      id, position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff',
    }),
    undo: (scene) => ({ ...scene, nodes: scene.nodes.filter((node) => node.id !== id) }),
  }
}

it('clears redo when a new command is executed', () => {
  const history = new HistoryController()
  let scene = createScene()

  scene = history.execute(scene, addRectangleCommand('a'))
  scene = history.undo(scene)
  scene = history.execute(scene, addRectangleCommand('b'))

  expect(history.redo(scene).nodes.map((node) => node.id)).toEqual(['b'])
})

it('undoes transaction commands in reverse order', () => {
  const history = new HistoryController()
  let scene: CanvasScene = createScene()

  history.beginTransaction('build workflow')
  scene = history.execute(scene, addRectangleCommand('a'))
  scene = history.execute(scene, addRectangleCommand('b'))
  history.commitTransaction()

  expect(history.undo(scene).nodes).toEqual([])
})

it('does not add an empty committed transaction to history', () => {
  const history = new HistoryController()
  let scene = history.execute(createScene(), addRectangleCommand('a'))

  history.beginTransaction('empty')
  history.commitTransaction()
  scene = history.undo(scene)

  expect(scene.nodes).toEqual([])
})

it('rejects nested transactions', () => {
  const history = new HistoryController()

  history.beginTransaction('outer')

  expect(() => history.beginTransaction('inner')).toThrow('A history transaction is already active.')
})
