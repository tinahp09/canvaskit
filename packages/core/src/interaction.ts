import { rectContainsPoint, type Point, type Rect } from '@canvaskit/geometry'
import { nodeBounds } from './bounds.js'
import type { CanvasNode, CanvasScene } from './model.js'
import { SpatialIndex } from './spatial-index.js'

export function hitTestNode(scene: CanvasScene, point: Point, index?: SpatialIndex): CanvasNode | undefined {
  const candidates = index?.query({ x: point.x - 0.5, y: point.y - 0.5, width: 1, height: 1 }) ?? scene.nodes
  return [...candidates].reverse().find((node) => {
    if (node.type === 'rectangle') return rectContainsPoint({ ...node.position, ...node.size }, point)
    if (node.type === 'circle') return Math.hypot(point.x - node.position.x, point.y - node.position.y) <= node.radius
    return point.x >= node.position.x && point.x <= node.position.x + node.text.length * node.fontSize
      && point.y >= node.position.y - node.fontSize && point.y <= node.position.y
  })
}

export function nodesInRect(scene: CanvasScene, rect: Rect, index?: SpatialIndex): string[] {
  const candidates = index?.query(rect) ?? scene.nodes
  return candidates.filter((node) => {
    const bounds = nodeBounds(node)
    return bounds.x >= rect.x && bounds.y >= rect.y && bounds.x + bounds.width <= rect.x + rect.width && bounds.y + bounds.height <= rect.y + rect.height
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
