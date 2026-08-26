// @vitest-environment jsdom

import { addRectangle, CanvasKit, type CanvasScene } from '@canvaskit/core'
import { render } from '@testing-library/vue'
import { defineComponent, h, nextTick } from 'vue'
import { expect, it, vi } from 'vitest'
import { CanvasKitProvider, useCanvasKit, useCanvasScene } from '../src/index.js'

const rectangle = {
  id: 'rectangle',
  position: { x: 10, y: 20 },
  size: { width: 30, height: 40 },
  fill: '#fff',
}

class ObservableCanvasKit extends CanvasKit {
  activeSceneSubscriptions = 0

  override subscribe(listener: (scene: CanvasScene) => void): () => void {
    const unsubscribe = super.subscribe(listener)
    this.activeSceneSubscriptions += 1
    return () => {
      this.activeSceneSubscriptions -= 1
      unsubscribe()
    }
  }
}

const SceneCount = defineComponent({
  setup() {
    const scene = useCanvasScene()
    return () => h('output', String(scene.value.nodes.length))
  },
})

const CanvasIdentity = defineComponent({
  setup() {
    const canvas = useCanvasKit()
    return () => h('output', canvas instanceof CanvasKit ? 'available' : 'missing')
  },
})

it('updates useCanvasScene after a Core mutation and removes its subscription on scope disposal', async () => {
  const kit = new ObservableCanvasKit()
  const view = render(defineComponent({
    setup: () => () => h(CanvasKitProvider, { canvas: kit }, { default: () => h(SceneCount) }),
  }))

  expect(view.getByText('0')).toBeTruthy()
  expect(kit.activeSceneSubscriptions).toBe(1)

  kit.setScene(addRectangle(kit.getScene(), rectangle))
  await nextTick()

  expect(view.getByText('1')).toBeTruthy()
  view.unmount()
  expect(kit.activeSceneSubscriptions).toBe(0)
})

it('returns the provider CanvasKit instance', () => {
  const view = render(defineComponent({
    setup: () => () => h(CanvasKitProvider, { canvas: new CanvasKit() }, { default: () => h(CanvasIdentity) }),
  }))

  expect(view.container.textContent).toBe('available')
})

it('does not dispose a caller-provided CanvasKit when the provider scope is disposed', () => {
  const supplied = new CanvasKit()
  let cleanups = 0
  supplied.use({
    id: 'supplied-cleanup-tracker',
    install: () => () => { cleanups += 1 },
  })

  const view = render(defineComponent({
    setup: () => () => h(CanvasKitProvider, { canvas: supplied }, { default: () => h(CanvasIdentity) }),
  }))
  view.unmount()

  expect(cleanups).toBe(0)
})

it('throws a clear error when useCanvasKit is called outside a provider', () => {
  const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

  try {
    expect(() => render(CanvasIdentity)).toThrow('useCanvasKit must be used within a CanvasKitProvider.')
  } finally {
    consoleWarn.mockRestore()
  }
})
