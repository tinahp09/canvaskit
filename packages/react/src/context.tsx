import { createContext } from 'react'
import type { CanvasKit } from '@canvaskit/core'

export const CanvasKitContext = createContext<CanvasKit | undefined>(undefined)
