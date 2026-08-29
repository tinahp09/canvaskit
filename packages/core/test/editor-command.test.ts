import { expect, it } from 'vitest'
import { addConnector, addRectangle, CanvasKit, createScene, type EditorCommand } from '../src/index.js'

const rectangle = { id: 'a', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff' }

it('dispatches every command and reports whether clipboard work changed observable state', () => {
  const kit = new CanvasKit({ scene: addRectangle(createScene(), rectangle) })
  const emptyClipboardCommands: EditorCommand[] = ['copy', 'cut', 'paste', 'duplicate']

  expect(emptyClipboardCommands.map((command) => kit.executeCommand(command))).toEqual([false, false, false, false])
  expect(kit.executeCommand('select-all')).toBe(true)
  expect(kit.selection.get()).toEqual(['a'])
  expect(kit.executeCommand('copy')).toBe(true)
  expect(kit.executeCommand('duplicate')).toBe(true)
  expect(kit.getScene().nodes.map((node) => node.id)).toEqual(['a', 'a-copy'])
  expect(kit.executeCommand('clear-selection')).toBe(true)
  expect(kit.selection.get()).toEqual([])
  expect(kit.executeCommand('paste')).toBe(true)
  expect(kit.selection.get()).toEqual(['a-copy-2'])
  expect(kit.executeCommand('delete-selection')).toBe(true)
  expect(kit.getScene().nodes.map((node) => node.id)).toEqual(['a', 'a-copy'])
  expect(kit.executeCommand('cut')).toBe(false)
})

it('clears connector selection so a later delete command cannot remove a stale connector', () => {
  let scene = addRectangle(createScene(), rectangle)
  scene = addRectangle(scene, { id: 'b', position: { x: 40, y: 0 }, size: { width: 10, height: 10 }, fill: '#000' })
  scene = addConnector(scene, {
    id: 'relation', sourceNodeId: 'a', sourcePortId: 'east', targetNodeId: 'b', targetPortId: 'west', routing: 'straight',
  })
  const kit = new CanvasKit({ scene })

  expect(kit.selectConnector('relation')).toBe(true)
  expect(kit.executeCommand('clear-selection')).toBe(true)
  expect(kit.getSelectedConnector()).toBeUndefined()
  expect(kit.executeCommand('clear-selection')).toBe(false)
  expect(kit.executeCommand('delete-selection')).toBe(false)
  expect(kit.getScene().connectors.map((connector) => connector.id)).toEqual(['relation'])
})

it('dispatches transform alignment and distribution commands through the selected nodes', () => {
  const commands: EditorCommand[] = [
    'align-left', 'align-center', 'align-right', 'align-top', 'align-middle', 'align-bottom',
    'distribute-horizontal', 'distribute-vertical',
  ]

  const results = commands.map((command) => {
    let scene = addRectangle(createScene(), rectangle)
    scene = addRectangle(scene, { id: 'b', position: { x: 40, y: 30 }, size: { width: 20, height: 10 }, fill: '#000' })
    scene = addRectangle(scene, { id: 'c', position: { x: 100, y: 80 }, size: { width: 10, height: 20 }, fill: '#123' })
    const kit = new CanvasKit({ scene })
    kit.selection.set(['a', 'b', 'c'])
    return kit.executeCommand(command)
  })

  expect(results).toEqual([true, true, true, true, true, true, true, true])
})

it('does not report a transform command as handled when selection cannot change the scene', () => {
  const kit = new CanvasKit({ scene: addRectangle(createScene(), rectangle) })

  expect(kit.executeCommand('align-left')).toBe(false)
  expect(kit.executeCommand('distribute-horizontal')).toBe(false)
  kit.selection.select('a')
  expect(kit.executeCommand('align-left')).toBe(false)
  expect(kit.executeCommand('distribute-horizontal')).toBe(false)
})

it('groups and ungroups the current selection through commands that need no arguments', () => {
  let scene = addRectangle(createScene(), rectangle)
  scene = addRectangle(scene, { id: 'b', position: { x: 20, y: 0 }, size: { width: 10, height: 10 }, fill: '#000' })
  const kit = new CanvasKit({ scene })

  expect(kit.executeCommand('group-selection')).toBe(false)
  kit.selection.set(['a', 'b'])
  expect(kit.executeCommand('group-selection')).toBe(true)
  expect(kit.getScene().groups).toEqual([{ id: 'group-1', nodeIds: ['a', 'b'] }])
  expect(kit.undo().groups).toEqual([])
  expect(kit.redo().groups).toEqual([{ id: 'group-1', nodeIds: ['a', 'b'] }])
  expect(kit.executeCommand('ungroup-selection')).toBe(true)
  expect(kit.getScene().groups).toEqual([])
  expect(kit.undo().groups).toEqual([{ id: 'group-1', nodeIds: ['a', 'b'] }])
})
