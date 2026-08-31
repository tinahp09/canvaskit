# Persistent Rotation Completion Design

## Goal

Complete the explicit V2 transform requirement by making node rotation an
immutable, serializable, rendered, selectable, undoable transform.

## Model

Scene V6 keeps its compatible version and adds an optional `rotation?: number`
in radians to every node type. New and legacy nodes omit the field until a
rotation is applied, so existing JSON stays unchanged. Canonical parsing rejects
non-finite rotation values. Existing position semantics remain unchanged:
rectangle/image positions are their unrotated top-left, circles use their
centre, and text uses its baseline anchor.

## Transform behavior

`TransformController.rotate(scene, ids, radians)` rotates selected node anchors
around the selection centre and increments each node rotation. A single-node
rotation changes only its rotation. The application adapter derives the pointer
angle for a rotate-handle drag; Core receives the resulting radians. The
operation is immutable and `CanvasKit.rotateSelection` stores it in history.

## Rendering and interaction

Canvas, SVG, and PDF wrap each node in its own local rotation transform around
its visual anchor. Bounds and selection remain conservative axis-aligned bounds
of the rotated shapes. Hit-testing transforms the pointer into the node’s local
space before evaluating shape geometry. Connectors retain their logical port
model for this completion; rotated port geometry is deferred, with clearly
documented compatibility behavior.

## Verification

Unit tests cover compatible serialization validation, single/multi-node rotation,
undo/redo, PDF transform output, and local-space hit tests.
Basic-canvas E2E rotates a selected node, exports Scene JSON, undoes, and
redoes. Release artifacts state the port-geometry limitation explicitly.
