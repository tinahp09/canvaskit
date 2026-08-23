import type { Point, Size, ViewportTransform } from '@canvaskit/geometry'

export interface RectangleNode {
  id: string
  type: 'rectangle'
  position: Point
  size: Size
  fill: string
}

export interface CanvasScene {
  version: 1
  nodes: RectangleNode[]
  viewport: ViewportTransform
  metadata: Record<string, unknown>
}

export interface CreateRectangleInput {
  id: string
  position: Point
  size: Size
  fill: string
}
