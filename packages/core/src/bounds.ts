import type { Rect } from '@canvaskit/geometry'
import type { CanvasNode } from './model.js'

export function nodeBounds(node: CanvasNode): Rect {
  if (node.type === 'rectangle') return { ...node.position, ...node.size }
  if (node.type === 'circle') {
    return {
      x: node.position.x - node.radius,
      y: node.position.y - node.radius,
      width: node.radius * 2,
      height: node.radius * 2,
    }
  }
  if (node.type === 'image') return { ...node.position, ...node.size }
  return {
    x: node.position.x,
    y: node.position.y - node.fontSize,
    width: node.text.length * node.fontSize,
    height: node.fontSize,
  }
}
