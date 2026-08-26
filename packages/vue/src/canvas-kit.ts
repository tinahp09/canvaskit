import { CanvasKit } from '@canvaskit/core'
import { defineComponent, inject, onScopeDispose, provide, shallowRef, type PropType } from 'vue'
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
    const ownedCanvas = shallowRef<CanvasKit | undefined>(props.canvas === undefined ? new CanvasKit() : undefined)
    const canvas = props.canvas ?? ownedCanvas.value

    if (!canvas) throw new Error('CanvasKitProvider could not create a CanvasKit instance.')

    provide(CanvasKitContext, canvas)
    onScopeDispose(() => ownedCanvas.value?.dispose())

    return () => slots.default?.()
  },
})

export function useCanvasKit(): CanvasKit {
  const canvas = injectCanvasKit()
  if (!canvas) throw new Error('useCanvasKit must be used within a CanvasKitProvider.')
  return canvas
}

function injectCanvasKit(): CanvasKit | undefined {
  return inject(CanvasKitContext, undefined)
}
