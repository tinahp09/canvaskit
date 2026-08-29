# V2.0 Task 3 — Renderer overlay and interactive example

## Scope completed

- `CanvasRenderer.render` now accepts an optional Core-derived `TransformOverlay`.
- The renderer draws the overlay after scene nodes and existing connection affordances: a dashed bounds rectangle, all eight resize handles, and a rotation stem/round handle. Every overlay coordinate is mapped through the scene viewport at render time.
- The basic-canvas example obtains its overlay exclusively through `kit.transform.getOverlay(scene, kit.selection.get())`, then passes it to the renderer.
- Dragging an existing selected resize handle invokes `kit.resizeSelection` through a pointer-drag history transaction. Shift state from pointerdown is retained for `preserveAspectRatio`.
- The visible **Align left**, **Align center**, and **Distribute horizontal** controls invoke the public `executeCommand` interface.
- Selecting/dragging the rotation handle leaves the scene untouched and announces: persistent rotation is deferred in V2.0 and the handle is preview-only.
- Existing connection-handle behavior remains intact without masking transform input. When a transform overlay is visible, its connection affordance is rendered and hit-tested 16 viewport pixels to the east of the node anchor; transform handles, including east, take priority.

## TDD evidence

The renderer overlay test was added before its implementation. The initial focused RED run contained one expected failure: `strokeRect` was never called for the supplied overlay.

The browser tests were also added before the example interaction. Their first run failed for the expected missing behavior: resize left the node at the old size, controls did not change positions, and rotation had no deferred-status message. During verification, click helper movement was corrected to avoid an unintended snap-to-grid move on a zero-distance click; the aspect-lock fixture was adjusted so the X axis is the dominant drag scale, matching the documented Core behavior.

The complete existing example suite then exposed a real integration regression: the new east transform handle and existing connection handle occupy the same point. The existing connection test failed because the transform interaction claimed that target. The pointer ordering was corrected and the full suite went green.

## Added coverage

- Renderer test: viewport-space bounds, dash styling, all eight square resize handles, and rotation stem/handle.
- Browser E2E: selected-handle resize, Shift aspect lock, align command with undo/redo, horizontal distribution, deferred rotation without scene mutation, and no browser console/page errors during resize.
- Regression E2E: all pre-existing basic-canvas workflows, including connection, clipboard, marquee, pan/zoom, exports, import errors, and keyboard accessibility.

## Verification

Passed after the final change:

```text
./node_modules/.bin/vitest run --project @canvaskit/renderer-canvas
# 3 files, 16 tests passed

./node_modules/.bin/tsc -p packages/core/tsconfig.json --noEmit
./node_modules/.bin/tsc -p packages/renderer-canvas/tsconfig.json --noEmit
# passed

./node_modules/.bin/vite build examples/basic-canvas
# passed

./node_modules/.bin/playwright test examples/basic-canvas/e2e
# 17 tests passed
```

Playwright required the approved local-network permission to start its local Vite servers. Vitest emitted its pre-existing workspace-file deprecation warning; no test failures or browser console errors remained.

## Review round 1 fixes

- Transform handle hit-testing now maps Core overlay points into viewport space and chooses the nearest handle within an 8-pixel radius. The rendered square and actionable target therefore remain stable under pan and zoom.
- Pointer input captures primary pointers, maps `pointercancel` to an input completion event, and releases capture after completion. Synthetic browser events that use an invalid capture id continue through the event pipeline without disrupting regular pointer input.
- The example owns resize history in a transaction that is completed by the captured pointer-up event, including when the physical pointer is released outside the canvas.
- New real-mouse E2E coverage verifies east-handle resize, release outside the canvas followed by undo, and high-zoom miss/hit behavior. The pre-existing connection E2E now targets the visually separate connection handle.

Verification after review round 1:

```text
./node_modules/.bin/vitest run --project @canvaskit/renderer-canvas
# 3 files, 16 tests passed

./node_modules/.bin/vitest run packages/core/test/pointer-input.test.ts
# 1 file, 6 tests passed

./node_modules/.bin/tsc -p packages/core/tsconfig.json --noEmit
./node_modules/.bin/tsc -p packages/renderer-canvas/tsconfig.json --noEmit
./node_modules/.bin/vite build examples/basic-canvas
# passed

./node_modules/.bin/playwright test examples/basic-canvas/e2e
# 20 tests passed
```
