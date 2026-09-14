# CanvasKit v10.0.0 — Opt-in Sync Workflows

## Highlights

- Added backend-neutral `SyncAdapter` and durable `SyncQueueStorageAdapter` contracts.
- Added explicit local queueing, pull-before-push synchronization, acknowledgements, and duplicate operation protection.
- Added non-destructive conflict states with explicit accept-remote, keep-local, and merge-document decisions.
- Added a browser reference flow for queueing and synchronizing through the deterministic memory adapter.

## Architecture

Read the [V10 opt-in sync architecture](/architecture/v10-opt-in-sync) and [Sync API](/api/opt-in-sync).

## Breaking changes

All public packages move to `10.0.0`; Scene V7 remains unchanged.

## What's next

V11 can add CRDT-backed real-time collaboration or provider-specific adapters without changing the local-first core contract.
