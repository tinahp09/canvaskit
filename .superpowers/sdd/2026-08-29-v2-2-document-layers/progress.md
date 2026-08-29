# SDD ledger — plan: docs/superpowers/plans/2026-08-29-v2-2-document-layers.md

## Pre-flight interface scan

| Tasks | Shared contract | Finding / ruling |
| --- | --- | --- |
| 1 → 2 | `CanvasLayer`, layer/node document operations, Scene V3 | Compatible: Task 1 creates schema/operations; Task 2 exposes CanvasKit wrappers. |
| 1 → 3 | visible layer/node projection | Compatible: Task 3 renders and hit-tests only Core-approved visible/unlocked nodes. |
| 2 → 3 | CanvasKit command APIs | Compatible: example calls public wrappers. |
| 1–4 | migration and public types | Compatible: docs follow finalized model. |

## Rulings

- Schema advances from V2 to V3. The V2→V3 migration creates exactly `layer-default`, assigns every existing node to it, and preserves V2 ordering as layer order.
- One node belongs to one layer. Groups may span layers but group membership itself does not alter z-order.

## Task 1: complete

- Commits: `82b1eaf feat: add document layers`; `51538bb fix: preserve document layer invariants`.
- Review: default-layer and malformed clipboard group invariants were fixed; scoped re-review approved.
- Verification: focused 51 tests, Core 135 tests, workspace 184 tests, Core typecheck, and runtime serialization probes passed.

## Task 2: complete

- Commits: `3b7236e feat: add layer document commands`; `8d9ea63 fix: prune stale selection state`.
- Review: stale hidden/locked selection IDs could resurrect after unlock; central sanitization fix and scoped re-review approved.
- Verification: focused 44 tests, Core 147 tests, Core typecheck and diff-check passed.

## Task 3: complete

- Commit: `34380d4 feat: add layer-aware editor example`.
- Review: approved after checks of ordered visible projection, edge filtering, lock/transform behavior, V2→V3 migration E2E, and exact float tolerance.
- Verification: Core/renderer 165 tests, basic-canvas E2E 23 tests, typechecks and diff check passed.

## Task 4: complete

- Added V2.2 API and integration guides, migration notes, architecture note,
  release notes, release-media manifest, navigation, README entries, and an
  honest candidate checklist.
- No binary GIF/screenshots were created because the repository has no
  documented release-media convention. No package version bump, tag, push,
  publication, deployment, GitHub Release, or public post was performed.
- The release run exposed a legacy flat-scene compatibility regression in
  `isNodeInteractive`; a red regression test and minimal fallback fix restore
  legacy helper behavior. The V2.2 Core bundle baseline is now 64,433 B with a
  68,000 B budget documented in the quality gate.
- Final verification uses direct binaries because the local `pnpm` wrapper
  attempted an unavailable registry fetch/non-TTY modules purge: 30 Vitest
  files / 199 tests, all package typechecks and builds, seven example builds,
  23 browser tests, docs, both Storybook builds, release metadata, package
  smoke, bundle budget, and the spatial-index benchmark passed.

## Final review correction

- SVG export now consumes the shared visible-document projection, so hidden
  nodes and edges are omitted and nodes serialize in layer paint order.
- Red/green regression coverage proves hidden-edge filtering, hidden-node
  omission, and order independent of raw node-array order.
- Fresh dependency-ordered bundle measurement updated only stale exact docs
  baselines: Canvas renderer 8,491 B and SVG renderer 3,685 B; budgets remain
  unchanged and pass.
- Fresh final verification: 30 Vitest files / 200 tests, seven package
  typechecks, dependency-ordered package builds, VitePress docs, bundle-size,
  and 23 basic-canvas browser tests passed.
