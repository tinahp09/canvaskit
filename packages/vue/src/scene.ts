import type { CanvasScene } from '@canvaskit/core'
import { onScopeDispose, readonly, shallowRef, type ShallowRef } from 'vue'
import { useCanvasKit } from './canvas-kit.js'

export function useCanvasScene(): Readonly<ShallowRef<CanvasScene>> {
  const canvas = useCanvasKit()
  const scene = shallowRef<CanvasScene>(canvas.getScene())
  const unsubscribe = canvas.subscribe((nextScene) => { scene.value = nextScene })

  onScopeDispose(unsubscribe)

  return readonly(scene) as Readonly<ShallowRef<CanvasScene>>
}
