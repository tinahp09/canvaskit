import { rectContainsPoint, type Point, type Rect } from '@canvaskit/geometry'
import { nodeBounds } from './bounds.js'
import type { CanvasNode, CanvasScene } from './model.js'
import { SpatialIndex } from './spatial-index.js'
import { interactiveNodesInRenderOrder, isNodeInteractive } from './document.js'

export type MarqueeMode = 'contain' | 'intersect'

export function hitTestNode(scene: CanvasScene, point: Point, index?: SpatialIndex): CanvasNode | undefined {
  const candidates = index?.query({ x: point.x - 0.5, y: point.y - 0.5, width: 1, height: 1 })
  const candidateIds = candidates ? new Set(candidates.map((node) => node.id)) : undefined
  return [...interactiveNodesInRenderOrder(scene)].reverse().find((node) => {
    if (candidateIds && !candidateIds.has(node.id)) return false
    if (!isNodeInteractive(scene, node.id)) return false
    if (node.type === 'rectangle' || node.type === 'image') return rectContainsPoint({ ...node.position, ...node.size }, point)
    if (node.type === 'circle') return Math.hypot(point.x - node.position.x, point.y - node.position.y) <= node.radius
    return point.x >= node.position.x && point.x <= node.position.x + node.text.length * node.fontSize
      && point.y >= node.position.y - node.fontSize && point.y <= node.position.y
  })
}

export function nodesInRect(scene: CanvasScene, rect: Rect, index?: SpatialIndex): string[]
export function nodesInRect(scene: CanvasScene, rect: Rect, mode: MarqueeMode, index?: SpatialIndex): string[]
export function nodesInRect(
  scene: CanvasScene,
  rect: Rect,
  modeOrIndex: MarqueeMode | SpatialIndex = 'contain',
  indexed?: SpatialIndex,
): string[] {
  const mode = typeof modeOrIndex === 'string' ? modeOrIndex : 'contain'
  const index = typeof modeOrIndex === 'string' ? indexed : modeOrIndex
  const candidates = index?.query(rect) ?? scene.nodes
  return candidates.filter((node) => {
    if (!isNodeInteractive(scene, node.id)) return false
    const bounds = nodeBounds(node)
    if (mode === 'contain') {
      return bounds.x >= rect.x && bounds.y >= rect.y
        && bounds.x + bounds.width <= rect.x + rect.width
        && bounds.y + bounds.height <= rect.y + rect.height
    }
    return bounds.x < rect.x + rect.width && bounds.x + bounds.width > rect.x
      && bounds.y < rect.y + rect.height && bounds.y + bounds.height > rect.y
  }).map((node) => node.id)
}

export function moveNodes(scene: CanvasScene, ids: readonly string[], delta: Point): CanvasScene {
  const moving = new Set(ids)
  return {
    ...scene,
    nodes: scene.nodes.map((node) => moving.has(node.id)
      ? { ...node, position: { x: node.position.x + delta.x, y: node.position.y + delta.y } }
      : node),
  }
}
