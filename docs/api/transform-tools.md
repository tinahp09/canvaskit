# Transform tools API

V2.0 exposes the transform API from `@canvaskit/core`. It is headless: Core
computes immutable scene values and the renderer consumes an optional overlay.
Use the [transform tools guide](/guides/transform-tools) for interaction
examples.

```ts
import {
  CanvasKit,
  TransformController,
  UnsupportedPersistentRotationError,
  type AlignmentAxis,
  type DistributionAxis,
  type TransformConstraints,
  type TransformHandle,
} from '@canvaskit/core'
```

## Handles and overlay

`TransformHandle` is one of:

```ts
type TransformHandle =
  | 'north-west' | 'north' | 'north-east' | 'east'
  | 'south-east' | 'south' | 'south-west' | 'west'
  | 'rotate'
```

`kit.transform.getOverlay(scene, ids)` returns `undefined` for an empty or
invalid selection. Otherwise it returns the normalized, world-space union
bounds and all eight resize handles plus the rotation handle:

```ts
interface TransformOverlay {
  bounds: Rect
  handles: Readonly<Record<TransformHandle, Point>>
  rotation: number // always 0 in V2.0
}
```

The Canvas renderer accepts this as its third argument:

```ts
renderer.render(scene, kit.selection.get(),
  kit.transform.getOverlay(scene, kit.selection.get()))
```

Its dashed box, square resize handles, and rotation stem are display-only. A
consumer owns hit testing and pointer policy; the basic-canvas example provides
one such adapter.

## Resize and constraints

`TransformConstraints` limits the selection bounds:

```ts
interface TransformConstraints {
  minWidth?: number
  minHeight?: number
  preserveAspectRatio?: boolean
}
```

`TransformController.resize(scene, ids, handle, point, constraints?)` returns a
new scene without mutating `scene`. Rectangles scale freely. Circle and text
nodes have scalar dimensions, so a selection containing either is projected to
a uniform scale; this keeps the node geometry and selection overlay consistent.

For the current selection, use the history-backed `CanvasKit` convenience API:

```ts
kit.selection.set(['card-a', 'card-b'])
kit.resizeSelection('south-east', { x: 640, y: 420 }, {
  minWidth: 160,
  minHeight: 96,
  preserveAspectRatio: true,
})
```

It returns `true` only when the scene changes and records one undoable command.
For pointer drags, bracket repeated calls with `beginTransaction` and
`commitTransaction` to collapse the drag into one undo step.

## Alignment and distribution

`AlignmentAxis` is `'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'`.
`DistributionAxis` is `'horizontal' | 'vertical'`.

```ts
kit.alignSelection('center')
kit.distributeSelection('horizontal')
```

Both commands require at least two selected nodes, preserve graph and group
relations, return whether they changed the scene, and are undoable. The
lower-level `TransformController.align(scene, ids, axis)` and
`TransformController.distribute(scene, ids, axis)` return immutable scenes for
custom command/history layers.

## Persistent rotation

Nodes may carry an optional `rotation` angle in radians. Use
`kit.rotateSelection(radians)` or `kit.resizeSelection('rotate', point)`;
both are immutable, history-backed operations. The basic-canvas rotate handle
uses a drag transaction and serializes the resulting angle.
