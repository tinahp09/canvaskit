import { describe, expect, it } from 'vitest'
import { BENCHMARK_NODE_COUNTS, createSpatialIndexFixture, runSpatialIndexBenchmark } from './spatial-index.js'

describe('createSpatialIndexFixture', () => {
  it('creates exactly 1,000, 5,000, and 10,000 deterministic nodes', () => {
    expect(BENCHMARK_NODE_COUNTS).toEqual([1_000, 5_000, 10_000])

    for (const count of BENCHMARK_NODE_COUNTS) {
      const first = createSpatialIndexFixture(count)
      const second = createSpatialIndexFixture(count)

      expect(first.nodes).toHaveLength(count)
      expect(second.nodes).toEqual(first.nodes)
      expect(first.nodes[0]).toEqual({
        id: 'node-0',
        type: 'rectangle',
        position: { x: 0, y: 0 },
        size: { width: 48, height: 32 },
        fill: '#6366F1',
      })
      expect(first.nodes.at(-1)?.id).toBe(`node-${count - 1}`)
    }
  })
})

it('records equal linear and indexed query and hit-test results', () => {
  const result = runSpatialIndexBenchmark(1_000)

  expect(result.query.linearMatches).toBe(2_128)
  expect(result.query.linearMatches).toBe(result.query.indexedMatches)
  expect(result.hitTest.linearMatches).toBe(200)
  expect(result.hitTest.linearMatches).toBe(result.hitTest.indexedMatches)
})
