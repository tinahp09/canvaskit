# V11 real-time CRDT architecture

## Problem

Snapshot synchronization makes two independent object edits compete as whole
documents, even when the edits do not overlap.

## Challenge

CanvasKit needs deterministic convergence without choosing a backend,
credentials model, transport provider, or persistence system for its host.

## Decision

V11 introduces a public `CrdtRuntime` and `CrdtTransport` boundary. The first
stable operation family is node upsert/remove. Every operation carries a
Lamport clock and stable actor/operation identity; a per-node register chooses
the newest tuple and retains removal tombstones.

## Architecture

`CanvasKit.execute`, `undo`, and `redo` compute one-node before/after changes
and publish a `CrdtOperation` through a host-injected transport. Incoming
operations are validated, deduplicated, ordered, and applied without inserting
history entries. Remote edits clear redo, while a local inverse action stays in
local history and is sent as its own CRDT operation.

The existing V4 `CollaborationRuntime` remains unchanged for hosts that prefer
whole-scene snapshots and ephemeral presence.

## Trade-offs

Node registers deliver a small, inspectable, provider-neutral core and make
independent canvas objects converge immediately. They do not merge character
edits or model dependent graph entities yet. A later release can add those
entity families above the proven operation and transport contract.
