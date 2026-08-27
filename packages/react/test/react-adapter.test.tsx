// @vitest-environment jsdom

import { addRectangle, CanvasKit, type CanvasScene } from '@canvaskit/core'
import { act, fireEvent, render } from '@testing-library/react'
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

function SceneCount() {
  return <output>{useCanvasScene().nodes.length}</output>
}

function CanvasIdentity() {
  return <output>{useCanvasKit() instanceof CanvasKit ? 'available' : 'missing'}</output>
}

function CanvasCapture({ onCanvas }: { onCanvas: (canvas: CanvasKit) => void }) {
  const canvas = useCanvasKit()
  onCanvas(canvas)
  return <output>available</output>
}

it('updates useCanvasScene after a Core mutation and removes its subscription on unmount', () => {
  const kit = new ObservableCanvasKit()
  const view = render(
    <CanvasKitProvider canvas={kit}>
      <SceneCount />
    </CanvasKitProvider>,
  )

  expect(view.getByText('0')).toBeTruthy()
  expect(kit.activeSceneSubscriptions).toBe(1)

  act(() => kit.setScene(addRectangle(kit.getScene(), rectangle)))

  expect(view.getByText('1')).toBeTruthy()
  view.unmount()
  expect(kit.activeSceneSubscriptions).toBe(0)
})

it('returns the provider CanvasKit instance', () => {
  const view = render(
    <CanvasKitProvider canvas={new CanvasKit()}>
      <CanvasIdentity />
    </CanvasKitProvider>,
  )

  expect(view.container.textContent).toBe('available')
})

it('batches CanvasKitCanvas redraws from scene subscriptions into an animation frame', () => {
  const clearRect = vi.fn()
  const context = {
    clearRect,
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
  let frame: FrameRequestCallback | undefined
  const request = vi.fn((callback: FrameRequestCallback) => {
    frame = callback
    return 4
  })
  vi.stubGlobal('requestAnimationFrame', request)
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  const kit = new CanvasKit()

  try {
    const view = render(<CanvasKitCanvas canvas={kit} />)
    expect(clearRect).toHaveBeenCalledTimes(1)

    act(() => {
      kit.setScene(addRectangle(kit.getScene(), rectangle))
      kit.setScene(addRectangle(kit.getScene(), { ...rectangle, id: 'rectangle-2' }))
    })

    expect(request).toHaveBeenCalledExactlyOnceWith(expect.any(Function))
    expect(clearRect).toHaveBeenCalledTimes(1)

    act(() => frame?.(0))
    expect(clearRect).toHaveBeenCalledTimes(2)
    view.unmount()
  } finally {
    getContext.mockRestore()
    vi.unstubAllGlobals()
  }
})

it('renders a labelled, keyboard-focusable canvas host', () => {
  const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    clearRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), bezierCurveTo: vi.fn(),
    stroke: vi.fn(), fill: vi.fn(), fillRect: vi.fn(), arc: vi.fn(), fillText: vi.fn(),
  } as unknown as CanvasRenderingContext2D)

  try {
    const view = render(<CanvasKitCanvas canvas={new CanvasKit()} ariaLabel="Diagram workspace" />)
    const canvas = view.getByLabelText('Diagram workspace')

    expect(canvas.getAttribute('tabindex')).toBe('0')
    expect(canvas.getAttribute('role')).toBe('application')
  } finally {
    getContext.mockRestore()
  }
})

it('schedules a canvas redraw when keyboard selection changes', () => {
  const clearRect = vi.fn()
  const context = {
    clearRect, beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), bezierCurveTo: vi.fn(),
    stroke: vi.fn(), fill: vi.fn(), fillRect: vi.fn(), arc: vi.fn(), fillText: vi.fn(),
  } as unknown as CanvasRenderingContext2D
  const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context)
  let frame: FrameRequestCallback | undefined
  const request = vi.fn((callback: FrameRequestCallback) => {
    frame = callback
    return 6
  })
  vi.stubGlobal('requestAnimationFrame', request)
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  const kit = new CanvasKit({ scene: addRectangle(new CanvasKit().getScene(), rectangle) })

  try {
    const view = render(<CanvasKitCanvas canvas={kit} />)
    const canvas = view.getByLabelText('CanvasKit canvas')

    act(() => fireEvent.keyDown(canvas, { key: 'a', ctrlKey: true }))

    expect(kit.selection.get()).toEqual(['rectangle'])
    expect(request).toHaveBeenCalledExactlyOnceWith(expect.any(Function))
    act(() => frame?.(0))
    expect(clearRect).toHaveBeenCalledTimes(2)
    view.unmount()
  } finally {
    getContext.mockRestore()
    vi.unstubAllGlobals()
  }
})

it('does not render a queued frame from the previous CanvasKit after rebinding', () => {
  const clearRect = vi.fn()
  const context = {
    clearRect,
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
  const frames: FrameRequestCallback[] = []
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
    frames.push(callback)
    return frames.length
  }))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  const first = new CanvasKit()
  const second = new CanvasKit()

  try {
    const view = render(<CanvasKitCanvas canvas={first} />)
    first.setScene(addRectangle(first.getScene(), rectangle))
    expect(frames).toHaveLength(1)

    act(() => view.rerender(<CanvasKitCanvas canvas={second} />))
    expect(clearRect).toHaveBeenCalledTimes(2)

    act(() => frames[0]?.(0))
    expect(clearRect).toHaveBeenCalledTimes(2)
    view.unmount()
  } finally {
    getContext.mockRestore()
    vi.unstubAllGlobals()
  }
})

it('creates an owned CanvasKit when a supplied instance is removed', () => {
  const supplied = new CanvasKit()
  let suppliedCleanups = 0
  let ownedCleanups = 0
  let current: CanvasKit | undefined
  supplied.use({
    id: 'supplied-cleanup-tracker',
    install: () => () => { suppliedCleanups += 1 },
  })

  const view = render(
    <CanvasKitProvider canvas={supplied}>
      <CanvasCapture onCanvas={(canvas) => { current = canvas }} />
    </CanvasKitProvider>,
  )
  expect(current).toBe(supplied)
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

  try {
    expect(() => view.rerender(
      <CanvasKitProvider>
        <CanvasCapture onCanvas={(canvas) => { current = canvas }} />
      </CanvasKitProvider>,
    )).not.toThrow()
  } finally {
    consoleError.mockRestore()
  }

  expect(current).toBeInstanceOf(CanvasKit)
  expect(current).not.toBe(supplied)
  current?.use({
    id: 'owned-cleanup-tracker',
    install: () => () => { ownedCleanups += 1 },
  })

  view.unmount()

  expect(suppliedCleanups).toBe(0)
  expect(ownedCleanups).toBe(1)
})

it('throws a clear error when useCanvasKit is called outside a provider', () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

  try {
    expect(() => render(<CanvasIdentity />)).toThrow('useCanvasKit must be used within a CanvasKitProvider.')
  } finally {
    consoleError.mockRestore()
  }
})
