# V7 persistence and recovery design

## Problem

V6 can coordinate several open `CanvasKit` documents and accurately expose
their dirty state, but it intentionally forgets them when a host is recreated.
Every application currently has to invent its own save/load contract, status
model, recent-document list, and error handling.

## Challenge

Persistence has to work with local databases, a REST service, desktop files,
and future collaborative backends without putting browser APIs, credentials,
networking, retries, or product policy in `@canvaskit/core`. An async save
must not mark a document clean if the scene changed while the adapter was
writing an earlier revision.

## Decision

V7 adds a small, injected `DocumentStorageAdapter` port and a
`PersistentEditorSession` orchestration layer. `EditorSession` remains a
synchronous, headless owner of open CanvasKit instances. The new layer owns
async storage lifecycle and projects it into immutable session snapshots.

The adapter stores opaque, canonical serialized scenes and host-facing
metadata. It is neither implemented nor selected by Core. A host can supply
an IndexedDB, file, REST, cloud, or in-memory implementation.

## Public API

`@canvaskit/core` exports these contracts:

```ts
export interface StoredDocument {
  readonly id: string
  readonly title: string
  readonly scene: string
  readonly updatedAt: string
  readonly revision?: string
}

export interface DocumentStorageAdapter {
  list(): Promise<readonly StoredDocument[]>
  load(id: string): Promise<StoredDocument | undefined>
  save(document: StoredDocument): Promise<StoredDocument>
}

export type DocumentPersistenceStatus = 'idle' | 'loading' | 'saving' | 'saved' | 'error'
```

`PersistentEditorSession` accepts `{ storage, createCanvasKit? }`. It exposes
`restore()`, `loadDocument(id)`, `saveDocument(id?)`, `retrySave(id?)`,
`getSnapshot()`, `subscribe()`, `getDocument()`, and the V6 session lifecycle
methods needed by hosts. `restore()` lists persisted documents in adapter
order, loads each record into a fresh `CanvasKit`, opens it in the underlying
session, and restores the first document as active.

Snapshots extend each V6 document entry with `persistence` status,
`updatedAt`, optional `revision`, and an optional frozen error message. The
session-level snapshot includes `isRestoring`. Returned snapshots never expose
adapter-owned mutable objects.

## Data flow

1. The host provides a `DocumentStorageAdapter` and creates a persistent
   session.
2. `restore()` transitions to restoring/loading, obtains the adapter list,
   deserializes each canonical scene, then opens a new CanvasKit document.
3. `saveDocument()` captures the exact current serialization before awaiting
   the adapter. Its document is `saving`.
4. On a successful save, the stored `updatedAt` and optional revision update.
   The V6 clean baseline is updated only if the live serialization still
   equals the captured serialization; otherwise the document remains dirty.
5. On failure, the document becomes `error`, retains its dirty scene, and
   exposes a safe error message. `retrySave()` creates a fresh save from the
   current scene.

## Error and edge-case policy

- A missing adapter record makes `loadDocument()` return `false`; it is not an
  exception.
- Adapter or invalid-scene failures are contained in snapshot state rather
  than discarded. Existing open documents are not closed during a failed
  restore.
- Concurrent saves for the same id are ignored while that document is already
  `saving`; the caller receives `false` and may retry after completion.
- V7 does not merge revisions. `revision` is metadata reserved for a future
  host conflict policy.
- Close confirmation retains the V6 dirty rule. Storage errors do not prevent
  a host from explicitly forcing a close.

## Example application

The V7 example extends the editor-session demo with an in-memory adapter that
has asynchronous, REST-like latency. It demonstrates restoring a previous
workspace, saving an active document, visible `saving` / `saved` / `error`
status, a deliberately failed save, and retry. The adapter is example-only;
it is not exported by the library.

## Testing

Unit tests prove record loading, canonical save payloads, immutable status
snapshots, save-race dirty protection, failed-save retention, retry behavior,
and no mutation after disposal. Browser E2E proves the reference UI can save,
restore, display error status, and retry. Typecheck, package tests, docs
build, release validation, package build, smoke, bundle-size, and browser
tests remain release gates.

## Trade-offs

The added wrapper is an extra API rather than silently making V6 asynchronous.
That preserves the small deterministic V6 session for applications with their
own orchestration. V7 chooses a simple last-write adapter port and defers
autosave queues, offline replication, conflict resolution, and backend
implementations; those policies vary by product and can be layered on this
stable boundary.
