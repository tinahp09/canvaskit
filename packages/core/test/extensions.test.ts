import { expect, it } from 'vitest'
import { CanvasKit, ExtensionRegistry } from '../src/index.js'

it('registers extension definitions and removes only the matching cleanup', () => {
  const registry = new ExtensionRegistry()
  const remove = registry.registerCommand({ id: 'zoom-in', label: 'Zoom in', run: () => undefined })
  registry.registerInspector({ id: 'layout', label: 'Layout' })
  expect(registry.snapshot().commands).toEqual([{ id: 'zoom-in', label: 'Zoom in' }])
  remove()
  expect(registry.snapshot()).toMatchObject({ commands: [], inspectors: [{ id: 'layout', label: 'Layout' }] })
})

it('executes registered commands, transitions tools, and reports diagnostics', () => {
  const kit = new CanvasKit()
  const events: string[] = []
  kit.registerCommand({ id: 'hello', label: 'Hello', run: () => events.push('command') })
  kit.registerTool({ id: 'select', label: 'Select', activate: () => events.push('activate:select'), deactivate: () => events.push('deactivate:select') })
  kit.registerTool({ id: 'draw', label: 'Draw', activate: () => events.push('activate:draw') })
  kit.activateTool('select')
  kit.activateTool('draw')
  kit.executeRegisteredCommand('hello')
  expect(events).toEqual(['activate:select', 'deactivate:select', 'activate:draw', 'command'])
  expect(kit.getDiagnostics()).toMatchObject({ activeToolId: 'draw', commands: ['hello'], tools: ['select', 'draw'] })
})
