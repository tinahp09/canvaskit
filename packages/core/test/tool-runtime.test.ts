import { expect, it } from 'vitest'
import { CanvasKit, ToolRuntime } from '../src/index.js'

it('emits deterministic select and pan intents across pointer lifecycle transitions', () => {
  const runtime = new ToolRuntime()

  expect(runtime.handle({ type: 'pointerdown', point: { x: 10, y: 20 } })).toEqual([{ type: 'select-at', point: { x: 10, y: 20 } }])
  runtime.activate('pan')
  expect(runtime.handle({ type: 'pointerdown', point: { x: 10, y: 20 } })).toEqual([])
  expect(runtime.handle({ type: 'pointermove', point: { x: 16, y: 25 } })).toEqual([{ type: 'pan-by', delta: { x: 6, y: 5 } }])
  expect(runtime.handle({ type: 'pointerup', point: { x: 16, y: 25 } })).toEqual([])
  expect(runtime.snapshot()).toEqual({ activeTool: 'pan', phase: 'idle' })
})

it('keeps drawing previews transient and emits a rectangle only at pointer completion', () => {
  const runtime = new ToolRuntime('rectangle')

  expect(runtime.handle({ type: 'pointerdown', point: { x: 30, y: 20 } })).toEqual([])
  expect(runtime.handle({ type: 'pointermove', point: { x: 10, y: 50 } })).toEqual([{ type: 'preview-rectangle', bounds: { x: 10, y: 20, width: 20, height: 30 } }])
  expect(runtime.handle({ type: 'pointerup', point: { x: 10, y: 50 } })).toEqual([{ type: 'create-rectangle', bounds: { x: 10, y: 20, width: 20, height: 30 } }])
  expect(runtime.snapshot()).toEqual({ activeTool: 'rectangle', phase: 'idle' })
})

it('cancels connector interactions without an observable mutation intent', () => {
  const runtime = new ToolRuntime('connector')

  runtime.handle({ type: 'pointerdown', point: { x: 2, y: 4 } })
  expect(runtime.handle({ type: 'pointercancel', point: { x: 8, y: 12 } })).toEqual([])
  expect(runtime.snapshot()).toEqual({ activeTool: 'connector', phase: 'idle' })
})

it('emits text and connector creation intents without renderer coupling', () => {
  const text = new ToolRuntime('text')
  const connector = new ToolRuntime('connector')

  expect(text.handle({ type: 'pointerdown', point: { x: 4, y: 8 } })).toEqual([{ type: 'create-text', point: { x: 4, y: 8 } }])
  connector.handle({ type: 'pointerdown', point: { x: 4, y: 8 } })
  expect(connector.handle({ type: 'pointerup', point: { x: 20, y: 10 } })).toEqual([{ type: 'create-connector', source: { x: 4, y: 8 }, target: { x: 20, y: 10 } }])
})

it('forwards CanvasKit pointer events through its built-in tool runtime as renderer-neutral intents', () => {
  const kit = new CanvasKit()
  const intents: unknown[] = []
  kit.setTool('rectangle')
  kit.onToolIntent((intent) => intents.push(intent))

  kit.createPointerEvent({ x: 30, y: 20 }, 'pointerdown')
  kit.createPointerEvent({ x: 10, y: 50 }, 'pointermove')
  kit.createPointerEvent({ x: 10, y: 50 }, 'pointerup')

  expect(intents).toEqual([
    { type: 'preview-rectangle', bounds: { x: 10, y: 20, width: 20, height: 30 } },
    { type: 'create-rectangle', bounds: { x: 10, y: 20, width: 20, height: 30 } },
  ])
})
