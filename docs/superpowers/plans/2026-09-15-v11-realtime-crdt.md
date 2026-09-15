# CanvasKit V11 Real-time CRDT Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver convergent granular collaboration for Scene V7 without a backend or provider dependency.

**Architecture:** A new `CrdtRuntime` maintains Lamport ordering, per-entity value registers, and tombstones. A CanvasKit bridge computes granular scene changes, publishes them through an injected transport, and applies remote mutations without creating undo entries.

**Tech Stack:** TypeScript, Vitest, Playwright, existing Scene V7, CanvasKit collaboration transport.

**Spec:** `docs/superpowers/specs/2026-09-15-v11-realtime-crdt-design.md`

## Constraints

- No backend, provider SDK, credentials, text-character CRDT, or Scene V8 migration.
- Duplicate, stale, malformed, and out-of-order operations must not diverge peers.
- Presence remains ephemeral and never enters serialized scenes.
- Feature freeze requires unit/convergence/E2E tests, docs, media, `11.0.0` metadata, and release gates.

### Task 1: CRDT operation schema and deterministic entity runtime

**Files:** Create `packages/core/src/crdt.ts`; create `packages/core/test/crdt.test.ts`; modify `packages/core/src/index.ts`.

- [ ] Write a failing two-peer convergence test that creates different rectangle nodes concurrently, delivers operations in opposite order, and expects equal canonical serialized scenes.
- [ ] Run `./node_modules/.bin/vitest run packages/core/test/crdt.test.ts`; confirm the missing-runtime failure.
- [ ] Implement `CrdtOperation`, `CrdtRuntime`, operation validation, tuple ordering, entity upsert/remove registers, and tombstones.
- [ ] Add tests for duplicate delivery, stale upsert after remove, malformed payload rejection, and same-clock actor ordering.
- [ ] Run the focused suite and commit `feat(core): add CRDT scene runtime`.

### Task 2: CanvasKit CRDT bridge and local history isolation

**Files:** Modify `packages/core/src/canvas-kit.ts`; modify `packages/core/test/canvas-kit.test.ts`; modify `packages/core/test/crdt.test.ts`.

- [ ] Write a failing test proving two connected kits converge after independent local `execute` changes and remote updates do not create an undo entry.
- [ ] Implement `CanvasCrdtOptions`, `connectCrdt`, local before/after diff publication, and remote operation application without local history commands.
- [ ] Test reconnect/replay and remote invalid-payload safety.
- [ ] Run Core tests and commit `feat(core): bridge CRDT operations to CanvasKit`.

### Task 3: Presence and two-peer reference editor

**Files:** Modify `examples/collaboration/src/main.ts`, `examples/collaboration/e2e/collaboration.spec.ts`, and styles as needed.

- [ ] Write failing browser tests for concurrent peer edits, visible remote selection/cursor state, out-of-order delivery, and reconnect convergence.
- [ ] Replace the whole-scene demo path with the CRDT bridge while retaining the injected in-memory transport.
- [ ] Run focused Playwright E2E and commit `feat(example): demonstrate V11 realtime CRDT collaboration`.

### Task 4: V11 release handoff

**Files:** Create V11 API, architecture, release notes, asset manifest, release screenshots/GIF; modify README, CHANGELOG, docs navigation, checklist, package manifests, lockfile, release scripts, and bundle budget tests.

- [ ] Add API usage and Problem → Challenge → Decision → Architecture → Trade-offs documentation.
- [ ] Capture three real demo screenshots and a 5–15 second GIF.
- [ ] Set every publishable package and internal range to `11.0.0`.
- [ ] Run typecheck, unit, E2E, release validation, package smoke, build, bundle, benchmark, and docs build; commit `release: prepare CanvasKit v11.0.0`.
