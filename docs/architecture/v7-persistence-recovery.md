# V7 persistence and recovery architecture

## Problem

Professional editors need documents to survive a recreated host, but V6 only
owned in-memory tabs and clean baselines.

## Challenge

Storage may be a file, IndexedDB, REST service, or cloud API. Core cannot own
credentials, browser APIs, backends, or a product's conflict policy. An async
save also must not make later edits appear persisted.

## Decision

V7 keeps `EditorSession` synchronous and adds `PersistentEditorSession` as an
adapter-driven async layer. A host injects `DocumentStorageAdapter` with
`list`, `load`, and `save`; Core validates serialized scenes and exposes only
frozen session snapshots.

## Architecture

`restore()` reads the adapter list before it replaces the workspace, so a
failed list leaves currently open documents intact. Each saved document enters
through `loadScene` before a CanvasKit instance is created. `saveDocument()`
captures canonical serialization before awaiting the adapter. On completion it
updates V6's clean baseline only if the live serialization is still identical;
otherwise the document remains dirty. Failures keep the scene and surface an
`error` state. Retry captures the current scene again.

## Trade-offs

The wrapper introduces an additional public API rather than making every V6
session asynchronous. That preserves the deterministic V6 boundary and lets
hosts choose their own storage and retry policy. V7 intentionally defers
autosave queues, offline synchronization, merge semantics, and conflict UI;
`revision` is preserved metadata for those later capabilities.
