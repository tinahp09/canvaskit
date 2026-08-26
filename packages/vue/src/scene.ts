import type { CanvasScene } from '@canvaskit/core'
import { onScopeDispose, readonly, shallowRef, watch, type ShallowRef } from 'vue'
import { useCanvasKitRef } from './canvas-kit.js'

export function useCanvasScene(): Readonly<ShallowRef<CanvasScene>> {
  const canvas = useCanvasKitRef()
  const scene = shallowRef<CanvasScene>(canvas.value.getScene())
  let unsubscribe: (() => void) | undefined

  watch(canvas, (nextCanvas) => {
    unsubscribe?.()
    scene.value = nextCanvas.getScene()
    unsubscribe = nextCanvas.subscribe((nextScene) => { scene.value = nextScene })
  }, { immediate: true })

  onScopeDispose(() => unsubscribe?.())

  return readonly(scene) as Readonly<ShallowRef<CanvasScene>>
}
