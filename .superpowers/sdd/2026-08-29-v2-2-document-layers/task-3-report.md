# Task 3 report — Renderer, pointer behavior, and document example

## Delivered

- Added `projectVisibleDocument()` in Core. It produces visible nodes in layer render order and only edges whose endpoints are both visible. `CanvasRenderer` now renders this projection rather than raw scene arrays.
- Made hit-testing use the same layer order, from the final rendered layer toward the back, while retaining indexed queries and excluding locked nodes.
- Added accessible basic-canvas layer controls for choosing, adding, reordering, hiding/showing, locking/unlocking layers; moving the current selection; and grouping/ungrouping. They call public `CanvasKit` APIs.
- Kept pointer connections and movement defensive against noninteractive nodes.
- Added browser coverage using real `page.mouse` interactions for hidden/locked content, history, layer render order (canvas pixel inspection), layer creation/movement, and group/ungroup history.

## TDD evidence

1. The renderer test first failed because raw node order drew the background node before the foreground layer and did not omit hidden layer content. It passed after `projectVisibleDocument()` was consumed by `CanvasRenderer`.
2. The interaction test first failed with `below-node` when layer-order hit testing required `above-node`. It passed after hit testing used the shared interactive render-order projection.
3. The browser layer test first failed because `Hide active layer` did not exist. It passed after the accessible layer controls and pointer hardening were added.

## Compatibility adjustments

- The pre-existing V2-import browser assertion now verifies the specified lossless V2-to-V3 migration, including `layer-default`, rather than incorrectly requiring raw V2 re-export.
- The transform browser assertion now uses `toBeCloseTo(110, 10)` for the calculated height. The layer controls change the canvas' CSS layout, exposing ordinary DOM coordinate floating-point drift (`109.99999999999993`) while the transform behavior remains unchanged.

## Verification

- `node_modules/.bin/tsc -p packages/core/tsconfig.json --noEmit` — passed.
- `node_modules/.bin/tsc -p packages/renderer-canvas/tsconfig.json --noEmit` — passed.
- `node_modules/.bin/vitest run packages/core/test packages/renderer-canvas/test` — 22 files, 165 tests passed.
- `node_modules/.bin/playwright test examples/basic-canvas/e2e --workers=1 --reporter=list` — 23 browser tests passed.
- `git diff --check` for task files — passed.
