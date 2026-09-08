# V9 autosave and recovery journal design

## Problem

V8 restores a deliberately saved workspace, but an editor host still loses
changes made after the last explicit document save when its process reloads or
crashes.

## Goals

- Add host-injected autosave scheduling for dirty V7 documents.
- Record local recovery snapshots before the durable document save completes.
- Let hosts detect, restore, or discard recovery data explicitly.
- Keep all browser, filesystem, network, and retention choices outside Core.

## Non-goals

V9 does not provide a concrete storage provider, browser lifecycle listeners,
cross-device sync, offline queues, encryption, merge, CRDTs, or conflict UI.

## Storage boundary

```ts
interface RecoveryJournalEntry {
  readonly document: StoredDocument
  readonly capturedAt: string
}

interface RecoveryJournalStorageAdapter {
  load(documentId: string): Promise<RecoveryJournalEntry | undefined>
  save(entry: RecoveryJournalEntry): Promise<void>
  remove(documentId: string): Promise<void>
}
```

The journal stores the serialized V7 document snapshot and capture time. The
host decides where it lives and whether it is encrypted or retained.

## Controllers

`AutosaveController` receives a `PersistentEditorSession`, a journal adapter,
and an optional `delayMs` (default `800`). It subscribes to session snapshots.
For each dirty document it schedules one debounced operation. That operation
captures the current canonical scene into the journal, calls the V7 save API,
and removes the journal only after that same captured scene is confirmed clean.

Its immutable snapshot exposes per-document `idle`, `pending`, `saving`,
`saved`, or `error` state and an optional error message. A second schedule for
the same document replaces the pending timer; a document already saving is
scheduled again after that save completes if it remains dirty.

`RecoveryJournalController` is separate and explicit. `hasRecovery(id)` reads
one entry. `restoreRecovery(id)` loads and validates it through the V7 session
and returns `false` for a missing or invalid record. `discardRecovery(id)`
removes it. Recovering an existing open document replaces it only after a
valid journal record is available.

## Failure rules

- Journal save failure leaves the document open and surfaces `error`; durable
  save is not attempted without a journal capture.
- Durable save failure retains the journal and surfaces `error`.
- Journal removal failure after a confirmed save surfaces `error`; it never
  changes the document's durable save result.
- A missing journal returns `false`, without changing the session.
- Disposing autosave cancels pending timers and never starts new writes.

## Demo and release evidence

The editor-session demo exposes autosave status, recovery availability,
"Recover changes", and "Discard recovery" using in-memory injected adapters.
E2E covers scheduled save, simulated save failure with retained recovery, and
restore/discard behavior. V9 follows the existing major-release workflow:
release notes, architecture/API docs, three screenshots, a 5–15 second GIF,
and updated checklist.

## Trade-offs

Writing a journal before every durable autosave costs host storage and does not
guarantee recovery if the host store itself fails. The separate journal and
document adapters keep V7's storage-neutral design intact and provide a safe
foundation for later sync/conflict workflows without prematurely selecting a
database or protocol.
