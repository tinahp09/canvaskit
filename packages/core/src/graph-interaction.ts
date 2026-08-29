import type { Point } from '@canvaskit/geometry'
import type { CanvasEdge, CanvasNode, CanvasScene } from './model.js'
import { isNodeInteractive } from './document.js'

export function nodeCenter(node: CanvasNode): Point {
  if (node.type === 'rectangle') return { x: node.position.x + node.size.width / 2, y: node.position.y + node.size.height / 2 }
  if (node.type === 'circle') return node.position
  return { x: node.position.x + node.text.length * node.fontSize / 2, y: node.position.y - node.fontSize / 2 }
}

export function hitTestEdge(scene: CanvasScene, point: Point, tolerance = 8): CanvasEdge | undefined {
  return [...scene.edges].reverse().find((edge) => {
    const source = scene.nodes.find((node) => node.id === edge.sourceId)
    const target = scene.nodes.find((node) => node.id === edge.targetId)
    if (!source || !target || !isNodeInteractive(scene, source.id) || !isNodeInteractive(scene, target.id)) return false
    const a = nodeCenter(source); const b = nodeCenter(target)
    const dx = b.x - a.x; const dy = b.y - a.y
    const lengthSquared = dx * dx + dy * dy
    const ratio = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared))
    return Math.hypot(point.x - (a.x + ratio * dx), point.y - (a.y + ratio * dy)) <= tolerance
  })
}
