import type { Point } from '@canvaskit/geometry'

export function snapPointToGrid(point: Point, gridSize: number): Point {
  if (!Number.isFinite(gridSize) || gridSize <= 0) throw new Error('Grid size must be positive.')
  return { x: Math.round(point.x / gridSize) * gridSize, y: Math.round(point.y / gridSize) * gridSize }
}
