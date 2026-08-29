# Performance at scale

CanvasKit supports large scenes through viewport culling and a deterministic
spatial index. These optimizations preserve the observable ordering and
selection behavior of the scene; they reduce the amount of work needed to find
and draw relevant nodes.

## Viewport culling

`CanvasRenderer` converts the canvas's screen bounds into world coordinates on
each render, then draws only nodes whose bounds intersect that world viewport.
The renderer reports the resulting `visibleNodeCount`, which the performance
example displays. A node that touches the viewport boundary is not considered
visible unless its bounds overlap the viewport by a positive area.

Edges are still considered independently. An edge is drawn when either endpoint
is visible, or when the screen-space bounds of its endpoint-to-endpoint segment
overlap the canvas. This conservative bounds check keeps connections crossing
the current view available even when both nodes are off-screen.

## Spatial index and interaction semantics

`SpatialIndex` is a public, read-only uniform-grid index over a particular
`CanvasNode[]` list. `index.query(rect)` returns every node whose bounds
positively intersect `rect`, in the original scene order. The order guarantee is
important: indexed hit testing still chooses the same topmost node as a linear
scan, and indexed selection produces the same result as an unindexed one.

The index is a snapshot. Create a new `SpatialIndex(scene.nodes)` after using a
new scene or changing node bounds; it does not watch or mutate a scene. Pass an
index explicitly to `hitTestNode(scene, point, index)` or
`nodesInRect(scene, rect, index)` when a caller can reuse the same snapshot for
multiple operations. `CanvasRenderer` builds the index for its current render,
so no additional setup is required for rendering.

## Reproduce the benchmark

The benchmark constructs deterministic rectangle-node scenes at 1,000, 5,000,
and 10,000 nodes. For each size it performs 200 fixed viewport queries and 200
fixed hit tests through both the linear and indexed paths, and throws if their
aggregate match counts differ.

From the repository root, build the workspace and run either command:

```sh
pnpm build
pnpm benchmark:spatial-index

# Equivalent direct invocation
node --experimental-strip-types benchmarks/spatial-index.ts
```

Treat the elapsed times as same-machine comparisons, not a CI threshold:
hardware, Node version, and concurrent activity affect the result. The recorded
baseline and fixture details live in `benchmarks/README.md` at the repository root.
When changing the index algorithm or benchmark workload, rerun it and update
that recorded baseline together with the change.

For the release-quality command that rebuilds packages, checks deterministic
bundle budgets, and then runs this non-flaky benchmark verification, use:

```sh
pnpm verify:release-quality
```

## Explore 10,000 nodes in the browser

The `@canvaskit/performance-canvas` Vite example loads a deterministic
10,000-node scene and exposes loaded, visible, and renderer draw-set counts.
Use the buttons, middle-mouse drag, or wheel zoom to move through the scene and
observe culling change the visible count.

```sh
pnpm --filter @canvaskit/performance-canvas dev
```

For a production-build smoke test, run:

```sh
pnpm --filter @canvaskit/performance-canvas build
```
