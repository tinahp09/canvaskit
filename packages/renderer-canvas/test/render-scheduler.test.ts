import { expect, it, vi } from 'vitest'
import { RenderScheduler } from '../src/index.js'

it('renders only the latest invalidation in a single animation frame', () => {
  let frame: FrameRequestCallback | undefined
  const request = vi.fn((callback: FrameRequestCallback) => {
    frame = callback
    return 7
  })
  vi.stubGlobal('requestAnimationFrame', request)
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  const first = vi.fn()
  const latest = vi.fn()

  try {
    const scheduler = new RenderScheduler()
    scheduler.schedule(first)
    scheduler.schedule(latest)
    scheduler.schedule(latest)

    expect(request).toHaveBeenCalledExactlyOnceWith(expect.any(Function))
    expect(first).not.toHaveBeenCalled()
    expect(latest).not.toHaveBeenCalled()

    frame?.(0)

    expect(first).not.toHaveBeenCalled()
    expect(latest).toHaveBeenCalledExactlyOnceWith()
  } finally {
    vi.unstubAllGlobals()
  }
})

it('cancels a queued render when disposed', () => {
  let frame: FrameRequestCallback | undefined
  const cancel = vi.fn()
  vi.stubGlobal('cancelAnimationFrame', cancel)
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
    frame = callback
    return 9
  }))
  const render = vi.fn()

  try {
    const scheduler = new RenderScheduler()
    scheduler.schedule(render)
    scheduler.dispose()
    frame?.(0)

    expect(cancel).toHaveBeenCalledExactlyOnceWith(9)
    expect(render).not.toHaveBeenCalled()
  } finally {
    vi.unstubAllGlobals()
  }
})

it('renders synchronously when animation frames are unavailable', () => {
  vi.stubGlobal('requestAnimationFrame', undefined)
  const render = vi.fn()

  try {
    new RenderScheduler().schedule(render)

    expect(render).toHaveBeenCalledExactlyOnceWith()
  } finally {
    vi.unstubAllGlobals()
  }
})
