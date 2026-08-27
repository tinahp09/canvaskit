import type { CanvasNode, CanvasScene } from '@canvaskit/core'

export const BENCHMARK_NODE_COUNTS = [1_000, 5_000, 10_000] as const

export type BenchmarkNodeCount = typeof BENCHMARK_NODE_COUNTS[number]

const NODE_WIDTH = 48
const NODE_HEIGHT = 32
const COLUMN_GAP = 80
const ROW_GAP = 64
const COLUMNS = 100

export function createSpatialIndexFixture(nodeCount: BenchmarkNodeCount): CanvasScene {
  const nodes: CanvasNode[] = Array.from({ length: nodeCount }, (_, index) => ({
    id: `node-${index}`,
    type: 'rectangle',
    position: { x: (index % COLUMNS) * COLUMN_GAP, y: Math.floor(index / COLUMNS) * ROW_GAP },
    size: { width: NODE_WIDTH, height: NODE_HEIGHT },
    fill: '#6366F1',
  }))

  return {
    version: 2,
    nodes,
    edges: [],
    groups: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    metadata: { fixture: 'spatial-index' },
  }
}
