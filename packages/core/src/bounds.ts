import type { Rect } from '@canvaskit/geometry'
import type { CanvasNode } from './model.js'

export function nodeBounds(node: CanvasNode): Rect {
  if (node.type === 'rectangle') return rotatedBounds({ ...node.position, ...node.size }, node.rotation)
  if (node.type === 'circle') {
    return {
      x: node.position.x - node.radius,
      y: node.position.y - node.radius,
      width: node.radius * 2,
      height: node.radius * 2,
    }
  }
  if (node.type === 'image') return rotatedBounds({ ...node.position, ...node.size }, node.rotation)
  return rotatedBounds({
    x: node.position.x,
    y: node.position.y - node.fontSize,
    width: node.text.length * node.fontSize,
    height: node.fontSize,
  }, node.rotation)
}

function rotatedBounds(bounds: Rect, rotation = 0): Rect {
  if (rotation === 0) return bounds
  const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }
  const cosine = Math.cos(rotation)
  const sine = Math.sin(rotation)
  const corners = [
    { x: bounds.x, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y },
    { x: bounds.x, y: bounds.y + bounds.height },
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
  ].map((point) => ({
    x: center.x + (point.x - center.x) * cosine - (point.y - center.y) * sine,
    y: center.y + (point.x - center.x) * sine + (point.y - center.y) * cosine,
  }))
  const xs = corners.map((point) => point.x)
  const ys = corners.map((point) => point.y)
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y }
}
