# CanvasKit V2.0 Transform Tools Design

## Purpose

Provide a central, headless transform pipeline that lets an editor resize, rotate, align, and constrain selected nodes without every node type owning its own interaction code.

## Scope

- Axis-aligned bounding boxes for single or multiple selected nodes.
- Eight resize handles plus one rotation handle, expressed in world coordinates.
- Immutable scale, rotate, and translate operations for rectangle, circle, and text nodes.
- Min-size constraints and optional aspect-ratio preservation.
- Alignment and distribution commands for multi-selection.
- Canvas overlay rendering and basic-canvas pointer interaction.

## Non-goals

- Nested transforms, skew, arbitrary affine matrices, and per-node custom transform adapters.
- Persistent rotation in the scene schema until the renderer and serializers can support it consistently.
- Smart guides/rulers (V2.4) and group transforms (V2.2).

## Architecture

`TransformController` in Core computes a `TransformSession` from current selection and returns complete immutable scenes. It treats every supported node through `nodeBounds` and a node-type adapter internal to Core. `CanvasKit` wraps completed sessions in one history transaction. Renderer Canvas draws the returned `TransformOverlay` (bounds, handles, rotation stem) but makes no transform decisions.

V2.0 supports persistent resize, translation, min size, aspect lock, alignment, and distribution. Rotation is represented as a preview-only session angle and exposed in overlays/events; persistent rotated node geometry is deferred because CanvasScene node types currently lack a rotation field. This avoids a partial serialization/rendering contract while still providing an API path for V2.2’s transform-capable model.

## Public contracts

```ts
type TransformHandle =
  | 'north-west' | 'north' | 'north-east' | 'east'
  | 'south-east' | 'south' | 'south-west' | 'west' | 'rotate'

interface TransformConstraints {
  minWidth?: number
  minHeight?: number
  preserveAspectRatio?: boolean
}

interface TransformOverlay {
  bounds: Rect
  handles: Readonly<Record<TransformHandle, Point>>
  rotation: number
}

class TransformController {
  getOverlay(scene: CanvasScene, ids: readonly string[]): TransformOverlay | undefined
  resize(scene: CanvasScene, ids: readonly string[], handle: TransformHandle, point: Point, constraints?: TransformConstraints): CanvasScene
  align(scene: CanvasScene, ids: readonly string[], axis: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'): CanvasScene
  distribute(scene: CanvasScene, ids: readonly string[], axis: 'horizontal' | 'vertical'): CanvasScene
}

class CanvasKit {
  transform: TransformController
  resizeSelection(handle: TransformHandle, point: Point, constraints?: TransformConstraints): void
  alignSelection(axis: AlignmentAxis): void
  distributeSelection(axis: DistributionAxis): void
}
```

## Validation

Unit tests cover bounds/handles, resize directions, min-size and aspect constraints, node-type preservation, alignment/distribution, history, and invalid selections. Browser E2E covers selected overlay display, drag-resize, aspect-lock resize, align/distribute controls, undo/redo, and no console errors. Docs identify rotation as preview-only in V2.0 and list its follow-up milestone.
