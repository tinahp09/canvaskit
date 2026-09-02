# Collaboration adapters API

Install `@canvaskit/collaboration-adapters` beside `@canvaskit/core`.

- `BroadcastChannelTransport` relays room-scoped operations and presence
  between same-origin browser contexts. Omit `channelFactory` to use the
  browser API; pass `null` to surface the unavailable-transport status.
- `WebSocketTransport` accepts an injected `WebSocketFactory`, queues messages
  FIFO while connecting, and exposes `subscribeDiagnostics` for outbox
  overflow. Hosts own the endpoint protocol, credentials, and server.
- Every adapter exposes `connect`, `disconnect`, `status`, `subscribeStatus`,
  `publishPresence`, and `subscribePresence`, in addition to Core's
  `publish` and `subscribe` operation contract.

The public codec exports `encodeEnvelope`, `decodeEnvelope`, protocol version
`1`, and `CollaborationEnvelope`. Invalid, other-room, and self-echo messages
are ignored. No adapter includes a WebSocket server, CRDT, database, or auth.
