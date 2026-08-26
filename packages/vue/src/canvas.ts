import { attachPointerInput, type CanvasKit } from '@canvaskit/core'
import { CanvasRenderer } from '@canvaskit/renderer-canvas'
import { computed, defineComponent, h, inject, onBeforeUnmount, onMounted, ref, watch, type PropType } from 'vue'
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
    const contextualCanvas = inject(CanvasKitContext, undefined)
    const canvas = computed(() => props.canvas ?? contextualCanvas?.value)
    const element = ref<HTMLCanvasElement | null>(null)
    let cleanup: (() => void) | undefined
    let stopWatching: (() => void) | undefined

    if (!canvas.value) throw new Error('CanvasKitCanvas must receive a canvas or be used within a CanvasKitProvider.')

    const removeBinding = () => {
      const currentCleanup = cleanup
      cleanup = undefined
      currentCleanup?.()
    }

    const bind = (nextCanvas: CanvasKit) => {
      removeBinding()
      const target = element.value
      if (!target) return

      const renderer = new CanvasRenderer(target)
      const render = () => renderer.render(nextCanvas.getScene(), nextCanvas.selection.get())
      const detachPointerInput = attachPointerInput(target, nextCanvas)
      const unsubscribe = nextCanvas.subscribe(render)
      let cleaned = false

      render()
      cleanup = () => {
        if (cleaned) return
        cleaned = true
        detachPointerInput()
        unsubscribe()
      }
    }

    onMounted(() => {
      stopWatching = watch(canvas, (nextCanvas) => {
        if (nextCanvas) bind(nextCanvas)
        else removeBinding()
      }, { immediate: true })
    })

    onBeforeUnmount(() => {
      stopWatching?.()
      removeBinding()
    })

    return () => h('canvas', {
      ref: element,
      width: props.width,
      height: props.height,
      'aria-label': props.ariaLabel,
    })
  },
})
