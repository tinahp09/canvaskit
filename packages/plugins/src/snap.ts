import { snapPointToGrid, type CanvasPlugin } from '@canvaskit/core'

type Point = Parameters<typeof snapPointToGrid>[0]

export interface SnapPluginOptions {
  gridSize?: number
}

export interface SnapPlugin extends CanvasPlugin {
  readonly config: Readonly<Required<SnapPluginOptions>>
  snap(point: Point): Point
}

export function createSnapPlugin(options: SnapPluginOptions = {}): SnapPlugin {
  const config = Object.freeze({ gridSize: options.gridSize ?? 20 })
  snapPointToGrid({ x: 0, y: 0 }, config.gridSize)

  return {
    id: 'snap',
    config,
    install: () => undefined,
    snap: (point) => snapPointToGrid(point, config.gridSize),
  }
}
