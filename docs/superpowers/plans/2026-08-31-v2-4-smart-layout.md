# V2.4 Smart Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver serializable ruler guides, deterministic smart snapping, and headless auto-layout primitives.

**Architecture:** Scene V5 persists only horizontal/vertical guides. A pure `LayoutController` derives snapping and immutable layouts from visible unlocked document projection. `CanvasKit` records mutations in history; Canvas consumes transient active-guide feedback.

**Tech Stack:** TypeScript, Vitest, Canvas 2D, Vite, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-31-v2-4-smart-layout-design.md`

## Global Constraints

- Scene schema is V5 and V1–V4 import remains supported.
- Only valid guides serialize; active snap feedback never serializes.
- Hidden or locked nodes are neither snap nor layout targets.
- Start each behavior with a failing focused test; no new dependencies.

---

### Task 1: Scene V5 guides and migration

**Files:** Modify `packages/core/src/model.ts`, `packages/core/src/scene.ts`, `packages/core/src/serialization.ts`, `packages/core/src/index.ts`; test `packages/core/test/scene.test.ts`, `packages/core/test/serialization.test.ts`.

**Produces:** `CanvasGuide`, `GuideAxis`, `CanvasScene.guides`, and `SCENE_VERSION === 5`.

- [ ] Write focused failing tests for V4→V5 empty-guide migration, duplicate IDs, and non-finite guide positions.
- [ ] Run `./node_modules/.bin/vitest run packages/core/test/scene.test.ts packages/core/test/serialization.test.ts`; confirm schema failures.
- [ ] Implement V5 validation, defaults, migration, canonical serialization, and root exports.
- [ ] Re-run the focused tests plus `./node_modules/.bin/tsc -p packages/core/tsconfig.json --noEmit`.
- [ ] Commit with `feat: add layout guides schema`.

### Task 2: Pure guide and layout controller

**Files:** Create `packages/core/src/layout.ts`; modify `packages/core/src/index.ts`; test `packages/core/test/layout.test.ts`.

**Consumes:** V5 scenes, `projectVisibleDocument`, `isNodeInteractive`, and `moveNodes`.

**Produces:** `LayoutController`, immutable guide create/move/remove operations, `snapTranslation`, and `autoLayout`.

- [ ] Write failing tests for nearest edge/centre snap within tolerance, stored-guide priority, hidden/locked peer exclusion, and stable horizontal/vertical/grid placement.
- [ ] Run `./node_modules/.bin/vitest run packages/core/test/layout.test.ts`; confirm the controller is absent.
- [ ] Implement stable candidate order (stored guides then visible unlocked peer geometry), `SnapResult`, and deterministic layout defaults.
- [ ] Run `./node_modules/.bin/vitest run packages/core/test/layout.test.ts packages/core/test/document.test.ts packages/core/test/interaction.test.ts`.
- [ ] Commit with `feat: add smart layout controller`.

### Task 3: History-backed CanvasKit layout commands

**Files:** Modify `packages/core/src/canvas-kit.ts`, `packages/core/src/editor-command.ts`; test `packages/core/test/canvas-kit.test.ts`, `packages/core/test/editor-command.test.ts`.

**Produces:** `createGuide`, `moveGuide`, `removeGuide`, `layoutSelection`, `snapSelection`, and `getActiveLayoutGuides`.

- [ ] Write failing tests for atomic undo/redo of guide and auto-layout mutations, plus non-serialized transient guides.
- [ ] Run `./node_modules/.bin/vitest run packages/core/test/canvas-kit.test.ts packages/core/test/editor-command.test.ts`; observe missing APIs.
- [ ] Implement wrappers using `LayoutController`; sanitize transient state after scene replacement and selection invalidation.
- [ ] Run `./node_modules/.bin/vitest run packages/core/test && ./node_modules/.bin/tsc -p packages/core/tsconfig.json --noEmit`.
- [ ] Commit with `feat: add layout selection commands`.

### Task 4: Canvas overlay and accessible example workflow

**Files:** Modify `packages/renderer-canvas/src/canvas-renderer.ts`, `packages/renderer-canvas/test/canvas-renderer.test.ts`, `examples/basic-canvas/src/main.ts`, `examples/basic-canvas/e2e/workflow.spec.ts`.

**Produces:** Viewport-correct dashed guides and keyboard-operable controls for guide lifecycle, flow direction, grid columns/gap, auto-layout, and snap preview.

- [ ] Write failing Canvas test for horizontal/vertical active-guide coordinates and E2E for guide history + grid layout undo.
- [ ] Run focused Vitest and Playwright; confirm missing overlay/control behavior.
- [ ] Implement a render-only guide overlay and native controls that call only public Core APIs with live status text.
- [ ] Run `./node_modules/.bin/vitest run packages/renderer-canvas/test/canvas-renderer.test.ts`, Vite build, and all basic-canvas E2E.
- [ ] Commit with `feat: add smart layout example workflow`.

### Task 5: V2.4 docs and release evidence

**Files:** Create `docs/api/smart-layout.md`, `docs/guides/smart-layout.md`, `docs/architecture/v2-smart-layout.md`, `docs/release-notes-v2-4.md`, `docs/release-assets-v2-4.md`; modify `README.md`, `docs/migrations.md`, `docs/.vitepress/config.mts`, `.github/RELEASE_CHECKLIST.md`.

- [ ] Document V4→V5 migration, APIs, exact non-goals, architecture trade-offs, and release notes.
- [ ] Run docs build, full unit suite, all basic-canvas E2E, and relevant performance benchmark.
- [ ] Use release-showcase: record exact verification; capture media only in an approved location; leave external publishing/deploy/release/public-post items unchecked without fresh approval.
- [ ] Commit with `docs: document V2.4 smart layout`.
