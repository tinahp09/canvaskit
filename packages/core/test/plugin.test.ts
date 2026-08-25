import { expect, it } from 'vitest'
import { CanvasKit, EdgeRegistry, NodeRegistry, type CanvasPlugin } from '../src/index.js'

it('registers named node and edge definitions', () => {
  const nodes = new NodeRegistry<{ id: string, label: string }>()
  const edges = new EdgeRegistry<{ id: string, directed: boolean }>()

  nodes.register({ id: 'database', label: 'Database' })
  edges.register({ id: 'relationship', directed: true })

  expect(nodes.get('database')).toEqual({ id: 'database', label: 'Database' })
  expect(edges.get('relationship')).toEqual({ id: 'relationship', directed: true })
})

it('rejects duplicate node and edge definition ids', () => {
  const nodes = new NodeRegistry()
  const edges = new EdgeRegistry()

  nodes.register({ id: 'database' })
  edges.register({ id: 'relationship' })

  expect(() => nodes.register({ id: 'database' })).toThrow('Node definition "database" is already registered.')
  expect(() => edges.register({ id: 'relationship' })).toThrow('Edge definition "relationship" is already registered.')
})

it('disposes plugin cleanups in reverse installation order', () => {
  const canvas = new CanvasKit()
  const events: string[] = []
  const first: CanvasPlugin = {
    id: 'first',
    install: () => {
      events.push('install:first')
      return () => events.push('dispose:first')
    },
  }
  const second: CanvasPlugin = {
    id: 'second',
    install: () => {
      events.push('install:second')
      return () => events.push('dispose:second')
    },
  }

  canvas.use(first)
  canvas.use(second)
  canvas.dispose()

  expect(events).toEqual(['install:first', 'install:second', 'dispose:second', 'dispose:first'])
})

it('rejects a plugin id that has already been installed', () => {
  const canvas = new CanvasKit()
  const plugin: CanvasPlugin = { id: 'grid', install: () => undefined }

  canvas.use(plugin)

  expect(() => canvas.use(plugin)).toThrow('Plugin "grid" is already installed.')
})

it('reserves plugin ids during installation and rolls back when installation fails', () => {
  const canvas = new CanvasKit()
  let shouldFail = true
  const plugin: CanvasPlugin = {
    id: 'grid',
    install: (kit) => {
      expect(() => kit.use({ id: 'grid', install: () => undefined })).toThrow('Plugin "grid" is already installed.')
      if (shouldFail) throw new Error('grid setup failed')
    },
  }

  expect(() => canvas.use(plugin)).toThrow('grid setup failed')

  shouldFail = false
  expect(() => canvas.use(plugin)).not.toThrow()
})

it('does not run plugin cleanups more than once', () => {
  const canvas = new CanvasKit()
  let cleanupCount = 0

  canvas.use({ id: 'grid', install: () => () => { cleanupCount += 1 } })
  canvas.dispose()
  canvas.dispose()

  expect(cleanupCount).toBe(1)
})
