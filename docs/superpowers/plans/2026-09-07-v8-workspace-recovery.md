# V8 Workspace Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task.

**Goal:** Add a host-injected local-first workspace manifest that restores document order, active tab, and recents on V7.

**Architecture:** WorkspaceRecoveryController composes PersistentEditorSession with WorkspaceStorageAdapter. No browser storage, backend, auth, or CRDT is included.

**Tech Stack:** TypeScript, Vitest, Vite, Playwright, VitePress.

**Spec:** docs/superpowers/specs/2026-09-07-v8-workspace-recovery-design.md

## Global Constraints

- Keep Core storage-provider and browser agnostic.
- Test production behavior before implementation.
- Do not stage generated caches.

---

### Task 1: Workspace recovery Core

**Files:** Create packages/core/src/workspace-recovery.ts; modify packages/core/src/index.ts; create packages/core/test/workspace-recovery.test.ts.

- [ ] Write failing tests for save manifest, order, active tab, missing manifest, partial restore, adapter failure, busy status, and frozen snapshot.
- [ ] Run pnpm --filter @canvaskit/core exec vitest run test/workspace-recovery.test.ts and observe missing controller failure.
- [ ] Implement WorkspaceStorageAdapter, WorkspaceRecoveryController, immutable status/recent snapshots, and explicit save/restore semantics.
- [ ] Run focused tests, full Core tests, and Core typecheck.
- [ ] Commit feat(core): add workspace recovery.

### Task 2: V8 demo and browser proof

**Files:** Modify examples/editor-session/src/main.ts, style.css, and e2e/editor-session.spec.ts.

- [ ] Add failing browser tests for Save workspace, Restore previous workspace, recovery status, and recents.
- [ ] Implement memory workspace adapter and glassy status/recents UI.
- [ ] Run example build and focused browser E2E.
- [ ] Commit feat(example): demonstrate workspace recovery.

### Task 3: Release preparation

**Files:** Create V8 API, architecture, release notes, asset manifest, screenshots, and GIF; update README, CHANGELOG, nav, release checklist, all public versions, lockfile, and release validators.

- [ ] Create media and documentation answering Problem, Challenge, Decision, Architecture, and Trade-offs.
- [ ] Bump every public package and internal range to 8.0.0.
- [ ] Run typecheck, unit tests, docs build, release validation, release build, bundle tests, package smoke, and full browser E2E.
- [ ] Commit release: prepare CanvasKit v8.0.0.

## Plan Self-Review

The plan covers Core contracts, recovery behavior, user-visible evidence, and release gates without adding a browser storage provider or conflict engine.
