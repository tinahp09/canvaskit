# V2.5 architecture — Rich Content & Assets

## Problem

CanvasKit documents could only contain basic geometric and plain-text nodes.
Editor products need image references that survive save/load and work across
multiple renderers.

## Challenge

Making each node carry source metadata duplicates data and ties Core to file
upload, network, and browser resource policy—concerns that differ per host.

## Decision

Scene V6 adds a centralized, serializable asset registry. `ImageNode` points to
an asset by ID, and `ContentController` enforces reference integrity. Text
nodes gain structural rich-text runs while retaining their plain `text` field.

## Architecture

`CanvasKit` wraps `ContentController` mutations in history. Serialization
validates asset IDs and normalized image crop bounds; V5 documents migrate by
adding an empty registry and derived plain-text run. The SVG renderer resolves
image node IDs through the scene registry. The Canvas renderer shows a
deterministic asset box, leaving fetching and cache ownership to the host.

## Trade-offs

V2.5 deliberately excludes uploads, asset lifecycle services, image decoding,
and per-run rich-text editing. This keeps Core deterministic and portable while
establishing the document model those future host integrations require.
