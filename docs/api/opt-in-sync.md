# Opt-in sync API

CanvasKit V10 keeps remote synchronization outside the rendering engine. Supply a durable outbox and an adapter for your own service, then choose when work is queued and synchronized.

```ts
const sync = new SyncController({ session, queue, adapter })
await sync.queueDocument('brief')
await sync.syncDocument('brief')
```

`SyncQueueStorageAdapter` persists entries locally. `SyncAdapter` only exposes `pull` and `push`, so Core owns neither network credentials nor a provider SDK. An acknowledged push stores its returned revision and removes just that operation.

If a remote revision conflicts with a queued local entry, the snapshot becomes `conflict` and no open scene is overwritten. The host must choose `accept-remote`, `keep-local`, or `merge-document` through `resolveConflict`.

`createMemorySyncAdapter()` is deterministic and intended only for tests and local demos.
