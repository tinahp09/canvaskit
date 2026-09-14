# CanvasKit V10 Opt-in Sync Design

## Goal

Add an opt-in, backend-agnostic synchronization layer that lets an editor retain local-first safety while a host synchronizes documents with its own remote service and explicitly resolves conflicts.

## Problem

V9 protects unsaved work on a single device through durable document storage, autosave, and a recovery journal. It intentionally does not represent queued remote work, remote revisions, network availability, duplicate delivery, or competing edits from another device.

## Scope

V10 ships core synchronization primitives, a deterministic in-memory adapter, and a two-workspace browser demonstration. A developer can attach a backend adapter, queue a local document revision while offline, synchronize it when online, inspect immutable status, and choose what happens when the remote revision conflicts with unsynced local work.

V10 does not ship a backend, credentials, a browser database, background-sync lifecycle hooks, CRDTs, cursor presence, automatic three-way scene merges, encryption, or a provider-specific adapter.

## Approach

### Data model

Each syncable document has a host-owned `SyncDocumentRevision`:

```ts
interface SyncDocumentRevision {
  readonly documentId: string
  readonly revision: string
  readonly updatedAt: string
}
```

Each queued upload is an immutable `SyncOutboxEntry`. It has a globally unique `operationId`, the canonical serialized `StoredDocument`, an optional remote base revision, and `createdAt`. `operationId` enables an adapter/server to deduplicate retries; `baseRevision` enables optimistic concurrency.

The host provides a `SyncQueueStorageAdapter` for durable local outbox and revision metadata. It is separate from the V9 recovery journal: recovery protects dirty work before a durable local save, whereas the outbox protects the already-local document until a remote acknowledgement arrives.

### Backend boundary

`SyncAdapter` is the only remote boundary:

```ts
interface SyncAdapter {
  pull(input: SyncPullRequest): Promise<SyncPullResult>
  push(entry: SyncOutboxEntry): Promise<SyncPushResult>
}
```

`pull` returns either no newer record or one canonical `StoredDocument` with its revision. `push` returns `acknowledged`, `conflict`, or `retryable-error`. The core never reads network state, tokens, endpoints, or provider SDKs. The host calls `SyncController.syncDocument(id)` after it decides connectivity is available.

### Controller lifecycle

`SyncController` receives a V7 `PersistentEditorSession`, `SyncAdapter`, and `SyncQueueStorageAdapter`. Its explicit operations are:

1. `queueDocument(id)` serializes the current persisted session document and atomically saves a new outbox entry. It does not perform network I/O.
2. `syncDocument(id)` pulls remote state, detects a conflict before an upload, then pushes the oldest queued entry. An acknowledgement stores the returned revision and removes only that acknowledged outbox entry.
3. `resolveConflict(id, resolution)` executes one explicit host choice: `accept-remote`, `keep-local`, or `merge-document`.
4. `getSnapshot()` and `subscribe()` expose immutable per-document statuses: `idle`, `queued`, `syncing`, `synced`, `offline`, `conflict`, and `error`.

An adapter exception or retryable result leaves the outbox untouched and sets `error`; the host can retry. `dispose()` unregisters all session listeners and does not delete local queue data.

### Conflict policy

Core never silently overwrites an open document. If remote content is newer than the entry base revision, or a push returns conflict, the controller stores a `SyncConflict` snapshot containing the local queued document and remote document/revision when supplied. It makes no scene change until the host calls `resolveConflict`.

- `accept-remote` replaces the open/persisted document with the validated remote document, records its revision, and removes the conflicting local entry.
- `keep-local` requeues the local document using the remote revision as its new base; the host can call sync again.
- `merge-document` accepts a host-supplied canonical `StoredDocument`, saves it locally, and queues it against the remote revision.

All externally supplied stored documents are validated through existing scene import/migration before they can enter a session.

### Demo and public API

The editor-session example gets a two-workspace in-memory remote service with buttons for offline/online, make edit, sync, remote edit, and resolve conflict. It displays per-workspace status and never represents the in-memory service as a production backend.

`@canvaskit/core` exports sync types, adapters, `SyncController`, and a small `createMemorySyncAdapter` test/demo helper. React and Vue adapters retain their existing peer-facing surface; no framework API is added in V10.

## Error handling and guarantees

- Invalid adapter data and invalid conflict merge documents fail safely without modifying the current session or removing an outbox entry.
- Multiple `syncDocument` calls for one document are serialized; no entry is pushed twice concurrently.
- A later local queue write made while a push is in flight remains queued after the acknowledgement for the earlier entry.
- V9 recovery journal data is neither read nor removed by V10 sync.
- The host owns authentication, online detection, retry scheduling, storage implementation, conflict UI, retention, and user-facing errors.

## Verification

Unit tests cover outbox durability, pull-before-push ordering, acknowledgement removal, retry retention, duplicate operation IDs, per-document serialization, remote validation, all three conflict resolutions, stale local edits, immutable snapshots, and disposal. Browser E2E proves two workspace edits, offline queueing, successful synchronization, visible conflict state, and an explicit resolution. The release follows the repository checklist: typecheck, unit, release, package smoke, E2E, bundle budget, docs build, screenshots/GIF, architecture documentation, changelog, and V10 release notes.

## Trade-offs

Keeping sync explicit means hosts must decide when to invoke it, but avoids hidden network activity, credentials, and provider lock-in. Revision-based conflicts are simpler and safer than premature automatic merging, but they do not offer simultaneous field-level editing; that is intentional future CRDT work.
