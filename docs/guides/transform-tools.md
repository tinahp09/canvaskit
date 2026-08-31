# Transform tools

V2.0 adds a central, headless transform workflow for editor selections. Core
owns geometry and immutable scene updates; your application owns DOM events,
toolbar layout, and visual policy. For every exported symbol, read the
[transform API reference](/api/transform-tools).

## Render a selection overlay

Create a `CanvasKit`, track selection through the existing selection
controller, and pass its transform overlay to `CanvasRenderer`.

```ts
const scene = kit.getScene()
const selectedIds = kit.selection.get()
const overlay = kit.transform.getOverlay(scene, selectedIds)
renderer.render(scene, selectedIds, overlay)
```

All overlay values are world-space. Convert a pointer to world space through
`CanvasPointerEvent.world` (or your viewport transform) before calling a
transform operation.

## Resize a drag as one undo step

Map your resize-handle hit test to `TransformHandle`; do not replicate Core
geometry in the application. Repeated updates during a pointer drag should be
one history transaction:

```ts
kit.beginTransaction('resize selection')

// On each pointer move. Shift is one possible application policy for aspect lock.
kit.resizeSelection(handle, event.world, {
  minWidth: 120,
  minHeight: 72,
  preserveAspectRatio: event.modifiers?.shiftKey === true,
})

// On pointer up or capture loss.
kit.commitTransaction()
```

The controller supports a rectangle, circle, text, or multi-node selection.
Minima apply to the selection bounds. Rectangle-only selections may scale
non-uniformly; any selection containing circle or text nodes uses one uniform
scale because their scene data stores a scalar radius or font size.

## Arrange selected nodes

Alignment and distribution work from node bounds and do not alter edge or group
records. They are ordinary `CanvasKit` history commands:

```ts
kit.selection.set(['service', 'worker', 'database'])
kit.alignSelection('middle')
kit.distributeSelection('horizontal')
```

The example app exposes representative align and distribution controls. A
production UI can use its own toolbar, menu, keyboard mapping, or command
palette.

## Persistent rotation

Drag the rotate handle or call `rotateSelection(radians)` for an undoable
rotation. The angle is saved on the node, preserved in scene JSON, and applied
by Canvas and SVG renderers.

## Demonstration and verification

Run the interactive example with:

```sh
pnpm --filter @canvaskit/basic-canvas dev
```

Its V2.0 workflow selects nodes, draws overlay handles, performs a resize
drag, uses Shift-at-pointerdown for aspect lock, invokes alignment/distribution
controls, and reports the deferred persistent-rotation boundary. The browser
coverage in `examples/basic-canvas/e2e/transform.spec.ts` verifies those
interactions, undo/redo, high-zoom handle targeting, and no-console-error
behavior.
