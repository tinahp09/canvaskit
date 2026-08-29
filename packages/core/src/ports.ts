import type { Point } from '@canvaskit/geometry'
import { nodeBounds } from './bounds.js'
import type { CanvasNode, NodePort, PortDirection } from './model.js'

/**
 * Produces the built-in attachment ports from a node's current bounds.
 * Ports are derived, so moved and resized nodes never retain stale geometry.
 */
export function deriveNodePorts(node: CanvasNode): NodePort[] {
  const bounds = nodeBounds(node)
  const centerX = bounds.x + bounds.width / 2
  const centerY = bounds.y + bounds.height / 2

  return [
    port('north', { x: centerX, y: bounds.y }),
    port('east', { x: bounds.x + bounds.width, y: centerY }),
    port('south', { x: centerX, y: bounds.y + bounds.height }),
    port('west', { x: bounds.x, y: centerY }),
  ]
}

export function findNodePort(node: CanvasNode, portId: string): NodePort | undefined {
  if (portId === 'center') {
    const bounds = nodeBounds(node)
    return {
      id: 'center',
      direction: 'center',
      position: { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 },
    }
  }
  return deriveNodePorts(node).find((port) => port.id === portId)
}

function port(direction: PortDirection, position: Point): NodePort {
  return { id: direction, direction, position }
}
