# CanvasKit v3.0.0 — Professional Diagram Editor Runtime

## Highlights

- Scene V7 nested groups with inherited visibility/locking and V6 migration.
- Headless select, pan, rectangle, text, and connector tool runtime.
- Lasso selection, compact group selection, group-aware movement, and keyboard nudge.
- Typed Inspector Runtime for mixed values and atomic multi-node property edits.
- Context-aware command palette entries and unique shortcut dispatch.
- Diagram connection policies plus a glassy professional reference editor.

## Architecture

V3 introduces a renderer-neutral interaction pipeline. Tool and inspector
runtimes emit or apply immutable data; diagram policies validate before the
existing deterministic connector controller mutates the scene. See the
[V3 architecture](/architecture/v3-professional-diagram-runtime).

## Improvements

- Existing groups serialize as Scene V7 safely through V6 migration.
- Group operations, copy/paste, selection, and transforms maintain hierarchy
  invariants.
- The `examples/diagram-editor` workflow is browser-tested.

## Breaking changes

All public packages move to `3.0.0`. Canonical exports now produce Scene V7;
`importScene` accepts prior supported scene versions and migrates V6 groups.

## What’s next

V3.x will focus on deeper diagram node definitions and reference-editor UX;
real-time collaboration remains outside this release.
