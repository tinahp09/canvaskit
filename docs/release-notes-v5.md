# CanvasKit v5.0.0 — Production Collaboration Adapters

## Highlights

- Added `@canvaskit/collaboration-adapters` as the tenth public package.
- Added `BroadcastChannelTransport` for same-origin peer collaboration.
- Added injected `WebSocketTransport` with FIFO replay, overflow diagnostics,
  status subscriptions, and bounded reconnect behavior.
- Added a browser-tested, glassy two-peer reference demo.

## Architecture

Delivery is separated from Core scene ownership. See the
[V5 adapter architecture](/architecture/v5-production-collaboration-adapters).

## Breaking changes

All public packages move to `5.0.0`; Scene V7 remains unchanged. Update every
CanvasKit package range together to `^5.0.0`.

## What's next

V6 can build higher-level editor workflows on these stable transport seams.
