import type { Point, ViewportTransform } from './types.js'

export function worldToScreen(point: Point, transform: ViewportTransform): Point {
  return {
    x: point.x * transform.zoom + transform.x,
    y: point.y * transform.zoom + transform.y,
  }
}

export function screenToWorld(point: Point, transform: ViewportTransform): Point {
  return {
    x: (point.x - transform.x) / transform.zoom,
    y: (point.y - transform.y) / transform.zoom,
  }
}
