# CanvasKit V4 Collaboration Foundation

## Goal

Give CanvasKit a framework-neutral collaboration runtime that lets host
applications exchange, replay, and converge document operations without
coupling Core to a transport, backend, identity provider, or visual UI.

## Product boundary

V4 owns operation envelopes, a deterministic Lamport ordering rule, idempotent
operation application, local/remote history semantics, and ephemeral presence
snapshots. A host owns user authentication, connection lifecycle, durable
storage, access control, and the transport that moves messages between peers.

V4 does not ship a WebSocket server, a CRDT dependency, cloud persistence,
server-side authorization, shared cursors rendered by CanvasKit, comments, or
a conflict-free rich-text model.

## Chosen approach

CanvasKit records a serializable operation after a local scene mutation. Each
operation has a globally unique ID, an `actorId`, a strictly increasing Lamport
clock, a target key, a mutation kind, and a complete canonical scene snapshot
for the operation result. The snapshot makes operation replay deterministic and
allows a host to persist or inspect operations without private Core state.

`CollaborationRuntime` maintains the highest operation ordering tuple it has
applied for every target key. The tuple is ordered lexicographically by
`clock`, then `actorId`, then `id`. A stale remote operation is ignored; the
same operation ID is ignored; a newer operation replaces the target's scene
state. This is last-writer-wins at the operation boundary, not a full CRDT.

## Architecture

```
host UI mutation → CanvasKit → CollaborationRuntime.recordLocal(scene)
                                      ↓
                         serializable CollaborationOperation
                                      ↓
                  host transport adapter sends / persists operation

remote transport → CollaborationRuntime.applyRemote(operation, scene)
                                      ↓
                             immutable CanvasScene + result
                                      ↓
                                   CanvasKit.setScene
```

The runtime must be usable alone for hosts that manage scene assignment
themselves, and through `CanvasKit` for hosts that want local mutation capture
and remote operation application to notify render subscribers.

## Public interfaces

```ts
export interface CollaborationOperation {
  id: string
  actorId: string
  clock: number
  target: string
  kind: 'scene'
  scene: CanvasScene
}

export interface CollaborationApplyResult {
  scene: CanvasScene
  applied: boolean
  reason?: 'duplicate' | 'stale'
}

export interface PresenceSnapshot {
  actorId: string
  updatedAt: number
  selection: string[]
  cursor?: Point
  metadata?: Record<string, unknown>
}

export interface CollaborationTransport {
  publish(operation: CollaborationOperation): void | Promise<void>
  subscribe(listener: (operation: CollaborationOperation) => void): () => void
}
```

`CollaborationRuntime` exposes `recordLocal`, `applyRemote`,
`getClock`, `setPresence`, `removePresence`, and `getPresence`. Presence is
never part of `CanvasScene` serialization and its actor keys are deterministic.

`CanvasKit` exposes `collaboration` only when constructed with an `actorId`.
It records full-scene operations after successful local history-backed scene
changes. Applying a remote operation clears local redo state and preserves no
undo entry for the remote mutation. Hosts call `connectCollaboration(transport)`
to publish local operations and receive remote operations; disconnecting
returns the transport cleanup function.

## Conflict and validation rules

- Operation IDs and actor IDs are non-empty strings.
- Clocks are safe non-negative integers.
- Incoming scenes pass the existing canonical Scene V7 parser before they are
  applied.
- Local operations advance the clock above any remote clock observed.
- A local operation ID is deterministic from `actorId` and its clock unless a
  caller supplies an ID generator.
- A received operation with an already seen ID is ignored.
- For a single `target`, the highest ordering tuple wins; lower tuples are
  ignored as stale.
- A malformed operation throws without changing the current scene, clock,
  history, or presence state.
- Remote mutations never appear in the local undo stack. A subsequent local
  mutation begins from the remote scene.

## Milestones

| Phase | Publishable developer outcome |
| --- | --- |
| 0 — Operation model | Typed, serializable operation envelopes and validation. |
| 1 — Runtime convergence | Lamport clocks, idempotency, deterministic stale-operation rejection, and presence snapshots. |
| 2 — CanvasKit bridge | Local capture, remote scene application, and transport lifecycle API. |
| 3 — Reference collaboration example | Two independently controlled local clients plus visible remote presence and E2E sync proof. |
| 4 — Release | Documentation, migration/API notes, benchmark/regression checks, media, and V4 release package. |

## Testing and quality

Every operation rule is covered by Core unit tests: validation, serialization,
clock advancement, duplicate replay, ordering ties, stale rejection, remote
history isolation, and presence expiration/removal. The reference example has
browser coverage for two-client sync, out-of-order delivery, reconnect replay,
and an accessible presence list. Existing unit, E2E, docs, package-smoke, and
bundle-budget gates remain required before release.

## Trade-offs

- A full canonical snapshot per operation is larger than a JSON patch but makes
  replay, persistence, and debugging deterministic while the scene API evolves.
- Last-writer-wins is simpler than a CRDT and resolves whole-scene conflicts;
  fine-grained concurrent text editing is explicitly deferred.
- Transport is injected rather than bundled, so applications can choose
  WebSocket, Supabase, REST polling, local broadcast channels, or tests without
  pulling a networking dependency into Core.
