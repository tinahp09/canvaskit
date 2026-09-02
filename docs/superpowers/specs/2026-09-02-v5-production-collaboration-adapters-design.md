# CanvasKit V5 Production Collaboration Adapters

## Goal

Turn the V4 transport boundary into developer-ready browser adapters without
adding a backend, authentication model, or network dependency to Core.

## Product boundary

V5 provides two optional browser adapters:

- `BroadcastChannelTransport` for same-origin tabs and windows.
- `WebSocketTransport` for hosts that provide a browser-compatible WebSocket
  endpoint.

It also provides a small presence relay protocol, reconnect state, bounded
outbox replay, and observable diagnostics. Hosts still own endpoint URLs,
authentication, authorization, room access, durable storage, and server-side
fan-out.

V5 does not ship a WebSocket server, persistence service, identity provider,
CRDT, end-to-end encryption, or shared cursor renderer.

## Package and API shape

Create `@canvaskit/collaboration-adapters` with a root-only public export.
It depends on `@canvaskit/core` and works solely through the public
`CollaborationTransport`, `CollaborationOperation`, and `PresenceSnapshot`
contracts.

```ts
export interface CollaborationAdapter extends CollaborationTransport {
  readonly status: CollaborationConnectionStatus
  connect(): void
  disconnect(options?: { reconnect?: boolean }): void
  subscribeStatus(listener: (status: CollaborationConnectionStatus) => void): () => void
  publishPresence(snapshot: PresenceSnapshot): void | Promise<void>
  subscribePresence(listener: (snapshot: PresenceSnapshot | { actorId: string; type: 'leave' }) => void): () => void
}

export type CollaborationConnectionStatus =
  | { state: 'idle' | 'connecting' | 'open' | 'closed' }
  | { state: 'reconnecting'; attempt: number; retryAt: number }
  | { state: 'error'; message: string }
```

`BroadcastChannelTransport` requires a channel name and automatically opens
the browser channel on `connect`. `WebSocketTransport` accepts an injected
`WebSocketFactory`, URL, room ID, backoff policy, and optional max outbox size.
Injecting the factory keeps the package testable in Node and lets applications
use browser-native, mocked, or platform-specific WebSockets.

## Message protocol

All adapter messages are JSON objects with a protocol version, room ID,
sender ID, and one payload kind:

```ts
{ version: 1, roomId, senderId, type: 'operation', operation }
{ version: 1, roomId, senderId, type: 'presence', presence }
{ version: 1, roomId, senderId, type: 'leave' }
```

Adapters ignore malformed envelopes, messages from other rooms, and their own
echoes. Incoming operations are passed unchanged to subscribed listeners so
V4 validation remains the single Core boundary. Presence is ephemeral; each
snapshot carries `updatedAt` and is relayed independently from scene operations.

## Delivery and reconnection

WebSocket sends immediately while open. While connecting or reconnecting, it
queues operations in FIFO order up to a configured maximum. Overflow rejects
the newest operation through a diagnostic event rather than silently losing
state. When the socket closes unexpectedly, it reconnects with capped
exponential backoff and deterministic jitter derived from sender ID. A manual
disconnect disables reconnect and emits one `leave` message only when open.

BroadcastChannel has no reconnect loop; an unavailable API produces an
explicit error status. Calling lifecycle methods repeatedly is idempotent.

## Architecture

```text
CanvasKit local mutation
  → CollaborationRuntime.recordLocal
  → adapter.publish(operation)
  → BroadcastChannel or host WebSocket

adapter incoming envelope
  → envelope/room/self filtering
  → CollaborationTransport subscriber
  → CanvasKit.applyRemoteOperation
```

The adapter never mutates `CanvasKit`, scene history, or `CollaborationRuntime`
directly. This preserves V4's headless, immutable Core ownership.

## Testing and developer outcome

Unit tests cover envelope validation, room/self filtering, FIFO replay,
overflow, backoff, idempotent lifecycle methods, presence/leave relay, and
browser API unavailability. A browser reference example runs two real
`BroadcastChannel` peers and proves operation sync, presence, disconnect, and
reconnect status through Playwright.

V5 is publishable when the new package builds as part of the nine-package suite
plus the adapter package, its consumer smoke check validates root exports, and
release documentation clearly states the host/server responsibilities.

## Trade-offs

BroadcastChannel provides a zero-server local workflow but does not synchronize
different devices. WebSocket adapts to any server protocol endpoint but cannot
guarantee delivery or authorization without host infrastructure. Full-scene V4
operations remain last-writer-wins; V5 improves delivery ergonomics rather than
introducing CRDT conflict resolution.
