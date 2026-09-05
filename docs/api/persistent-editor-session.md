# Persistent Editor Session API

V7 adds a storage-neutral asynchronous layer to `@canvaskit/core`. It never
selects a database, browser API, backend, authentication mechanism, or retry
policy for an application.

## Storage adapter

```ts
import type { DocumentStorageAdapter, StoredDocument } from '@canvaskit/core'

const storage: DocumentStorageAdapter = {
  list: async () => [],
  load: async (id) => undefined,
  save: async (document) => document,
}
```

`StoredDocument.scene` is a canonical serialized CanvasKit scene. The adapter
owns where records live; CanvasKit validates every loaded scene before opening
it. `updatedAt` is host metadata, and optional `revision` is retained for a
future host-defined conflict policy.

## `PersistentEditorSession`

```ts
import { PersistentEditorSession } from '@canvaskit/core'

const session = new PersistentEditorSession({ storage })
await session.restore()
await session.saveDocument()
```

- `restore()` replaces the open workspace with adapter records in adapter
  order, activates the first document, and returns `false` if listing fails.
- `loadDocument(id)` loads one record and returns `false` for a missing or
  invalid record.
- `saveDocument(id?)` captures the active or named scene, persists it, and
  returns `false` for a missing/already-saving document or a storage failure.
- `retrySave(id?)` is an explicit fresh save of the latest scene; it never
  replays stale serialized data.
- `getSnapshot()` and `subscribe()` expose immutable document state. Each
  document includes V6 `id`, `title`, and `isDirty`, plus `persistence`,
  optional `updatedAt`, `revision`, and `error`. The session adds
  `isRestoring`.
- `getDocument`, `getActiveDocument`, `activateDocument`, `openDocument`,
  `commands`, and `dispose` remain available for host UI integration.

When a save completes, CanvasKit marks its captured scene clean only when the
live scene still exactly matches it. A user edit made during an async write
therefore remains dirty and cannot be lost visually.

## Scope

V7 does not provide autosave, localStorage/IndexedDB/filesystem adapters,
network clients, authentication, offline queues, revision merging, CRDTs, or
conflict resolution. Those vary by host and attach to this adapter boundary.
