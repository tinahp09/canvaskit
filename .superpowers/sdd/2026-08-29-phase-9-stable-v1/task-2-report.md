# Phase 9 Task 2 report: bundle and performance gates

## Outcome

Added deterministic release-quality gates for all seven published CanvasKit
packages and documented a reproducible, non-flaky spatial-index baseline.

- `scripts/bundle-size.mjs` reports every `dist/**/*.js` total in stable package
  order and enforces explicit byte budgets for core, geometry, plugins, React,
  Canvas renderer, SVG renderer, and Vue.
- `scripts/bundle-size.test.mjs` covers deterministic sorted reporting, an
  over-budget package, and a missing built package. The tests were written
  first; the initial run failed with `ERR_MODULE_NOT_FOUND` before the checker
  existed.
- Added `pnpm bundle:size`, `pnpm test:bundle-size`, and the stable local gate
  `pnpm verify:release-quality` (build, gate tests, bundle budgets, benchmark).
- Added the release-quality documentation page and checklist/sidebar links.
- Reran the 1k/5k/10k benchmark and documented a timing baseline, deterministic
  aggregate-match check, and reproduction instructions. Timing remains
  informational so CI does not become hardware-dependent or flaky.

## Baseline

Runtime JavaScript baseline / byte budget:

| Package | Baseline | Budget |
| --- | ---: | ---: |
| `@canvaskit/core` | 29,866 B | 36,000 B |
| `@canvaskit/geometry` | 852 B | 1,100 B |
| `@canvaskit/plugins` | 1,900 B | 2,400 B |
| `@canvaskit/react` | 7,197 B | 8,700 B |
| `@canvaskit/renderer-canvas` | 6,672 B | 8,100 B |
| `@canvaskit/renderer-svg` | 3,567 B | 4,300 B |
| `@canvaskit/vue` | 6,250 B | 7,500 B |

Observed 2026-08-29 benchmark run on Node 22.22.2:

| Nodes | Linear query | Indexed query | Linear hit-test | Indexed hit-test |
| ---: | ---: | ---: | ---: | ---: |
| 1,000 | 8.29 ms | 8.84 ms | 4.61 ms | 8.04 ms |
| 5,000 | 42.04 ms | 40.70 ms | 21.40 ms | 39.18 ms |
| 10,000 | 82.02 ms | 79.78 ms | 42.16 ms | 78.43 ms |

## Verification

- `node --test scripts/bundle-size.test.mjs scripts/release-readiness.test.mjs`:
  14 passing tests.
- Direct TypeScript builds for all seven published package configs, followed by
  `vitest run`: 27 files / 124 tests passed.
- `vitepress build docs`: passed.
- `node scripts/bundle-size.mjs`: all seven generated package outputs remain
  within their budgets.
- `node --experimental-strip-types benchmarks/spatial-index.ts`: ran all three
  workloads and preserved equal linear/indexed aggregate query and hit-test
  results.

The local Codex pnpm wrapper could not complete `pnpm build`: it attempted a
network metadata fetch and then requested non-interactive removal of the
existing modules directory. This is environment-specific; the declared
`pnpm verify:release-quality` remains the clean-install/CI reproduction command.

## Workspace preservation

Pre-existing `.pnpm-store`, `.turbo`, generated output, and untracked plan
files were neither removed nor staged. No push was performed.
