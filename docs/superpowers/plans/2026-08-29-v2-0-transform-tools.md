# CanvasKit V2.0 Transform Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver headless selection transforms, transform overlays, constraints, alignment, and distribution for CanvasKit editors.

**Architecture:** Core computes immutable transformations and renderer-canvas draws the overlay. CanvasKit integrates completed transforms with its existing selection and history APIs; the example only translates pointer input into those public operations.

**Tech Stack:** TypeScript, Vitest, Playwright, Canvas 2D, Vite.

**Spec:** `docs/superpowers/specs/2026-08-29-v2-0-transform-tools-design.md`

## Global Constraints

- Do not add persistent rotation before the model, renderer, serializer, and SVG renderer support it together.
- Preserve node subtype fields, immutable scenes, valid graph/group relationships, and existing V1/V2.1 APIs.
- TDD is mandatory for each public behavior; no system clipboard or external publication.
- Feature freeze follows this plan; use `release-showcase` during release validation.

### Task 1: Transform geometry and controller

**Files:** Create `packages/core/src/transform.ts`, `packages/core/test/transform.test.ts`; modify `packages/core/src/index.ts`.

- [ ] Write failing tests for multi-node bounds, handle positions, rectangle/circle/text resize directions, min constraints, and aspect lock.
- [ ] Run the focused test and verify missing API failures.
- [ ] Implement `TransformController`, overlay geometry, and immutable resize adapters.
- [ ] Run focused tests and Core typecheck.
- [ ] Commit `feat: add transform controller`.

### Task 2: CanvasKit transform commands and history

**Files:** Modify `packages/core/src/canvas-kit.ts`, `packages/core/src/editor-command.ts`, tests in `canvas-kit.test.ts` and `editor-command.test.ts`.

- [ ] Write failing tests for resize/align/distribute selection commands and single undo/redo operations.
- [ ] Implement thin CanvasKit wrappers around TransformController with no duplicate geometry code.
- [ ] Run Core tests/typecheck and commit `feat: add transform selection commands`.

### Task 3: Renderer overlay and interactive example

**Files:** Modify `packages/renderer-canvas/src/canvas-renderer.ts`, `examples/basic-canvas/src/main.ts`, `style.css`; tests in renderer and `examples/basic-canvas/e2e/transform.spec.ts`.

- [ ] Write failing renderer/E2E tests for bounds/handles, resize drag, aspect lock, align/distribute, and undo/redo.
- [ ] Implement overlay drawing and example event translation through public APIs.
- [ ] Run renderer tests, all basic-canvas E2E, builds, and commit `feat: add transform workflow example`.

### Task 4: V2.0 docs and release showcase

**Files:** Create transform API/guide, V2.0 release notes and architecture note; modify docs navigation, README, release checklist and release asset manifest.

- [ ] Document preview-only rotation honestly and provide developer examples.
- [ ] Capture required visual evidence after verification; do not add generated binary media to git without approval.
- [ ] Run full test/typecheck/build/E2E/docs/release-quality gates, then complete release checklist items supported by evidence.
- [ ] Commit `docs: document V2.0 transform tools`.
