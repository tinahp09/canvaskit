# CanvasKit v4.0.0 — Collaboration Foundation

## Highlights

- Serializable whole-scene collaboration operations with canonical Scene V7 validation.
- Lamport clocks, deterministic ordering, duplicate protection, and stale-operation rejection.
- Optional CanvasKit transport bridge that captures local edits and applies remote scenes without polluting undo history.
- Ephemeral, renderer-neutral presence snapshots.
- A glassy two-client reference app with browser-tested sync, reconnection, and out-of-order replay.

## Architecture

V4 separates immutable editor state from delivery infrastructure. Core owns
operation validation and convergence; the host owns its transport,
authentication, authorization, storage, and reconnection policy. Read the
[V4 collaboration architecture](/architecture/v4-collaboration-runtime).

## Improvements

- Existing CanvasKit instances remain transport-free until a collaboration
  configuration is supplied.
- A rejected remote operation leaves scene, history, and presence unchanged.
- Presence has deterministic actor ordering and never enters scene JSON.

## Breaking changes

All public CanvasKit packages move to `4.0.0`. The canonical scene remains V7,
so existing scene JSON does not need migration. Consumers should update the
whole CanvasKit suite to compatible `^4.0.0` ranges.

## What’s next

The next collaboration milestone can add production transport adapters,
awareness propagation, server-side authorization guidance, and eventually
fine-grained conflict models where they are justified.
