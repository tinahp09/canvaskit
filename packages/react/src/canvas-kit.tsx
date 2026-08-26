import { useContext, useEffect, useState, type ReactNode } from 'react'
import { CanvasKit } from '@canvaskit/core'
import { CanvasKitContext } from './context.js'

export interface CanvasKitProviderProps {
  canvas?: CanvasKit
  children?: ReactNode
}

export function CanvasKitProvider({ canvas, children }: CanvasKitProviderProps): JSX.Element {
  const [ownedCanvas] = useState(() => canvas === undefined ? new CanvasKit() : undefined)
  const instance = canvas ?? ownedCanvas

  useEffect(() => () => ownedCanvas?.dispose(), [ownedCanvas])

  return <CanvasKitContext.Provider value={instance}>{children}</CanvasKitContext.Provider>
}

export function useCanvasKit(): CanvasKit {
  const canvas = useContext(CanvasKitContext)
  if (!canvas) throw new Error('useCanvasKit must be used within a CanvasKitProvider.')
  return canvas
}
