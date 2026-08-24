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
export interface CanvasEdge { id: string; type: 'line' | 'arrow' | 'bezier'; sourceId: string; targetId: string }
export interface CanvasGroup { id: string; nodeIds: string[] }

export interface CanvasScene {
  version: 1
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  groups: CanvasGroup[]
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
export interface CreateEdgeInput { id: string; type: CanvasEdge['type']; sourceId: string; targetId: string }
export interface CreateGroupInput { id: string; nodeIds: string[] }
