import type { CanvasKit } from '@canvaskit/core'
import type { InjectionKey } from 'vue'

export const CanvasKitContext: InjectionKey<CanvasKit> = Symbol('CanvasKitContext')
