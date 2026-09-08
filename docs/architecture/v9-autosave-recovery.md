# V9 autosave and recovery journal architecture

## Problem

Explicit V8 saving can lose recent dirty edits after a host restart or failed durable write.

## Challenge

Core must protect unsaved edits without choosing a browser database, backend, identity model, or conflict policy.

## Decision

V9 introduces a host-owned recovery journal plus an `AutosaveController` that journals before durable V7 persistence.

## Architecture

Canvas changes notify the persistent session. Autosave debounces each dirty document, serializes its canonical scene into `RecoveryJournalStorageAdapter`, then invokes `PersistentEditorSession.saveDocument`. A successful clean save removes the journal. `RecoveryJournalController` separately validates and restores or discards entries when the host asks.

## Trade-offs

The extra write costs storage and does not protect against a failing host store, but it keeps recovery local-first and portable. Sync, cross-device conflict resolution, and lifecycle integration remain host responsibilities.
