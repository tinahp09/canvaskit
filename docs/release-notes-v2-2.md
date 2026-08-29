# V2.2 — Document & layers

V2.2 is the document-management milestone for CanvasKit. This candidate records
implemented source and verified local behavior; package versioning and external
publication remain pending explicit release authorization.

## Highlights

- Scene V3 with ordered `CanvasLayer` records and one `layerId` per node.
- Lossless V1/V2 import migration to visible, unlocked `layer-default`.
- Immutable layer, node-order, visibility, lock, group, and ungroup operations.
- History-backed `CanvasKit` commands for layer creation, selection movement,
  visibility/lock, reordering, grouping, and ungrouping.
- Shared visible-document projection for Canvas paint order and hidden-edge
  filtering; locked content remains visible but cannot be selected or mutated
  by Core interaction paths.
- A layer-aware basic-canvas example and browser coverage for hide/lock,
  reorder, group/ungroup, and undo/redo flows.

## Architecture

Core owns the Scene V3 document schema, migration, immutable operations, and
interaction validity. Renderers consume Core's ordered visible projection rather
than maintaining a parallel layer model. See the [V2.2 architecture note](/architecture/v2-document-layers).

## Improvements

- Layer state, ordering, membership, and group relations are serializable and
  undoable.
- Hidden content cannot participate in visible graph edges or pointer work.
- Layer reordering has a consistent render and hit-test order.

## Breaking changes

Scene export now writes schema version 3. `importScene` remains backward
compatible with V1 and V2 inputs, but consumers that parse exported JSON
directly must support `layers` and node `layerId`; use the documented migration
API rather than assuming a flat V2 node model. There is no package-version bump
or published release in this candidate.

## Persistent rotation boundary

The V2.0 rotation handle remains preview-only. V2.2 adds document layers but
does not serialize a rotation property, so `UnsupportedPersistentRotationError`
continues to protect scenes from a partial persistent rotation mutation.

## What's next

V2.3 Diagram Toolkit: ports, connectors, arrows, labels, and deterministic
routing.

## Release evidence

The [V2.2 release asset manifest](/release-assets-v2-2) records source-backed
and automated evidence. It intentionally does not claim binary media, package
publication, deployment, a GitHub Release, or public posts.
