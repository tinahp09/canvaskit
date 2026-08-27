# Phase 7 Performance at Scale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Release `0.7.0` with viewport culling, benchmark-selected spatial indexing, optimized hit testing, dirty render batching, and a validated 10,000-node example.

**Architecture:** Core owns deterministic node bounds, a public spatial query index, and indexed hit testing. Canvas renderer derives a world viewport, renders only visible nodes/connected edges, and schedules multiple scene invalidations into one animation frame. Benchmarks compare a linear scan and uniform-grid index; the faster deterministic option for the 10,000-node workload becomes the implementation.

**Tech Stack:** TypeScript strict mode, Vitest, Canvas 2D, Vite, Playwright, Changesets.

**Spec:** `docs/superpowers/specs/2026-08-23-canvaskit-v1-roadmap-design.md`, `docs/prd.md`

## Global Constraints

- Core remains framework- and renderer-agnostic.
- Spatial queries and hit-testing preserve current topmost-node semantics.
- Culling must not hide selected or edge-connected visible content incorrectly.
- Renderer uses public Core geometry only and draws no off-screen nodes.
- Benchmark inputs are deterministic and cover 1,000, 5,000, and 10,000 nodes.
- The release includes a runnable 10,000-node example, tests, docs, and a minor changeset.

### Task 1: Bounds and spatial index

**Status:** Complete — `823c194`

**Files:** Create `packages/core/src/{bounds,spatial-index}.ts`; modify `packages/core/src/index.ts`; test `packages/core/test/spatial-index.test.ts`.

- [ ] Write failing tests for rectangle/circle/text bounds, `SpatialIndex.query(rect)`, and deterministic topmost candidate order.
- [ ] Run `./node_modules/.bin/vitest run packages/core/test/spatial-index.test.ts` and observe missing exports.
- [ ] Implement `nodeBounds(node): Rect` and `SpatialIndex(nodes)` with a uniform world-grid bucket map; `query(rect)` returns each intersecting node once in original scene order.
- [ ] Run focused tests and Core typecheck.
- [ ] Commit `feat: add deterministic spatial index`.

### Task 2: Indexed interaction and viewport culling

**Status:** Complete — `b65f048`, `4a12310`

**Files:** Modify `packages/core/src/interaction.ts`; modify `packages/renderer-canvas/src/canvas-renderer.ts`; test `packages/core/test/interaction.test.ts`, `packages/renderer-canvas/test/canvas-renderer.test.ts`.

- [ ] Add failing tests proving indexed hit tests return the same topmost node as the prior linear scan and renderer omits off-screen node draw calls.
- [ ] Run focused Core and renderer tests; observe missing index/culling integration.
- [ ] Add optional `SpatialIndex` arguments to `hitTestNode` and `nodesInRect`; calculate a world viewport from Canvas dimensions and scene viewport, query visible nodes, and render only visible edges whose endpoint is visible.
- [ ] Run focused suites and package typechecks.
- [ ] Commit `feat: cull canvas rendering with spatial queries`.

### Task 3: Dirty-frame batching

**Status:** Complete — `90e5a45`, `aabad6c`

**Files:** Create `packages/renderer-canvas/src/render-scheduler.ts`; modify React/Vue canvas hosts; test scheduler and adapter tests.

- [ ] Write a failing scheduler test that three invalidations before an animation frame render once with the latest scene.
- [ ] Run focused test and observe the missing scheduler.
- [ ] Implement `RenderScheduler.schedule(render)` using `requestAnimationFrame`, with a synchronous fallback when unavailable and a cancelable `dispose()`.
- [ ] Update framework hosts to schedule subscription redraws and cancel pending frames on cleanup.
- [ ] Run focused tests/typechecks.
- [ ] Commit `feat: batch dirty canvas renders`.

### Task 4: Benchmarks and large-scene example

**Status:** Complete — `08e8e4f`, `d5ff370`

**Files:** Create `benchmarks/{spatial-index,README}.ts`; create `examples/performance-canvas`; modify Playwright config; test benchmark fixture generation and E2E.

- [ ] Write failing deterministic fixture test for exact counts at 1,000/5,000/10,000 nodes.
- [ ] Implement benchmark commands comparing index query/hit-test to linear scan and record results in `benchmarks/README.md`.
- [ ] Build a performance example that loads 10,000 nodes, exposes visible-node count and pan/zoom controls, and uses CanvasRenderer culling.
- [ ] Run Vite build and E2E asserting 10,000-node load and responsive visible count.
- [ ] Commit `feat: add large-scene performance example`.

### Task 5: Documentation, release, and full validation

**Status:** Complete — `242b951`, `e03e425`

**Files:** Modify `README.md`, `docs/getting-started.md`; create `docs/performance.md`, `.changeset/phase-seven.md`.

- [ ] Document culling/index semantics, benchmark reproduction, and performance example.
- [ ] Add minor changeset for Core and Canvas renderer.
- [ ] Run all package typechecks, Vitest, Vite builds, and Playwright.
- [ ] Commit `docs: release performance at scale`.
