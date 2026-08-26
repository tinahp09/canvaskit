import type { CanvasKit } from '@canvaskit/core'
import type { InjectionKey, ShallowRef } from 'vue'

export const CanvasKitContext: InjectionKey<ShallowRef<CanvasKit>> = Symbol('CanvasKitContext')
