import { attachPointerInput, type CanvasKit } from '@canvaskit/core'
import { CanvasRenderer } from '@canvaskit/renderer-canvas'
import { defineComponent, h, inject, onBeforeUnmount, onMounted, ref, type PropType } from 'vue'
import { CanvasKitContext } from './context.js'

export interface CanvasKitCanvasProps {
  canvas?: CanvasKit
  width?: number
  height?: number
  ariaLabel?: string
}

export const CanvasKitCanvas = defineComponent({
  name: 'CanvasKitCanvas',
  props: {
    canvas: Object as PropType<CanvasKit | undefined>,
    width: { type: Number, default: 800 },
    height: { type: Number, default: 600 },
    ariaLabel: { type: String, default: 'CanvasKit canvas' },
  },
  setup(props) {
    const contextualCanvas = inject(CanvasKitContext)
    const canvas = props.canvas ?? contextualCanvas
    const element = ref<HTMLCanvasElement | null>(null)
    let cleanup: (() => void) | undefined

    if (!canvas) throw new Error('CanvasKitCanvas must receive a canvas or be used within a CanvasKitProvider.')

    onMounted(() => {
      const target = element.value
      if (!target) return

      const renderer = new CanvasRenderer(target)
      const render = () => renderer.render(canvas.getScene(), canvas.selection.get())
      const detachPointerInput = attachPointerInput(target, canvas)
      const unsubscribe = canvas.subscribe(render)

      render()
      cleanup = () => {
        detachPointerInput()
        unsubscribe()
      }
    })

    onBeforeUnmount(() => cleanup?.())

    return () => h('canvas', {
      ref: element,
      width: props.width,
      height: props.height,
      'aria-label': props.ariaLabel,
    })
  },
})
