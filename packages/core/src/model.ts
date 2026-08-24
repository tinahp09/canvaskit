import type { Point, Size, ViewportTransform } from '@canvaskit/geometry'

export interface RectangleNode {
  id: string
  type: 'rectangle'
  position: Point
  size: Size
  fill: string
}
export interface CircleNode { id: string; type: 'circle'; position: Point; radius: number; fill: string }
export interface TextNode { id: string; type: 'text'; position: Point; text: string; fill: string; fontSize: number }
export type CanvasNode = RectangleNode | CircleNode | TextNode

export interface CanvasScene {
  version: 1
  nodes: CanvasNode[]
  viewport: ViewportTransform
  metadata: Record<string, unknown>
}

export interface CreateRectangleInput {
  id: string
  position: Point
  size: Size
  fill: string
}
export interface CreateCircleInput { id: string; position: Point; radius: number; fill: string }
export interface CreateTextInput { id: string; position: Point; text: string; fill: string; fontSize: number }
