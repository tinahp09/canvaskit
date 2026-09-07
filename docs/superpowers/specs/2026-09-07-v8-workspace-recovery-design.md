# V8 workspace recovery and recents design

## Problem

V7 persists individual documents, but a host still has to recreate the
workspace manually: which documents were open, their order, and the active
document are lost between host lifecycles.

## Decision

V8 adds an injected `WorkspaceStorageAdapter` and a
`WorkspaceRecoveryController`. They persist a small workspace manifest beside
V7 document storage. Core remains local-storage-, IndexedDB-, filesystem-,
network-, backend-, auth-, and CRDT-agnostic.

## Public contracts

```ts
export interface WorkspaceDocumentReference {
  readonly id: string
  readonly title: string
  readonly updatedAt?: string
  readonly revision?: string
}

export interface WorkspaceSnapshot {
  readonly documents: readonly WorkspaceDocumentReference[]
  readonly activeDocumentId?: string
  readonly updatedAt: string
}

export interface WorkspaceStorageAdapter {
  load(): Promise<WorkspaceSnapshot | undefined>
  save(workspace: WorkspaceSnapshot): Promise<void>
}
```

`WorkspaceRecoveryController` accepts a V7 `PersistentEditorSession` and an
adapter. `saveWorkspace()` captures open-document order and active id from the
session. `restoreWorkspace()` loads the manifest then loads listed documents
one by one through the V7 document adapter. A missing, invalid, or failed
document load is omitted; a valid active id is restored after all loads.

## Snapshot model

The controller exposes frozen `WorkspaceRecoverySnapshot` with `status`
(`idle`, `saving`, `restoring`, `ready`, or `error`), frozen `recentDocuments`,
optional `lastRestoredAt`, and optional safe `error`. Recents are de-duplicated
by id, sorted newest-first from manifest order, and have no browser-specific
storage policy.

## Error policy

- Missing manifest returns `false`, leaves the current editor session intact,
  and records an empty recent list.
- Manifest adapter errors return `false` and expose `error`; document storage
  errors remain represented by V7 document state.
- A partial restore returns `true` if at least one referenced document loaded.
- Concurrent save/restore calls return `false` while recovery is busy.
- The controller never closes documents opened by the host before a manifest
  has loaded successfully; after loading, it replaces the session workspace
  through explicit force-close calls.

## Example and tests

The editor-session demo uses a memory workspace adapter. It saves the tab
order/active document after an explicit action, supports “Restore previous
workspace”, and visibly shows recovery status and recent documents. Unit tests
cover manifest construction, order, active restoration, missing records,
partial recovery, immutable snapshots, and adapter errors. Browser E2E covers
save, restore, and visible recents.

## Trade-offs

V8 deliberately records a workspace only on explicit host calls; automatic
debouncing and crash-safe journaling are product-specific. It is local-first
through an injectable port, not a bundled browser database. Revision conflict
resolution remains a future host workflow built on V7 metadata.
