# V2.3 — Diagram toolkit

V2.3 is the CanvasKit diagramming milestone. This candidate records verified
local behavior; package versioning and external publication remain pending
explicit release authorization.

## Highlights

- Scene V4 connectors with derived north/east/south/west node ports.
- Deterministic straight and obstacle-aware orthogonal routing with labels and
  directional arrowheads.
- V1–V3 graph migration to canonical V4 connectors.
- History-backed create, reconnect, select, delete, undo, and redo operations.
- Layer-aware visibility and locking rules for relations.
- Canvas/SVG renderer parity, plus pointer and accessible keyboard workflows
  in the basic-canvas demo.

## Architecture

`ConnectorController` centralizes endpoint validation and lazy route
calculation, keeping it separate from node rendering and editor UI. See the
[V2.3 architecture note](/architecture/v2-diagram-toolkit).

## Improvements

- Overlapping ports select the visually frontmost layer node.
- `pointercancel` aborts create/reconnect operations without document or
  history mutation.
- Canvas selection color and arrow fill are deterministic; SVG exports match
  selected route, marker, label alignment, and interactive-port state.

## Breaking changes

Scene export now writes schema version 4. `importScene` remains compatible with
V1–V3 inputs, but consumers parsing exported JSON directly must support
`connectors` instead of legacy `edges`. There is no package version bump or
published release in this candidate.

## What's next

V2.4 Smart layout: alignment-aware diagram layout, distribution, and
constraint-driven placement built on the V2.3 graph contract.

## Release evidence

The [V2.3 release asset manifest](/release-assets-v2-3) records source-backed
and automated evidence. It does not claim binary media, package publication,
deployment, a GitHub Release, or public posts.
