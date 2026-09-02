# V5 production collaboration adapters

## Problem

V4 can converge scene operations but leaves browser delivery to every host.
V5 supplies optional, production-oriented browser transports without putting a
network client, identity policy, or persistence concern in Core.

## Challenge

Transport input is untrusted; browser APIs have different lifecycle semantics;
and reconnecting must not silently reorder or discard local operations.

## Decision

`@canvaskit/collaboration-adapters` is a separate, root-export-only package.
Its codec validates versioned, room-scoped envelopes. Both adapters implement
Core's `CollaborationTransport` contract but never mutate a `CanvasKit` scene.

## Architecture

`CanvasKit` records local operations → adapter serializes a protocol-v1
envelope → `BroadcastChannel` or host-injected `WebSocket` delivers it.
Incoming messages are decoded, room-filtered, and self-echo-filtered before
subscribers pass operations to Core's existing validation boundary. WebSocket
delivery queues a bounded FIFO while closed and exposes overflow diagnostics;
unexpected closes use capped exponential retry with deterministic jitter.

## Trade-offs

BroadcastChannel is zero-server and ideal for same-origin tabs, not devices.
WebSocket can target any host endpoint but does not provide authentication,
authorization, delivery guarantees, conflict-free merging, encryption, or
persistence. Full-scene V4 updates remain last-writer-wins.
