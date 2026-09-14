# V10 opt-in sync architecture

## Problem

V9 protects local edits, but does not carry a durable change to another device.

## Challenge

Hosts need remote synchronization without Core selecting a cloud provider, credentials model, or conflict UI.

## Decision

V10 introduces a durable host-owned outbox and an injected `SyncAdapter`. The host explicitly queues and synchronizes documents.

## Architecture

`SyncController` serializes the current document to an outbox entry, pulls its remote revision, and pushes the oldest pending entry. Only an acknowledgement removes the entry. A revision mismatch produces immutable `conflict` state. The host then accepts remote content, keeps local content against the new revision, or supplies a validated merged document.

## Trade-offs

Explicit sync avoids hidden network calls and vendor lock-in, but hosts own connectivity, retry scheduling, authentication, durable storage, and conflict UI. V10 is intentionally not a CRDT or automatic merge system.
