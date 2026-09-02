# V4 collaboration runtime architecture

## Problem

CanvasKit editors needed a reliable way to synchronize scene mutations between
clients, without making every renderer, framework adapter, or host application
choose the same network stack.

## Challenge

Directly embedding WebSockets, authentication, persistence, or a CRDT in Core
would make a headless drawing runtime own infrastructure it cannot safely
configure. A remote edit must also update the scene without becoming a local
undo step, while malformed and replayed messages must never corrupt state.

## Decision

V4 adds a transport-agnostic `CollaborationRuntime` and a small CanvasKit
bridge. It records immutable full-scene snapshots in serializable operations.
The host owns identity, storage, authorization, and a `CollaborationTransport`.

## Architecture

```text
local editor change
  → CanvasKit history mutation
  → CollaborationRuntime.recordLocal(scene)
  → host CollaborationTransport.publish(operation)

remote transport message
  → CollaborationRuntime.applyRemote(operation, currentScene)
  → accepted Scene V7 snapshot
  → CanvasKit applies scene, clears redo, notifies subscribers
```

Each operation has an ID, actor ID, Lamport clock, target, kind, and canonical
Scene V7 snapshot. For each target, the runtime accepts only the greatest
`(clock, actorId, id)` tuple. Seen IDs are ignored; lower tuples are stale.
`PresenceSnapshot` values are separate ephemeral state, never serialized into
the scene document.

## Trade-offs

Whole-scene snapshots are larger than patches, but make replay, inspection, and
persistence deterministic as the scene API evolves. Last-writer-wins is simpler
than a CRDT and intentionally defers per-character rich-text merging and
fine-grained concurrent editing. Injected transport keeps Core dependency-free,
but the host must implement connection lifecycle and durable delivery.
