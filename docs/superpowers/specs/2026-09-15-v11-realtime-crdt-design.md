# CanvasKit V11 Real-time CRDT Design

## Goal

Add a deterministic, backend-neutral CRDT runtime so concurrently edited CanvasKit scenes converge without last-writer-wins whole-scene replacement.

## Problem

V4 collaboration publishes complete Scene V7 snapshots. V10 synchronizes durable documents but asks the host to resolve revision conflicts. Neither supports two people changing independent nodes at the same time.

## Decision

V11 introduces operation-based, last-writer-wins CRDT registers at individual scene paths. Each operation includes a target document, actor ID, Lamport clock, operation ID, and one mutation: node upsert/remove, edge upsert/remove, connector upsert/remove, group upsert/remove, layer upsert/remove, or scene-property assignment. Tombstones prevent stale recreation after a removal.

## Runtime

`CrdtRuntime` records local mutations and applies remote mutations in any order. A path value wins when its `(clock, actorId, operationId)` tuple is newer. Deleted entity IDs keep tombstones using that same order. Applying the same operation twice is idempotent. Remote operations never enter local history.

`CrdtCollaborationController` converts a before/after Scene V7 diff into granular operations, publishes them through an injected transport, and applies accepted remote operations to `CanvasKit` without creating undo history. Existing `CollaborationRuntime` stays available for V4 snapshot compatibility.

## Presence

Presence remains ephemeral: actor ID, selection, cursor, and metadata are transported separately from CRDT operations. It is never serialized into a document or persisted in a recovery journal/outbox.

## Scope

V11 adds Core contracts/runtime, a two-peer browser demonstration, convergence and out-of-order tests, public API/docs, release media, and a `11.0.0` release candidate. It does not add a server, authentication, a provider SDK, text-character CRDTs, end-to-end encryption, comments, or billing.

## Guarantees

- Applying the same operation any number of times has the same result as applying it once.
- Any peers that receive the same valid operations converge to identical canonical scenes regardless of delivery order.
- A stale operation cannot resurrect a newer removal.
- Invalid remote payloads do not mutate a live scene.
- Local undo remains local; remote changes clear redo but do not create undo entries.

## Trade-offs

Entity-level registers preserve independent node edits and are small enough to expose as a stable public API. They do not merge simultaneous edits to individual rich-text characters; a text CRDT remains a later specialization.
