import { CanvasKit } from '@canvaskit/core'
import { defineComponent, inject, onScopeDispose, provide, shallowRef, watch, type PropType, type ShallowRef } from 'vue'
import { CanvasKitContext } from './context.js'

export interface CanvasKitProviderProps {
  canvas?: CanvasKit
}

export const CanvasKitProvider = defineComponent({
  name: 'CanvasKitProvider',
  props: {
    canvas: Object as PropType<CanvasKit | undefined>,
  },
  setup(props, { slots }) {
    const ownedCanvas = shallowRef<CanvasKit>()
    const createOwnedCanvas = () => ownedCanvas.value ?? (ownedCanvas.value = new CanvasKit())
    const canvas = shallowRef<CanvasKit>(props.canvas ?? createOwnedCanvas())

    watch(() => props.canvas, (suppliedCanvas) => {
      canvas.value = suppliedCanvas ?? createOwnedCanvas()
    })

    provide(CanvasKitContext, canvas)
    onScopeDispose(() => ownedCanvas.value?.dispose())

    return () => slots.default?.()
  },
})

export function useCanvasKit(): CanvasKit {
  return useCanvasKitRef().value
}

export function useCanvasKitRef(): ShallowRef<CanvasKit> {
  const canvas = inject(CanvasKitContext, undefined)
  if (!canvas) throw new Error('useCanvasKit must be used within a CanvasKitProvider.')
  return canvas
}
