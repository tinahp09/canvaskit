import { hitTestNode, nodeBounds, SpatialIndex, type CanvasNode, type CanvasScene } from '../packages/core/dist/index.js'

export const BENCHMARK_NODE_COUNTS = [1_000, 5_000, 10_000] as const

export type BenchmarkNodeCount = typeof BENCHMARK_NODE_COUNTS[number]

const NODE_WIDTH = 48
const NODE_HEIGHT = 32
const COLUMN_GAP = 80
const ROW_GAP = 64
const COLUMNS = 100
const QUERY_COUNT = 200

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

export function linearQuery(nodes: readonly CanvasNode[], rect: { x: number; y: number; width: number; height: number }): CanvasNode[] {
  return nodes.filter((node) => {
    const bounds = nodeBounds(node)
    return bounds.x < rect.x + rect.width && bounds.x + bounds.width > rect.x
      && bounds.y < rect.y + rect.height && bounds.y + bounds.height > rect.y
  })
}

export function runSpatialIndexBenchmark(nodeCount: BenchmarkNodeCount): SpatialIndexBenchmarkResult {
  const scene = createSpatialIndexFixture(nodeCount)
  const index = new SpatialIndex(scene.nodes)
  const queries = createQueries(nodeCount)
  const points = queries.map((query) => ({ x: query.x + NODE_WIDTH / 2, y: query.y + NODE_HEIGHT / 2 }))

  const linearQueryResult = measure(() => queries.reduce((total, query) => total + linearQuery(scene.nodes, query).length, 0))
  const indexedQueryResult = measure(() => queries.reduce((total, query) => total + index.query(query).length, 0))
  const linearHitTestResult = measure(() => points.reduce((total, point) => total + Number(hitTestNode(scene, point) !== undefined), 0))
  const indexedHitTestResult = measure(() => points.reduce((total, point) => total + Number(hitTestNode(scene, point, index) !== undefined), 0))

  return {
    nodeCount,
    query: {
      linearMilliseconds: linearQueryResult.milliseconds,
      indexedMilliseconds: indexedQueryResult.milliseconds,
      matches: indexedQueryResult.value,
    },
    hitTest: {
      linearMilliseconds: linearHitTestResult.milliseconds,
      indexedMilliseconds: indexedHitTestResult.milliseconds,
      matches: indexedHitTestResult.value,
    },
  }
}

export interface SpatialIndexBenchmarkResult {
  nodeCount: BenchmarkNodeCount
  query: { linearMilliseconds: number; indexedMilliseconds: number; matches: number }
  hitTest: { linearMilliseconds: number; indexedMilliseconds: number; matches: number }
}

function createQueries(nodeCount: number): Array<{ x: number; y: number; width: number; height: number }> {
  const rows = Math.ceil(nodeCount / COLUMNS)
  return Array.from({ length: QUERY_COUNT }, (_, index) => ({
    x: ((index * 17) % COLUMNS) * COLUMN_GAP,
    y: ((index * 29) % rows) * ROW_GAP,
    width: COLUMN_GAP * 4,
    height: ROW_GAP * 3,
  }))
}

function measure<T>(work: () => T): { milliseconds: number; value: T } {
  const startedAt = performance.now()
  const value = work()
  return { milliseconds: performance.now() - startedAt, value }
}

if (typeof process !== 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  for (const count of BENCHMARK_NODE_COUNTS) {
    const result = runSpatialIndexBenchmark(count)
    console.log([
      `${result.nodeCount.toLocaleString()} nodes`,
      `query: linear ${result.query.linearMilliseconds.toFixed(2)}ms, index ${result.query.indexedMilliseconds.toFixed(2)}ms`,
      `hit-test: linear ${result.hitTest.linearMilliseconds.toFixed(2)}ms, index ${result.hitTest.indexedMilliseconds.toFixed(2)}ms`,
    ].join(' | '))
  }
}
