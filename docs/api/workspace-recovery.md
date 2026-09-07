# Workspace Recovery API

CanvasKit V8 adds a local-first workspace manifest above V7 document
persistence. The host still chooses the durable store; Core never touches
`localStorage`, IndexedDB, the filesystem, or a network service.

```ts
import {
  PersistentEditorSession,
  WorkspaceRecoveryController,
  type WorkspaceStorageAdapter,
} from '@canvaskit/core'

const workspaceStorage: WorkspaceStorageAdapter = {
  load: async () => undefined,
  save: async (workspace) => { /* persist the manifest */ },
}

const recovery = new WorkspaceRecoveryController({ session, storage: workspaceStorage })
await recovery.saveWorkspace()
await recovery.restoreWorkspace()
```

`WorkspaceSnapshot` stores ordered document `{ id, title, updatedAt?, revision? }`
references, `activeDocumentId?`, and `updatedAt`. Document bytes stay in the
V7 `DocumentStorageAdapter`; `restoreWorkspace()` loads each reference through
`PersistentEditorSession`.

`getSnapshot()` and `subscribe()` expose immutable recovery state:
`idle`, `saving`, `restoring`, `ready`, or `error`, plus `recentDocuments`,
optional `lastRestoredAt`, and an error message.

## Recovery rules

- A missing manifest returns `false` without closing current documents.
- A malformed manifest or storage error returns `false` and preserves current
  documents.
- Once a valid manifest is read, it replaces the open workspace in manifest
  order; unavailable documents are skipped.
- Restore returns `true` if at least one referenced document loads. The saved
  active document is activated when it also loaded.
- A competing save or restore returns `false` while an operation is running.

V8 deliberately does not provide autosave, journaling, a concrete storage
adapter, sync queues, cloud replication, revision merge, or conflict UI.
