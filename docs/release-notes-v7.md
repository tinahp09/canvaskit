# CanvasKit v7.0.0 — Persistence & Recovery Foundation

## Highlights

- Added injected `DocumentStorageAdapter` contracts for listing, loading, and
  saving canonical CanvasKit documents.
- Added `PersistentEditorSession` with workspace restore, document load,
  async save state, safe retry, and immutable metadata snapshots.
- Added stale-save protection: a completed old save never clears newer edits.
- Updated the glassy editor-session example with restore, save status,
  simulated adapter failure, and retry.

## Architecture

V7 layers asynchronous persistence on top of the storage-free V6 session.
Read the [V7 persistence architecture](/architecture/v7-persistence-recovery)
and [Persistent Editor Session API](/api/persistent-editor-session).

## Improvements

- Adapter-returned `updatedAt` and optional `revision` metadata are available
  to host interfaces.
- Missing or invalid records and adapter errors remain explicit state rather
  than silently discarding an in-memory document.

## Breaking changes

All public packages move to `7.0.0` together. Scene V7 is unchanged and needs
no migration. V7 introduces no built-in storage provider or backend.

## What's next

V8 can build workspace recents, recovery workflows, and host-defined revision
conflict UX on the persistence boundary.
