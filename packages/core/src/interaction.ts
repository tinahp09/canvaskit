import { rectContainsPoint, type Point, type Rect } from '@canvaskit/geometry'
import type { CanvasNode, CanvasScene } from './model.js'

export function hitTestNode(scene: CanvasScene, point: Point): CanvasNode | undefined {
  return [...scene.nodes].reverse().find((node) => {
    if (node.type === 'rectangle') return rectContainsPoint({ ...node.position, ...node.size }, point)
    if (node.type === 'circle') return Math.hypot(point.x - node.position.x, point.y - node.position.y) <= node.radius
    return point.x >= node.position.x && point.x <= node.position.x + node.text.length * node.fontSize
      && point.y >= node.position.y - node.fontSize && point.y <= node.position.y
  })
}

export function nodesInRect(scene: CanvasScene, rect: Rect): string[] {
  return scene.nodes.filter((node) => {
    const bounds = node.type === 'rectangle'
      ? { ...node.position, ...node.size }
      : node.type === 'circle'
        ? { x: node.position.x - node.radius, y: node.position.y - node.radius, width: node.radius * 2, height: node.radius * 2 }
        : { x: node.position.x, y: node.position.y - node.fontSize, width: node.text.length * node.fontSize, height: node.fontSize }
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
