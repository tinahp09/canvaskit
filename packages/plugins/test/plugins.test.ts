import { addRectangle, CanvasKit, createScene } from '@canvaskit/core'
import { expect, it, vi } from 'vitest'
import { createCommandPlugin, createGridPlugin, createKeyboardPlugin, createMinimapPlugin, createSnapPlugin } from '../src/index.js'

class FakeKeyboardTarget {
  readonly addEventListener = vi.fn((type: string, listener: EventListener) => this.listeners.set(type, listener))
  readonly removeEventListener = vi.fn((type: string) => this.listeners.delete(type))
  private readonly listeners = new Map<string, EventListener>()

  dispatch(event: KeyboardEvent): void {
    this.listeners.get('keydown')?.(event)
  }
}

it('exposes immutable visual grid configuration through its plugin state', () => {
  const plugin = createGridPlugin({ size: 24, style: 'lines', color: '#d0d0d0' })

  expect(plugin.id).toBe('grid')
  expect(plugin.config).toEqual({ size: 24, style: 'lines', color: '#d0d0d0' })
  expect(Object.isFrozen(plugin.config)).toBe(true)
  expect(() => new CanvasKit().use(plugin)).not.toThrow()
})

it('exposes grid-size configuration and snaps points using public core behavior', () => {
  const plugin = createSnapPlugin({ gridSize: 20 })

  expect(plugin.config).toEqual({ gridSize: 20 })
  expect(plugin.snap({ x: 31, y: 49 })).toEqual({ x: 40, y: 40 })
})

it('installs keyboard bindings on its supplied element and cleans them up on disposal', () => {
  const element = new FakeKeyboardTarget()
  const canvas = new CanvasKit({
    scene: addRectangle(createScene(), { id: 'node', position: { x: 0, y: 0 }, size: { width: 1, height: 1 }, fill: '#fff' }),
  })

  canvas.use(createKeyboardPlugin(element as unknown as HTMLElement))
  element.dispatch({ key: 'a', metaKey: true, preventDefault() {} } as KeyboardEvent)
  expect(canvas.selection.get()).toEqual(['node'])

  canvas.dispose()
  expect(element.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
  element.dispatch({ key: 'Delete', preventDefault() {} } as KeyboardEvent)
  expect(canvas.getScene().nodes).toHaveLength(1)
})

it('derives a readonly scene summary through minimap plugin state without a renderer', () => {
  const plugin = createMinimapPlugin()
  const canvas = new CanvasKit({
    scene: addRectangle(createScene(), { id: 'node', position: { x: 10, y: 20 }, size: { width: 30, height: 40 }, fill: '#fff' }),
  })

  expect(plugin.summary).toBeUndefined()
  canvas.use(plugin)

  expect(plugin.summary).toEqual({ nodeCount: 1, edgeCount: 0, groupCount: 0, viewport: { x: 0, y: 0, zoom: 1 } })
  expect(Object.isFrozen(plugin.summary)).toBe(true)
  expect(Object.isFrozen(plugin.summary?.viewport)).toBe(true)
})

it('registers a trusted command through the plugin lifecycle and cleans it up', () => {
  const canvas = new CanvasKit()
  const run = vi.fn()
  canvas.use(createCommandPlugin({ id: 'show-diagnostics', label: 'Show diagnostics', run }))
  canvas.executeRegisteredCommand('show-diagnostics')
  expect(run).toHaveBeenCalledWith(canvas)
  canvas.dispose()
  expect(() => canvas.executeRegisteredCommand('show-diagnostics')).toThrow('Unknown registered command')
})
