import { useContext, useEffect, useRef, type ReactNode } from 'react'
import { CanvasKit } from '@canvaskit/core'
import { CanvasKitContext } from './context.js'

export interface CanvasKitProviderProps {
  canvas?: CanvasKit
  children?: ReactNode
}

export function CanvasKitProvider({ canvas, children }: CanvasKitProviderProps): JSX.Element {
  const ownedCanvasRef = useRef<CanvasKit | undefined>(undefined)
  if (canvas === undefined && ownedCanvasRef.current === undefined) {
    ownedCanvasRef.current = new CanvasKit()
  }
  const instance = canvas ?? ownedCanvasRef.current

  useEffect(() => () => ownedCanvasRef.current?.dispose(), [])

  return <CanvasKitContext.Provider value={instance}>{children}</CanvasKitContext.Provider>
}

export function useCanvasKit(): CanvasKit {
  const canvas = useContext(CanvasKitContext)
  if (!canvas) throw new Error('useCanvasKit must be used within a CanvasKitProvider.')
  return canvas
}
