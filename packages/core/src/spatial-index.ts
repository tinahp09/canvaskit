import type { Rect } from '@canvaskit/geometry'
import { nodeBounds } from './bounds.js'
import type { CanvasNode } from './model.js'

const CELL_SIZE = 100

export class SpatialIndex<T extends CanvasNode = CanvasNode> {
  private readonly buckets = new Map<string, T[]>()

  constructor(private readonly nodes: readonly T[]) {
    for (const node of nodes) {
      this.forEachCell(nodeBounds(node), (key) => {
        const bucket = this.buckets.get(key)
        if (bucket) bucket.push(node)
        else this.buckets.set(key, [node])
      })
    }
  }

  query(rect: Rect): T[] {
    const candidates = new Set<T>()
    this.forEachCell(rect, (key) => {
      for (const node of this.buckets.get(key) ?? []) candidates.add(node)
    })
    return this.nodes.filter((node) => rectsIntersect(nodeBounds(node), rect) && candidates.has(node))
  }

  private forEachCell(rect: Rect, visit: (key: string) => void): void {
    if (rect.width <= 0 || rect.height <= 0) return
    const firstColumn = Math.floor(rect.x / CELL_SIZE)
    const lastColumn = Math.ceil((rect.x + rect.width) / CELL_SIZE) - 1
    const firstRow = Math.floor(rect.y / CELL_SIZE)
    const lastRow = Math.ceil((rect.y + rect.height) / CELL_SIZE) - 1
    for (let column = firstColumn; column <= lastColumn; column++) {
      for (let row = firstRow; row <= lastRow; row++) visit(`${column}:${row}`)
    }
  }
}

function rectsIntersect(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x
    && a.y < b.y + b.height && a.y + a.height > b.y
}
