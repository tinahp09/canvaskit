import type { Point, Size, ViewportTransform } from '@canvaskit/geometry'

export const SCENE_VERSION = 5 as const
export const DEFAULT_LAYER_ID = 'layer-default'

export interface RectangleNode {
  id: string
  layerId: string
  type: 'rectangle'
  position: Point
  size: Size
  fill: string
}
export interface CircleNode { id: string; layerId: string; type: 'circle'; position: Point; radius: number; fill: string }
export interface TextNode { id: string; layerId: string; type: 'text'; position: Point; text: string; fill: string; fontSize: number }
export type CanvasNode = RectangleNode | CircleNode | TextNode
export interface CanvasEdge { id: string; type: 'line' | 'arrow' | 'bezier'; sourceId: string; targetId: string }
export type PortDirection = 'north' | 'east' | 'south' | 'west'
export interface NodePort { id: string; direction: PortDirection | 'center'; position: Point }
export type ConnectorRouting = 'straight' | 'orthogonal'
export interface CanvasConnector {
  id: string
  sourceNodeId: string
  sourcePortId: string
  targetNodeId: string
  targetPortId: string
  routing: ConnectorRouting
  label?: string
}
export interface CanvasGroup { id: string; nodeIds: string[] }
export interface CanvasLayer { id: string; name: string; visible: boolean; locked: boolean }
export type GuideAxis = 'horizontal' | 'vertical'
export interface CanvasGuide { id: string; axis: GuideAxis; position: number }

export interface CanvasScene {
  version: typeof SCENE_VERSION
  nodes: CanvasNode[]
  connectors: CanvasConnector[]
  groups: CanvasGroup[]
  layers: CanvasLayer[]
  guides: CanvasGuide[]
  viewport: ViewportTransform
  metadata: Record<string, unknown>
}

export interface CreateRectangleInput {
  id: string
  layerId?: string
  position: Point
  size: Size
  fill: string
}
export interface CreateCircleInput { id: string; layerId?: string; position: Point; radius: number; fill: string }
export interface CreateTextInput { id: string; layerId?: string; position: Point; text: string; fill: string; fontSize: number }
export interface CreateEdgeInput { id: string; type: CanvasEdge['type']; sourceId: string; targetId: string }
export interface CreateConnectorInput {
  id: string
  sourceNodeId: string
  sourcePortId: string
  targetNodeId: string
  targetPortId: string
  routing?: ConnectorRouting
  label?: string
}
export interface CreateGroupInput { id: string; nodeIds: string[] }
