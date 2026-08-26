import { useEffect, useState } from 'react'
import type { CanvasScene } from '@canvaskit/core'
import { useCanvasKit } from './canvas-kit.js'

export function useCanvasScene(): CanvasScene {
  const canvas = useCanvasKit()
  const [scene, setScene] = useState<CanvasScene>(() => canvas.getScene())

  useEffect(() => {
    setScene(canvas.getScene())
    return canvas.subscribe(setScene)
  }, [canvas])

  return scene
}
