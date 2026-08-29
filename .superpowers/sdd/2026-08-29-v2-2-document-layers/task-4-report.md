# Task 4 report — V2.2 docs, release evidence, and full verification

## Delivered

- Added a public Document & Layers API reference and integration guide,
  including Scene V3, `CanvasLayer`, `layer-default`, immutable helpers,
  `CanvasKit` commands, visibility/lock behavior, groups, ordering, history,
  custom renderer/input projections, and V2 import behavior.
- Documented the V2→V3 migration and updated the README, Core README, docs home,
  API inventory, and VitePress navigation.
- Added V2.2 release notes, a Problem/Challenge/Decision/Architecture/Trade-offs
  architecture note, and a markdown-only release-media capture manifest.
- Updated `.github/RELEASE_CHECKLIST.md` honestly: feature/docs/demo and
  verification items are complete; binary media, version/changelog work,
  publication, GitHub Release, deployment, and public communication remain
  unchecked or unperformed.
- Corrected the stale V2.0 documentation claim that persistent rotation would
  arrive in V2.2. Scene V3 does not serialize rotation, so it remains
  deliberately preview-only and deferred.

## Verification correction

The first direct full Vitest run found a V2.2 compatibility regression in the
spatial-index benchmark's intentionally flat legacy fixture: its `hitTestNode`
path reached `isNodeInteractive`, which assumed `scene.layers` existed. The
project already documents legacy scenes as renderable by projection helpers.

1. Added a focused failing Core test proving a legacy flat-scene node remains
   interactive for compatibility helpers.
2. Confirmed the red failure (`Cannot read properties of undefined (reading
   'find')`).
3. Added the minimal `isNodeInteractive` fallback: when a scene has no layer
   array, an existing node is interactive.
4. Rebuilt Core before rerunning the benchmark because it intentionally imports
   `packages/core/dist`; focused Core plus benchmark tests then passed.

The V2.2 Core code also raised the measured runtime output to 64,433 B. The
release-quality baseline and budget were updated together to 64,433 B / 68,000
B, preserving 3,567 B of intentional headroom.

## Final verification

The root `pnpm` commands could not run in this environment: the discovered
wrapper attempted to fetch pnpm from the unavailable registry and aborted a
non-interactive modules-directory purge. Equivalent direct local binaries were
used instead.

- `node_modules/.bin/vitest run` — PASS: 30 files, 199 tests.
- `for f in packages/*/tsconfig.json; do node_modules/.bin/tsc -p "$f" --noEmit; done` — PASS.
- Direct dependency-ordered package TypeScript builds — PASS for all 7
  publishable packages.
- `node_modules/.bin/vite build` in every runnable example — PASS: architecture,
  basic-canvas, ERD, performance-canvas, React, Vue, and whiteboard.
- `node_modules/.bin/playwright test examples/basic-canvas/e2e --workers=1 --reporter=list`
  — PASS: 23 tests.
- `node_modules/.bin/vitepress build docs` — PASS.
- `node_modules/.bin/storybook build --config-dir .storybook` and
  `node_modules/.bin/storybook build --config-dir .storybook-vue` — PASS.
- `node --test scripts/release-readiness.test.mjs && node scripts/release-readiness.mjs`
  — PASS: 17 release-readiness tests and stable metadata audit.
- `node --test scripts/package-smoke.test.mjs && node scripts/package-smoke.mjs`
  — PASS: 11 package-smoke tests and all 7 fresh-consumer pack checks.
- `node --test scripts/bundle-size.test.mjs && node scripts/bundle-size.mjs`
  — PASS: 3 bundle-size tests; Core 64,433 B / 68,000 B and every other package
  within budget.
- `node --experimental-strip-types benchmarks/spatial-index.ts` — PASS:
  deterministic query/hit-test equivalence at 1,000, 5,000, and 10,000 nodes.
- `git diff --check` — PASS.

## Release boundary

No binary GIF/screenshots were created because no project release-media
convention exists. No package version bump, tag, push, publication, deployment,
GitHub Release, LinkedIn post, or Dev.to post was performed.

## Final review correction

The final independent review found that `renderSVG` still iterated raw Scene V3
nodes and edges. A focused SVG regression was written first with visible lower
and upper layers, a hidden middle layer, a visible edge, and a hidden-endpoint
edge. It failed because the SVG included `hidden-edge`; the same raw traversal
would also preserve the wrong node order.

`renderSVG` now consumes `projectVisibleDocument(scene)`, including its ordered
nodes and filtered edges, and resolves edge endpoints from that projection. The
focused SVG/Core/Canvas test set passes (5 files, 63 tests). A fresh
dependency-ordered build measured the final published outputs; the release
quality table now records the previously stale Canvas renderer baseline as
8,491 B and the changed SVG renderer baseline as 3,685 B. Both remain within
their existing budgets.

Final correction verification: full Vitest passed 30 files / 200 tests; all
seven package typechecks passed; a fresh dependency-ordered build passed; docs
build passed; bundle-size tests and the final report passed; and basic-canvas
Playwright passed 23 tests with one worker.
