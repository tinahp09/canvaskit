# V2.0 — Transform Tools

V2.0 is the transform-tools milestone for CanvasKit. This candidate documents
the implemented source changes; package versioning and external publication
remain pending explicit release authorization.

## Highlights

- Headless multi-selection bounds and world-space transform overlays.
- Eight resize handles with minimum dimensions and optional aspect-ratio lock.
- Immutable resize support for rectangles, circles, and text, including stable
  uniform scaling for mixed scalar-size selections.
- History-backed selection resize, alignment, and horizontal/vertical
  distribution commands.
- Canvas overlay rendering plus a runnable basic-canvas workflow and browser
  coverage for resize, aspect lock, arrange commands, undo/redo, and the
  rotation boundary.

## Architecture

V2.0 introduces a centralized `TransformController` in Core. It computes the
selection overlay and immutable scene results; `CanvasKit` wraps completed
commands in history, and the Canvas renderer only draws the supplied overlay.
See the [V2.0 architecture note](/architecture/v2-transform-tools).

## Improvements

- Resize interaction remains one undo entry when applications use a history
  transaction around a pointer drag.
- Circle and text selections keep a coherent overlay through uniform scaling.
- Invalid, empty, or degenerate selections are safe no-ops for non-rotation
  resize commands.

## Persistent rotation

The rotate handle and `rotateSelection` now persist node angles through scene
JSON, immutable history, Canvas, and SVG output.

## Breaking changes

None. V2.0 adds opt-in root exports and does not alter the existing scene JSON
schema.

## What's next

V2.1 editor workflow is already available. V2.2 will expand the document and
layers model, including the transform-capable scene work needed for persistent
rotation.

## Release evidence

Verification commands and their latest candidate results belong in the V2.0
[release asset manifest](/release-assets-v2). The manifest intentionally does
not claim a GIF, screenshots, package publication, deployment, or public post
exists until those artifacts/actions have been explicitly completed.
