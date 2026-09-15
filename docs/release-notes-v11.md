# CanvasKit v11.0.0 — Real-time CRDT Foundation

## Highlights

- Added `CrdtRuntime`, `CrdtOperation`, `CrdtTransport`, and incoming-operation validation.
- Added deterministic Lamport ordering, duplicate rejection, stale-operation rejection, and node tombstones.
- Added optional `CanvasKit` CRDT configuration and injected transport lifecycle.
- Added a two-peer browser reference demo proving concurrent node edits, reconnect replay, and out-of-order convergence.
- Preserved local undo history across remote edits and synchronizes local undo/redo as inverse node operations.

## Architecture

Read the [V11 real-time CRDT architecture](/architecture/v11-realtime-crdt) and [real-time CRDT API](/api/realtime-crdt).

## Breaking changes

All public packages move to `11.0.0`. Scene V7 remains unchanged.

## What's next

The next collaboration increment can extend the stable operation contract to
dependent graph entities, richer presence, and provider adapters without
bundling a backend into Core.
