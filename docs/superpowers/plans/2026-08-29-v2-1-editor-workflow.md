# CanvasKit V2.1 Editor Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a headless, tested editor-workflow layer: complete selection semantics, marquee modes, internal clipboard/cut/duplicate, commands, and an interactive browser example.

**Architecture:** Core owns deterministic scene and workflow semantics. Pointer and keyboard adapters are thin DOM translators. The renderer only visualizes scene/selection state, leaving product UI under the consumer's control.

**Tech Stack:** TypeScript, Vitest, Playwright, Canvas 2D, Vite.

**Spec:** `docs/superpowers/specs/2026-08-29-v2-1-editor-workflow-design.md`

## Global Constraints

- Preserve framework- and renderer-agnostic core APIs.
- Do not change `CanvasScene` schema or use browser/system clipboard APIs.
- All mutating workflow operations are immutable and undoable when they alter a scene.
- Use TDD: each new public behavior must have a focused failing test before production code.
- Do not publish, tag, or push as part of this milestone.

---

### Task 1: Deterministic selection and marquee primitives

**Files:**
- Modify: `packages/core/src/selection.ts`, `packages/core/src/interaction.ts`, `packages/core/src/index.ts`
- Test: `packages/core/test/selection.test.ts`, `packages/core/test/interaction.test.ts`

**Interfaces:** Produces `SelectionMode`, `MarqueeMode`, `SelectionController.set/add/remove/toggle`, and `nodesInRect(scene, rect, mode, index?)` with `contain`/`intersect` behavior. Task 2 consumes these contracts.

- [ ] Write focused failing tests for scene-order selection mutations and both marquee modes.
- [ ] Run `./node_modules/.bin/vitest run packages/core/test/selection.test.ts packages/core/test/interaction.test.ts`; confirm failures name missing APIs or behavior.
- [ ] Implement the smallest immutable/controller changes and export the public types.
- [ ] Re-run focused tests and `./node_modules/.bin/tsc -p packages/core/tsconfig.json --noEmit`; confirm PASS.
- [ ] Commit with `feat: add editor selection and marquee modes`.

### Task 2: Clipboard integrity and command API

**Files:**
- Modify: `packages/core/src/clipboard.ts`, `packages/core/src/canvas-kit.ts`, `packages/core/src/index.ts`
- Create: `packages/core/src/editor-command.ts`
- Test: `packages/core/test/clipboard.test.ts`, `packages/core/test/canvas-kit.test.ts`, `packages/core/test/editor-command.test.ts`

**Interfaces:** Consumes Task 1 selection APIs. Produces `CanvasKit.cut()`, `CanvasKit.executeCommand(command)`, and exported `EditorCommand`. Task 3 invokes this command interface.

- [ ] Write failing tests for cut edge/group cleanup plus undo, paste ID uniqueness and selection, duplicate offset, and every command result.
- [ ] Run the three focused test files; confirm each failure exercises a missing behavior.
- [ ] Implement clipboard cleanup/remapping and command dispatch using existing history execution.
- [ ] Re-run focused tests and all Core unit tests; confirm PASS.
- [ ] Commit with `feat: add editor clipboard and commands`.

### Task 3: DOM workflow adapters and example interaction

**Files:**
- Modify: `packages/core/src/pointer-input.ts`, `packages/core/src/keyboard-input.ts`, `examples/basic-canvas/src/main.ts`, `examples/basic-canvas/src/style.css`
- Test: `packages/core/test/keyboard-input.test.ts`, `examples/basic-canvas/e2e/workflow.spec.ts`

**Interfaces:** Consumes Task 1 selection/marquee and Task 2 command APIs. Produces modifier-aware DOM input and a runnable workflow demo.

- [ ] Write failing unit and browser tests for shortcuts, modifier selection, contain/intersect marquee, copy/paste, duplicate, and cut/undo.
- [ ] Run focused unit and Playwright tests; confirm the intended behavior is absent.
- [ ] Implement event translation and example controls without duplicating workflow logic in the example.
- [ ] Re-run focused tests, then all basic-canvas E2E tests; confirm PASS.
- [ ] Commit with `feat: add interactive editor workflow example`.

### Task 4: Documentation and release verification

**Files:**
- Create: `docs/guides/editor-workflow.md`, `docs/api/editor-workflow.md`
- Modify: `docs/.vitepress/config.ts`, `README.md`, `packages/core/README.md`
- Test: relevant existing docs/API test coverage if present

**Interfaces:** Documents the stable contracts from Tasks 1–3 and provides consumer examples for headless use and DOM adapters.

- [ ] Add docs describing selection modes, marquee coordinate semantics, clipboard constraints, command names, and keyboard/pointer mappings.
- [ ] Run docs build to detect missing links or type errors.
- [ ] Run `test`, Core typecheck, all package builds, basic-canvas E2E, docs build, and release-quality gates.
- [ ] Inspect `git diff --check`; ensure generated caches and build output are not staged.
- [ ] Commit with `docs: document V2.1 editor workflow`.

## Plan Self-Review

- Task 1 establishes the selection/marquee contracts consumed by all later tasks.
- Task 2 centralizes document mutation and history behavior before input integration.
- Task 3 proves the public APIs through real browser interaction instead of embedding a separate example-only model.
- Task 4 supplies consumer-facing documentation and verifies the complete milestone.
