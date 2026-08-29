# V2.2 architecture — Document & layers

## Problem

Earlier CanvasKit scenes had a flat node list. Applications could draw a
node but had no durable document-level way to order work, hide it, protect it
from editing, or retain user-defined group relationships across persistence.

## Challenge

Layer state affects schema validation, rendering, hit testing, selection,
transforms, history, clipboard cleanup, and existing V1/V2 scene imports. A
renderer-only visibility flag would leave Core commands able to mutate content
users could not see; independent layer ordering in each adapter would produce
inconsistent paint and hit-test results.

## Decision

Make layers and group membership canonical Scene V3 data in Core. Keep document
operations pure and immutable, then expose history-backed `CanvasKit` wrappers.
Use one Core projection for renderer ordering and one additional interaction
predicate for hidden/locked filtering.

## Architecture

`migrateScene` upgrades V2 data to a default `layer-default` layer; canonical
serialization validates that every node names one unique existing layer and
that group and edge references remain valid. `document.ts` owns layer/group
operations plus `projectVisibleDocument`, which emits visible nodes in layer
order and only fully visible edges.

`CanvasKit` turns layer creation, membership, visibility, locking, ordering,
grouping, and ungrouping into one-history-entry commands. It prunes selection
after every document mutation. Renderer and interaction code consume the shared
projection: renderers draw only visible content; hit tests traverse paint order
back-to-front and the interaction predicate excludes locked content. The basic
canvas example stays a thin consumer of these public commands.

## Trade-offs

Groups are durable metadata, not nested transform containers, so V2.2 avoids
ambiguous group coordinate systems and recursive z-order rules. Layers have no
prescribed active-layer UI, rename command, or deletion wrapper in `CanvasKit`;
applications retain product policy while the lower-level immutable operations
remain available. This adds a schema migration and a small Core abstraction,
but prevents renderer-specific document state from diverging from interaction
and persistence behavior.
