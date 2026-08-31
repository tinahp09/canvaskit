# V2.0 transform tools architecture

## Problem

CanvasKit editors could select and move scene nodes, but lacked a reusable way
to resize or arrange a selection. Putting that logic in each node type or each
renderer would make behavior diverge and force applications to duplicate
pointer-to-geometry code.

## Challenge

Rectangle, circle, and text nodes encode size differently; selections can also
contain more than one node. Transform commands must remain immutable, preserve
node subtype fields and graph/group relations, and integrate with undo/redo.
Persistent rotation must be serializable, history-safe, renderer-consistent,
and selectable through transformed visual geometry.

## Decision

V2.0 centralizes bounds, resize, alignment, distribution, and constraints in
Core's `TransformController`. `CanvasKit` supplies thin selection-aware,
history-backed commands. The Canvas renderer receives an already-computed
`TransformOverlay`; it only draws it and makes no transform decision.

## Architecture

```
selection IDs + scene
        │
        ▼
TransformController ──► immutable CanvasScene
        │                         │
        ├── TransformOverlay ─────┼──► CanvasRenderer (draw only)
        │                         │
        ▼                         ▼
CanvasKit command/history     app subscriptions / undo-redo
```

`TransformController.getOverlay` derives a normalized union rectangle and
world-space positions for eight resize handles plus a rotation handle.
`resize` transforms selected nodes from that source rectangle to a constrained
target rectangle. Rectangle-only selections support non-uniform scale. A
selection containing a circle or text node uses a uniform projection because
their dimensions are scalar. `align` and `distribute` translate selected nodes
by their calculated bounds, retaining their existing edges and groups.

`CanvasKit.resizeSelection`, `alignSelection`, and `distributeSelection` make
those changes history commands. A UI can group pointer-move resize updates in a
single transaction. The basic-canvas app performs pointer hit testing and maps
events to the public Core APIs; that policy remains outside Core and the
renderer.

## Trade-offs

The centralized controller adds an abstraction and intentionally constrains
mixed-node resize to uniform scale. In return, it avoids inconsistent geometry
between node adapters, leaves rendering framework-agnostic, and preserves
immutable/history semantics. Rotation uses the same immutable history path,
is stored with the node, renders in Canvas/SVG/PDF, and has inverse-transform
hit testing. Connector ports intentionally remain axis-aligned in V2.
