# Real-time CRDT API

CanvasKit 11 adds a backend-neutral, operation-based collaboration boundary for independent Scene V7 node mutations.

```ts
import { CanvasKit, type CrdtTransport } from '@canvaskit/core'

const kit = new CanvasKit({ crdt: { actorId: 'ada' } })

const transport: CrdtTransport = {
  publish(operation) {
    // Send the JSON-safe operation through your WebSocket, BroadcastChannel,
    // WebRTC data channel, or test harness.
  },
  subscribe(listener) {
    // Call listener(operation) for every operation received from peers.
    return () => { /* detach host listener */ }
  },
}

const disconnect = kit.connectCrdt(transport)
// Later: disconnect()
```

## Contracts

`CrdtOperation` is JSON-safe and has an operation ID, actor ID, Lamport clock,
target, node ID, and either a `node-upsert` value or `node-remove` tombstone.
`CrdtTransport` is deliberately small: hosts own connectivity, authentication,
replay, and provider choice.

`CrdtRuntime` can also be used without `CanvasKit` when a host wants to record
and apply operations directly. `validateCrdtOperation` validates untrusted
incoming data before it reaches a live document.

## Deterministic behavior

- Duplicate operations are idempotent.
- For one node, the newest `(clock, actorId, operationId)` tuple wins.
- A newer remove tombstone prevents an old upsert from resurrecting that node.
- Peers that receive the same valid node operations converge regardless of
  delivery order.
- Remote operations do not create local undo entries; they clear redo only.
  A local undo or redo emits its inverse node operation for peers.

## Scope in 11.0.0

The stable V11 operation surface handles nodes. Connectors, groups, layers,
scene properties, text-character merging, persistence, and concrete network
providers are intentionally out of scope. Use the V4 collaboration runtime
when a host needs whole-scene snapshot synchronization today.
