import { rectContainsPoint, type Point, type Rect } from '@canvaskit/geometry'
import { nodeBounds } from './bounds.js'
import type { CanvasNode, CanvasScene } from './model.js'
import { SpatialIndex } from './spatial-index.js'
import { groupDescendantNodeIds, interactiveNodesInRenderOrder, isNodeInteractive } from './document.js'

export type MarqueeMode = 'contain' | 'intersect'

export function hitTestNode(scene: CanvasScene, point: Point, index?: SpatialIndex): CanvasNode | undefined {
  const candidates = index?.query({ x: point.x - 0.5, y: point.y - 0.5, width: 1, height: 1 })
  const candidateIds = candidates ? new Set(candidates.map((node) => node.id)) : undefined
  return [...interactiveNodesInRenderOrder(scene)].reverse().find((node) => {
    if (candidateIds && !candidateIds.has(node.id)) return false
    if (!isNodeInteractive(scene, node.id)) return false
    const localPoint = inverseRotatePoint(point, node)
    if (node.type === 'rectangle' || node.type === 'image') return rectContainsPoint({ ...node.position, ...node.size }, localPoint)
    if (node.type === 'circle') return Math.hypot(localPoint.x - node.position.x, localPoint.y - node.position.y) <= node.radius
    return localPoint.x >= node.position.x && localPoint.x <= node.position.x + node.text.length * node.fontSize
      && localPoint.y >= node.position.y - node.fontSize && localPoint.y <= node.position.y
  })
}

function inverseRotatePoint(point: Point, node: CanvasNode): Point {
  if (!node.rotation) return point
  const bounds = nodeBounds({ ...node, rotation: undefined })
  const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }
  const cosine = Math.cos(node.rotation)
  const sine = Math.sin(node.rotation)
  const x = point.x - center.x
  const y = point.y - center.y
  return { x: center.x + x * cosine + y * sine, y: center.y - x * sine + y * cosine }
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

/** Returns interactive nodes with their bounds centre inside a closed lasso polygon. */
export function nodesInLasso(scene: CanvasScene, polygon: readonly Point[]): string[] {
  if (polygon.length < 3) return []
  return scene.nodes.filter((node) => {
    if (!isNodeInteractive(scene, node.id)) return false
    const bounds = nodeBounds(node)
    return pointInPolygon({ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }, polygon)
  }).map((node) => node.id)
}

export function moveNodes(scene: CanvasScene, ids: readonly string[], delta: Point): CanvasScene {
  const nodeIds = new Set(scene.nodes.map((node) => node.id))
  const moving = new Set(ids.flatMap((id) => nodeIds.has(id) ? [id] : scene.groups.some((group) => group.id === id) ? groupDescendantNodeIds(scene, id) : []))
  return {
    ...scene,
    nodes: scene.nodes.map((node) => moving.has(node.id)
      ? { ...node, position: { x: node.position.x + delta.x, y: node.position.y + delta.y } }
      : node),
  }
}

function pointInPolygon(point: Point, polygon: readonly Point[]): boolean {
  let inside = false
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const currentPoint = polygon[index]!
    const previousPoint = polygon[previous]!
    const crosses = (currentPoint.y > point.y) !== (previousPoint.y > point.y)
      && point.x < (previousPoint.x - currentPoint.x) * (point.y - currentPoint.y) / (previousPoint.y - currentPoint.y) + currentPoint.x
    if (crosses) inside = !inside
  }
  return inside
}
