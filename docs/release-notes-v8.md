# CanvasKit v8.0.0 — Local-first Workspace Recovery

## Highlights

- Added `WorkspaceStorageAdapter` and version-neutral workspace manifests.
- Added `WorkspaceRecoveryController` for explicit save and recovery of open
  document order, active tab, and recent-document metadata.
- Reuses V7 document validation and persistence instead of coupling Core to a
  browser or cloud database.
- Updated the glassy editor-session demo with local workspace save/restore,
  recovery status, and recents.

## Architecture

V8 separates workspace metadata from document persistence. Read the
[workspace recovery architecture](/architecture/v8-workspace-recovery) and
[Workspace Recovery API](/api/workspace-recovery).

## Improvements

- Missing or malformed manifests do not close the in-memory workspace.
- Partial restoration keeps valid documents available and restores the active
  tab only when it was loaded.
- Concurrent recovery operations are deterministically rejected.

## Breaking changes

All public packages move to `8.0.0` together. Scene V7 remains unchanged, so
serialized scenes need no migration.

## What's next

V9 can add host-owned autosave and journal primitives before any cloud sync or
conflict-resolution workflow.
