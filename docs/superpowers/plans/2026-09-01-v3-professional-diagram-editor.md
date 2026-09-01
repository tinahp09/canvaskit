# CanvasKit V3 Professional Diagram Editor Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the framework-neutral runtime required to build professional diagram editors on CanvasKit.

**Architecture:** V3 adds hierarchy and interaction semantics to Core while retaining immutable scenes and renderer independence. The reference editor consumes only public APIs; it proves the runtime without becoming a second product surface.

**Tech Stack:** TypeScript, Vitest, Playwright, Vite/VitePress, Canvas/SVG renderers.

**Spec:** `docs/superpowers/specs/2026-09-01-v3-professional-diagram-editor-design.md`

## Global Constraints

- Preserve immutable, serializable, framework- and renderer-neutral Core APIs.
- Advance only after the focused phase tests and full Core suite pass.
- Use red/green tests before each behavioral implementation.
- Do not stage generated caches or build artifacts.
- Public publishing, tags, and GitHub Releases require explicit user approval.

---

### Task 1: Phase 0 — Scene V7 hierarchy schema and migration

**Files:**
- Modify: `packages/core/src/model.ts`, `packages/core/src/migrations.ts`, `packages/core/src/serialization.ts`, `packages/core/src/index.ts`
- Modify: `packages/core/test/serialization.test.ts`

**Interfaces:**
- Produces `SCENE_VERSION = 7`, `CanvasGroup { id, nodeIds, parentId?, visible, locked }`, and V6-to-V7 migration.

- [ ] **Step 1: Write failing migration/parse tests** for legacy V6 group defaults and rejected unknown parents, duplicate group membership, and cycles.
- [ ] **Step 2: Run the focused test** with `node_modules/.bin/vitest run packages/core/test/serialization.test.ts`; expect the new assertions to fail.
- [ ] **Step 3: Add the V7 model, migration, parser, and canonical-reference validation** with cycle detection by walking each group parent chain.
- [ ] **Step 4: Re-run focused tests**, then `node_modules/.bin/vitest run packages/core/test/serialization.test.ts`; expect pass.
- [ ] **Step 5: Commit** `feat(core): add Scene V7 hierarchy schema`.

### Task 2: Phase 0 — Group hierarchy operations and inherited state

**Files:**
- Modify: `packages/core/src/document.ts`, `packages/core/src/index.ts`
- Modify: `packages/core/test/document.test.ts`

**Interfaces:**
- Produces `groupDescendantNodeIds(scene, groupId): string[]`, `setGroupParent`, `setGroupVisibility`, `setGroupLocked`, and group-aware render/interaction projection.

- [ ] **Step 1: Write failing tests** for recursive stable descendants, group parent cycle rejection, hidden ancestor projection, and locked ancestor pointer rejection.
- [ ] **Step 2: Run** `node_modules/.bin/vitest run packages/core/test/document.test.ts`; expect failure.
- [ ] **Step 3: Implement immutable hierarchy resolvers and mutations**, ensuring a node cannot be newly grouped twice and ungrouping reparents children to the removed group's parent.
- [ ] **Step 4: Re-run focused and full Core tests** with `node_modules/.bin/vitest run packages/core/test/document.test.ts packages/core/test/selection.test.ts` then `node_modules/.bin/vitest run packages/core/test`.
- [ ] **Step 5: Commit** `feat(core): add nested group hierarchy controls`.

### Task 3: Phase 0 — Group-aware transforms and public migration docs

**Files:**
- Modify: `packages/core/src/transform.ts`, `packages/core/test/transform.test.ts`, `docs/migrations.md`, `docs/api/core.md`

**Interfaces:**
- Changes `TransformController` selection resolution to accept group IDs and transform each resolved leaf once.

- [ ] **Step 1: Write failing transform tests** for parent-group move/resize/rotation and duplicate descendant de-duplication.
- [ ] **Step 2: Run** `node_modules/.bin/vitest run packages/core/test/transform.test.ts`; expect failure.
- [ ] **Step 3: Resolve group IDs through `groupDescendantNodeIds` before computing transform bounds and mutations.**
- [ ] **Step 4: Run the focused tests and full Core suite; update V7 migration/API docs.**
- [ ] **Step 5: Commit** `feat(core): transform nested groups`.

### Task 4: Phase 1 — Tool runtime

**Files:** `packages/core/src/tool-runtime.ts`, `packages/core/src/canvas-kit.ts`, `packages/core/src/index.ts`, `packages/core/test/tool-runtime.test.ts`.

- [ ] Write failing transition tests for select, pan, rectangle, text, and connector tools; verify begin/update/end/cancel intent ordering.
- [ ] Implement the serializable state machine and typed intent/event interfaces with no renderer dependency.
- [ ] Run focused tests and full Core suite; commit `feat(core): add tool runtime`.

### Task 5: Phase 2 — Professional selection and manipulation

**Files:** `packages/core/src/selection.ts`, `packages/core/src/snap.ts`, `packages/core/src/keyboard-input.ts`, related tests.

- [ ] Write failing tests for lasso inclusion, group expansion, deterministic snap tie-breaking, previews, and keyboard nudges.
- [ ] Implement immutable selection helpers, snap resolver, preview intents, and nudge mutations.
- [ ] Run focused tests and full Core suite; commit `feat(core): add professional manipulation`.

### Task 6: Phase 3 — Inspector runtime

**Files:** `packages/core/src/inspector.ts`, `packages/core/src/extensions.ts`, tests, API docs.

- [ ] Write failing tests for typed applicability, mixed values, batch mutation, and atomic rejection.
- [ ] Implement data-only property schemas and immutable adapters.
- [ ] Run focused tests and full Core suite; commit `feat(core): add inspector runtime`.

### Task 7: Phase 4 — Command palette and shortcuts

**Files:** `packages/core/src/editor-command.ts`, `packages/core/src/keyboard-input.ts`, tests, API docs.

- [ ] Write failing tests for applicability filtering, ordering, shortcut collisions, and execute results.
- [ ] Implement command-surface snapshots and shortcut dispatch without UI coupling.
- [ ] Run focused tests and full Core suite; commit `feat(core): add command palette runtime`.

### Task 8: Phase 5 — Diagram runtime

**Files:** `packages/core/src/node-types.ts`, `packages/core/src/ports.ts`, `packages/core/src/connector.ts`, `packages/core/src/layout.ts`, tests, diagram docs.

- [ ] Write failing tests for port compatibility, constrained connector creation, deterministic routing/layout, and invalid edge rejection.
- [ ] Implement typed diagram definitions and policies using the existing connector/layout primitives.
- [ ] Run focused tests and full Core suite; commit `feat(core): add professional diagram runtime`.

### Task 9: Phase 6 — Reference diagram editor

**Files:** `examples/diagram-editor/**`, E2E tests, examples docs.

- [ ] Write browser tests for group selection, tool switch, connector creation, inspector edit, and command shortcut.
- [ ] Implement the glassy professional application through only public V3 APIs; use Sax icons for iconography.
- [ ] Run E2E and full workspace build; commit `feat(example): add V3 diagram editor`.

### Task 10: Phase 7 — Feature freeze and V3 release readiness

**Files:** version/package metadata, CHANGELOG, README, API/guides/architecture/release assets, `.github/RELEASE_CHECKLIST.md`.

- [ ] Freeze scope; resolve only bugs, performance regressions, edge cases, and necessary refactors.
- [ ] Run unit, browser E2E, docs build, package smoke, and performance checks; record exact output.
- [ ] Create the GIF, 3–5 screenshots, architecture explanation, release notes, and checklist evidence via the repository release workflow.
- [ ] Bump version, update changelog and package metadata, then commit `release: CanvasKit v3.0.0`.
