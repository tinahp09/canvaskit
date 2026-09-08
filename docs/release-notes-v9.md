# CanvasKit v9.0.0 — Autosave & Recovery Journal

## Highlights

- Added `RecoveryJournalStorageAdapter` and explicit journal restore/discard APIs.
- Added debounced `AutosaveController` with journal-before-save behavior.
- Added immutable per-document autosave states and safe disposal.
- Updated the editor demo with autosave status and recovery actions.

## Architecture

Read the [V9 autosave architecture](/architecture/v9-autosave-recovery) and [Autosave API](/api/autosave-recovery).

## Breaking changes

All public packages move to `9.0.0`; Scene V7 remains unchanged.

## What's next

V10 can introduce opt-in synchronization and host-defined conflict workflows.
