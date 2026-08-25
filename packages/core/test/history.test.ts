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

it('rejects undo and redo while a transaction is active', () => {
  const history = new HistoryController()
  const scene = createScene()

  history.beginTransaction('editing')

  expect(() => history.undo(scene)).toThrow('Cannot undo while a history transaction is active.')
  expect(() => history.redo(scene)).toThrow('Cannot redo while a history transaction is active.')
})

it('preserves history stacks when command callbacks throw', () => {
  const history = new HistoryController()
  const initial = createScene()
  const applied = history.execute(initial, {
    label: 'apply',
    execute: (scene) => ({ ...scene, metadata: { state: 'applied' } }),
    undo: (scene) => ({ ...scene, metadata: {} }),
  })
  const undone = history.undo(applied)

  expect(() => history.execute(undone, {
    label: 'broken execute',
    execute: () => { throw new Error('execute failed') },
    undo: (scene) => scene,
  })).toThrow('execute failed')
  expect(history.redo(undone).metadata).toEqual({ state: 'applied' })

  let brokenUndoExecutions = 0
  const brokenUndoScene = history.execute(applied, {
    label: 'broken undo',
    execute: (scene) => ({
      ...scene,
      metadata: { state: brokenUndoExecutions++ === 0 ? 'broken undo applied' : 'broken undo redone' },
    }),
    undo: () => { throw new Error('undo failed') },
  })

  expect(() => history.undo(brokenUndoScene)).toThrow('undo failed')
  expect(history.redo(brokenUndoScene).metadata).toEqual({ state: 'broken undo applied' })

  let redoExecutions = 0
  const redoFailureScene = history.execute(initial, {
    label: 'broken redo',
    execute: (scene) => {
      if (redoExecutions++ > 0) throw new Error('redo failed')
      return { ...scene, metadata: { state: 'redo candidate' } }
    },
    undo: (scene) => ({ ...scene, metadata: {} }),
  })
  const redoFailureUndone = history.undo(redoFailureScene)

  expect(() => history.redo(redoFailureUndone)).toThrow('redo failed')
  expect(() => history.redo(redoFailureUndone)).toThrow('redo failed')
})
