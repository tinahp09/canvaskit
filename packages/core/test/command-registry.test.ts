import { expect, it } from 'vitest'
import {
  CommandRegistry,
  normalizeShortcut,
  type CommandContext,
} from '../src/index.js'

const context: CommandContext = { activeDocumentId: 'document-a' }

it('rejects duplicate command IDs and exposes a title-sorted immutable snapshot', () => {
  const registry = new CommandRegistry()
  registry.register({ id: 'zoom-in', title: 'Zoom in', execute: () => undefined })
  registry.register({ id: 'align-left', title: 'Align left', execute: () => undefined })

  expect(registry.getSnapshot().map((command) => command.id)).toEqual(['align-left', 'zoom-in'])
  expect(Object.isFrozen(registry.getSnapshot())).toBe(true)
  expect(() => registry.register({ id: 'zoom-in', title: 'Another zoom', execute: () => undefined })).toThrow('zoom-in')
})

it('reports disabled and missing commands without invoking their executor', () => {
  let executions = 0
  const registry = new CommandRegistry()
  registry.register({
    id: 'delete-selection',
    title: 'Delete selection',
    isEnabled: () => false,
    execute: () => { executions += 1 },
  })

  expect(registry.execute('delete-selection', context)).toEqual({ executed: false, reason: 'disabled' })
  expect(registry.execute('unknown-command', context)).toEqual({ executed: false, reason: 'missing' })
  expect(executions).toBe(0)
})

it('normalizes Mod shortcuts and finds a registered command by its normalized shortcut', () => {
  const registry = new CommandRegistry()
  registry.register({ id: 'palette', title: 'Open command palette', shortcut: 'shift + mod + k', execute: () => undefined })

  expect(normalizeShortcut('shift + mod + k')).toBe('Mod+Shift+K')
  expect(registry.findByShortcut('k+shift+mod')?.id).toBe('palette')
})
