# Autosave and Recovery Journal API

V9 adds host-injected recovery journaling and debounced autosave above V7 document storage.

```ts
const journal = { load: async (id) => undefined, save: async (entry) => {}, remove: async (id) => {} }
const autosave = new AutosaveController({ session, journal })
const recovery = new RecoveryJournalController({ session, storage: journal })
```

`AutosaveController` waits 800ms by default after a dirty change, writes a canonical journal snapshot, then calls the V7 durable save. It removes the journal only after the document is clean. Its immutable snapshots expose `idle`, `pending`, `saving`, `saved`, or `error` per document.

`RecoveryJournalController` provides explicit `hasRecovery(id)`, `restoreRecovery(id)`, and `discardRecovery(id)` operations. Missing, malformed, or failed records return `false` without changing an open document.

V9 provides no concrete browser store, autosave lifecycle listener, cloud sync, merge, conflict UI, encryption, or retention policy.
