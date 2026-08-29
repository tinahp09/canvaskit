# Task 4 report — V2.0 docs and release showcase

## Delivered

- Added the V2.0 Transform Tools API reference and developer guide:
  `docs/api/transform-tools.md` and `docs/guides/transform-tools.md`.
- Added a source-grounded architecture note using the required Problem,
  Challenge, Decision, Architecture, and Trade-offs structure:
  `docs/architecture/v2-transform-tools.md`.
- Added V2.0 candidate release notes and a text-only release asset manifest:
  `docs/release-notes-v2.md` and `docs/release-assets-v2.md`.
- Updated README, documentation navigation, home/Core API pages, release
  checklist, and release-quality budgets for the intentional V2.0 output
  growth.
- Kept persistent rotation documentation honest: V2.0 displays the affordance
  but cannot serialize rotation; `resizeSelection('rotate', point)` throws
  `UnsupportedPersistentRotationError` without scene mutation. Durable
  rotation remains V2.2 work.

## Media decision

No tracked `release-assets` directory or documented safe binary-media pattern
exists in this repository. Per task direction, no GIF or screenshot binary was
created or committed. `docs/release-assets-v2.md` names the exact clean
5–15-second GIF and four screenshots to capture, their workflows, verification
requirements, and the approval-gated storage rule. The release checklist leaves
GIF and screenshot items unchecked.

## Verification

The local `pnpm` wrapper could not run any script because it resolved pnpm
11.19.0 for a repository pinned to pnpm 10.0.0, attempted an online metadata
fetch, then aborted a non-TTY `node_modules` purge. Exact leading errors were
`ERR_PNPM_META_FETCH_FAIL` and
`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`. The approved task fallback was
used: direct binaries already installed in this workspace.

| Gate | Direct fallback | Result |
| --- | --- | --- |
| Unit tests | `./node_modules/.bin/vitest run` | 29 files, 166 tests passed |
| Typecheck | local `tsc -p <package>/tsconfig.json --noEmit` for geometry, Core, plugins, Canvas/SVG renderers, React, and Vue | passed |
| Build | local `tsc` build for all published packages, then local `vite build` for all seven examples | passed |
| Browser E2E | `./node_modules/.bin/playwright test` | 38 passed; local 127.0.0.1 bind was explicitly approved |
| Docs | `./node_modules/.bin/vitepress build docs` | passed |
| Release quality | local package builds, `node --test scripts/bundle-size.test.mjs`, `node scripts/bundle-size.mjs`, `node --experimental-strip-types benchmarks/spatial-index.ts` | passed |

Release-quality baseline update: the Core output measured 50,962 B and Canvas
renderer output measured 8,400 B after V2.0. The explicit budgets are now
55,000 B and 9,300 B respectively, leaving limited rounded headroom; every
other published package remains within its existing budget. Spatial-index
verification completed at 1,000, 5,000, and 10,000 nodes and retained ordered
query/hit-test equivalence as enforced by its tests.

## Checklist and handoff

Only evidence-backed checklist items are marked complete. Version bump,
CHANGELOG, binary media, GitHub Release, deployment, and public-post items are
intentionally unchecked. No package publish, tag, push, release creation,
deployment, or public communication was attempted.
