# V8 local-first workspace recovery architecture

## Problem

V7 persists individual documents, but a restarted editor still needs to know
which documents were open, in which order, and which tab was active.

## Challenge

That workspace state must be durable without making Core depend on a browser,
filesystem, database, identity provider, or cloud service. A bad manifest must
also never erase a working in-memory editor.

## Decision

V8 adds `WorkspaceStorageAdapter` and `WorkspaceRecoveryController`. It writes
a small host-owned manifest and delegates every document load to V7
`PersistentEditorSession`.

## Architecture

`saveWorkspace()` projects the V7 immutable session snapshot into an ordered
manifest. `restoreWorkspace()` reads and validates that manifest first. Only
then does it close existing documents, load each reference through V7 storage,
and reactivate the persisted active id when available. Its frozen snapshot is
separate from document persistence state, so host UIs can render recovery,
recents, and errors independently.

## Trade-offs

The extra adapter keeps the library portable and local-first, but saving is
explicit and hosts must provide their own durable adapter. V8 also chooses
best-effort partial recovery rather than merge semantics. Autosave journals,
offline synchronization, collaboration reconciliation, and conflicts remain
future host workflows.
