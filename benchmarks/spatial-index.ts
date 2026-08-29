import { hitTestNode, nodeBounds, SpatialIndex, type CanvasNode } from '../packages/core/dist/index.js'
import { BENCHMARK_NODE_COUNTS, createSpatialIndexFixture, type BenchmarkNodeCount } from './spatial-index-fixture.ts'

export { BENCHMARK_NODE_COUNTS, createSpatialIndexFixture, type BenchmarkNodeCount } from './spatial-index-fixture.ts'

const NODE_WIDTH = 48
const NODE_HEIGHT = 32
const COLUMN_GAP = 80
const ROW_GAP = 64
const QUERY_COUNT = 200
const COLUMNS = 100

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

  const linearQueryResult = measure(() => queries.map((query) => linearQuery(scene.nodes, query)))
  const indexedQueryResult = measure(() => queries.map((query) => index.query(query)))
  const linearHitTestResult = measure(() => points.map((point) => hitTestNode(scene, point)))
  const indexedHitTestResult = measure(() => points.map((point) => hitTestNode(scene, point, index)))

  const linearQueryIds = linearQueryResult.value.map((nodes) => nodes.map((node) => node.id))
  const indexedQueryIds = indexedQueryResult.value.map((nodes) => nodes.map((node) => node.id))
  const linearHitIds = linearHitTestResult.value.map((node) => node?.id)
  const indexedHitIds = indexedHitTestResult.value.map((node) => node?.id)

  assertQueryIdsEquivalent(linearQueryIds, indexedQueryIds)
  assertHitIdsEquivalent(linearHitIds, indexedHitIds)

  const linearQueryMatches = linearQueryIds.reduce((total, ids) => total + ids.length, 0)
  const indexedQueryMatches = indexedQueryIds.reduce((total, ids) => total + ids.length, 0)
  const linearHitMatches = linearHitIds.reduce((total, id) => total + Number(id !== undefined), 0)
  const indexedHitMatches = indexedHitIds.reduce((total, id) => total + Number(id !== undefined), 0)

  return {
    nodeCount,
    query: {
      linearMilliseconds: linearQueryResult.milliseconds,
      indexedMilliseconds: indexedQueryResult.milliseconds,
      linearMatches: linearQueryMatches,
      indexedMatches: indexedQueryMatches,
    },
    hitTest: {
      linearMilliseconds: linearHitTestResult.milliseconds,
      indexedMilliseconds: indexedHitTestResult.milliseconds,
      linearMatches: linearHitMatches,
      indexedMatches: indexedHitMatches,
    },
  }
}

export interface SpatialIndexBenchmarkResult {
  nodeCount: BenchmarkNodeCount
  query: { linearMilliseconds: number; indexedMilliseconds: number; linearMatches: number; indexedMatches: number }
  hitTest: { linearMilliseconds: number; indexedMilliseconds: number; linearMatches: number; indexedMatches: number }
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

export function assertQueryIdsEquivalent(
  linearResults: readonly (readonly string[])[],
  indexedResults: readonly (readonly string[])[],
): void {
  if (linearResults.length !== indexedResults.length) {
    throw new Error(`query benchmark batch mismatch: linear ${linearResults.length}, indexed ${indexedResults.length}.`)
  }

  for (const [index, linearIds] of linearResults.entries()) {
    const indexedIds = indexedResults[index]!
    if (linearIds.length !== indexedIds.length || linearIds.some((id, idIndex) => id !== indexedIds[idIndex])) {
      throw new Error(`query ${index} benchmark IDs mismatch: linear ${linearIds.join(',')}, indexed ${indexedIds.join(',')}.`)
    }
  }
}

export function assertHitIdsEquivalent(
  linearResults: readonly (string | undefined)[],
  indexedResults: readonly (string | undefined)[],
): void {
  if (linearResults.length !== indexedResults.length) {
    throw new Error(`hit-test benchmark batch mismatch: linear ${linearResults.length}, indexed ${indexedResults.length}.`)
  }

  for (const [index, linearId] of linearResults.entries()) {
    const indexedId = indexedResults[index]
    if (linearId !== indexedId) {
      throw new Error(`hit-test ${index} benchmark ID mismatch: linear ${linearId ?? 'none'}, indexed ${indexedId ?? 'none'}.`)
    }
  }
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
