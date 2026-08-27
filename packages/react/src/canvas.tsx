import { useContext, useEffect, useRef } from 'react'
import type { CanvasKit } from '@canvaskit/core'
import { attachKeyboardInput, attachPointerInput } from '@canvaskit/core'
import { CanvasRenderer, RenderScheduler } from '@canvaskit/renderer-canvas'
import { CanvasKitContext } from './context.js'

export interface CanvasKitCanvasProps {
  canvas?: CanvasKit
  width?: number
  height?: number
  ariaLabel?: string
}

export function CanvasKitCanvas({
  canvas,
  width = 800,
  height = 600,
  ariaLabel = 'CanvasKit canvas',
}: CanvasKitCanvasProps): JSX.Element {
  const contextualCanvas = useContext(CanvasKitContext)
  const instance = canvas ?? contextualCanvas
  const elementRef = useRef<HTMLCanvasElement>(null)

  if (!instance) throw new Error('CanvasKitCanvas must receive a canvas or be used within a CanvasKitProvider.')

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const renderer = new CanvasRenderer(element)
    const render = () => renderer.render(instance.getScene(), instance.selection.get())
    const scheduler = new RenderScheduler()
    const detachPointerInput = attachPointerInput(element, instance)
    const detachKeyboardInput = attachKeyboardInput(element, instance)
    const unsubscribe = instance.subscribe(() => scheduler.schedule(render))

    render()

    return () => {
      detachPointerInput()
      detachKeyboardInput()
      unsubscribe()
      scheduler.dispose()
    }
  }, [instance])

  return <canvas ref={elementRef} width={width} height={height} role="application" tabIndex={0} aria-label={ariaLabel} aria-keyshortcuts="Control+A Meta+A Delete Backspace" />
}
