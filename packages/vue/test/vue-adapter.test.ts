// @vitest-environment jsdom

import { addRectangle, CanvasKit, type CanvasScene } from '@canvaskit/core'
import { fireEvent, render } from '@testing-library/vue'
import { defineComponent, h, nextTick, shallowRef, type PropType } from 'vue'
import { expect, it, vi } from 'vitest'
import { CanvasKitCanvas, CanvasKitProvider, useCanvasKit, useCanvasScene } from '../src/index.js'

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

const CanvasCapture = defineComponent({
  props: {
    onCanvas: { type: Function as PropType<(canvas: CanvasKit) => void>, required: true },
  },
  setup(props) {
    props.onCanvas(useCanvasKit())
    return () => h('output', 'available')
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

it('switches to a retained owned fallback as supplied CanvasKit props are removed and replaced', async () => {
  const supplied = new CanvasKit()
  const replacement = new CanvasKit()
  const source = shallowRef<CanvasKit | undefined>(supplied)
  const revision = shallowRef(0)
  let suppliedCleanups = 0
  let replacementCleanups = 0
  let ownedCleanups = 0
  let received: CanvasKit | undefined
  supplied.use({ id: 'supplied-cleanup-tracker', install: () => () => { suppliedCleanups += 1 } })
  replacement.use({ id: 'replacement-cleanup-tracker', install: () => () => { replacementCleanups += 1 } })

  const view = render(defineComponent({
    setup: () => () => h(CanvasKitProvider, { canvas: source.value }, {
      default: () => h(CanvasCapture, { key: revision.value, onCanvas: (canvas) => { received = canvas } }),
    }),
  }))
  expect(received).toBe(supplied)

  source.value = undefined
  revision.value += 1
  await nextTick()
  const owned = received
  expect(owned).toBeInstanceOf(CanvasKit)
  expect(owned).not.toBe(supplied)
  owned?.use({ id: 'owned-cleanup-tracker', install: () => () => { ownedCleanups += 1 } })

  source.value = replacement
  revision.value += 1
  await nextTick()
  expect(received).toBe(replacement)

  source.value = undefined
  revision.value += 1
  await nextTick()
  expect(received).toBe(owned)

  view.unmount()
  expect(suppliedCleanups).toBe(0)
  expect(replacementCleanups).toBe(0)
  expect(ownedCleanups).toBe(1)
})

it('rebinds CanvasKitCanvas pointer input and subscriptions when its canvas changes', async () => {
  const first = new ObservableCanvasKit()
  const second = new ObservableCanvasKit()
  const source = shallowRef(first)
  let firstPointers = 0
  let secondPointers = 0
  first.onPointer(() => { firstPointers += 1 })
  second.onPointer(() => { secondPointers += 1 })
  const context = {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    arc: vi.fn(),
    fillText: vi.fn(),
  } as unknown as CanvasRenderingContext2D
  const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context)

  try {
    const view = render(defineComponent({
      setup: () => () => h(CanvasKitCanvas, { canvas: source.value }),
    }))
    const element = view.container.querySelector('canvas')
    if (!element) throw new Error('Expected CanvasKitCanvas to render a canvas element.')

    expect(first.activeSceneSubscriptions).toBe(1)
    fireEvent.pointerDown(element, { clientX: 10, clientY: 20, button: 0 })
    expect(firstPointers).toBe(1)

    source.value = second
    await nextTick()
    expect(first.activeSceneSubscriptions).toBe(0)
    expect(second.activeSceneSubscriptions).toBe(1)

    fireEvent.pointerDown(element, { clientX: 10, clientY: 20, button: 0 })
    expect(firstPointers).toBe(1)
    expect(secondPointers).toBe(1)

    view.unmount()
    expect(second.activeSceneSubscriptions).toBe(0)
    fireEvent.pointerDown(element, { clientX: 10, clientY: 20, button: 0 })
    expect(secondPointers).toBe(1)
  } finally {
    getContext.mockRestore()
  }
})

it('throws a clear error when useCanvasKit is called outside a provider', () => {
  const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

  try {
    expect(() => render(CanvasIdentity)).toThrow('useCanvasKit must be used within a CanvasKitProvider.')
  } finally {
    consoleWarn.mockRestore()
  }
})
