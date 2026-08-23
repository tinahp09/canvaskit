import type { Point, Rect } from './types.js'

export function rectContainsPoint(rect: Rect, point: Point): boolean {
  return point.x >= rect.x
    && point.x < rect.x + rect.width
    && point.y >= rect.y
    && point.y < rect.y + rect.height
}
