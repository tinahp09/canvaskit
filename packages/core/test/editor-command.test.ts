import { expect, it } from 'vitest'
import { addRectangle, CanvasKit, createScene, type EditorCommand } from '../src/index.js'

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
