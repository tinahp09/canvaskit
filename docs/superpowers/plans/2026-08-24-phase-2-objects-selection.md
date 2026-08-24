# Phase 2 Objects and Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Release `0.2.0` with circle/text nodes, drag and multi-selection, marquee selection, deletion, keyboard controls, grid, and grid snapping.

**Architecture:** Core gains immutable node unions, selection state, and interaction controllers; Canvas rendering remains a consumer of public scene state. Pointer and keyboard adapters convert DOM events into explicit core operations. The example becomes an editable shapes application.

**Tech Stack:** TypeScript, Vitest, Playwright, Canvas 2D, Vite.

**Spec:** `docs/superpowers/specs/2026-08-23-canvaskit-v1-roadmap-design.md`

## Global Constraints

- Core remains framework- and renderer-agnostic.
- Selection and changes are immutable and serializable in schema version 1.
- Drag and marquee selection operate in world coordinates.
- All added public APIs receive red/green unit tests and an example path.

---

### Task 1: Expand the Node Model

**Files:**
- Modify: `packages/core/src/model.ts`, `scene.ts`, `serialization.ts`, `index.ts`
- Test: `packages/core/test/node-types.test.ts`

**Produces:** `CircleNode`, `TextNode`, `CanvasNode`, `addCircle`, `addText`; serialization round-trips all three types.

- [ ] Write tests that create a circle and text node, serialize the scene, reload it, and assert deep equality.
- [ ] Run `./node_modules/.bin/vitest run packages/core/test/node-types.test.ts`; expect missing APIs.
- [ ] Implement discriminated node types, immutable add methods, and per-type parser validation.
- [ ] Rerun the test and `tsc -p packages/core/tsconfig.json --noEmit`; expect PASS.
- [ ] Commit with `feat: add circle and text nodes`.

### Task 2: Add First-Class Selection

**Files:**
- Create: `packages/core/src/selection.ts`
- Modify: `packages/core/src/canvas-kit.ts`, `index.ts`
- Test: `packages/core/test/selection.test.ts`

**Produces:** `SelectionController` with `select`, `selectMultiple`, `clear`, `get`, and `selectAll`.

- [ ] Test replacement selection, additive selection, clear, and select-all against a scene with three nodes.
- [ ] Run the focused test; expect missing `SelectionController`.
- [ ] Implement a Set-backed controller returning ordered readonly ids and rejecting ids absent from the current scene.
- [ ] Rerun focused and all Core tests; expect PASS.
- [ ] Commit with `feat: add scene selection controller`.

### Task 3: Implement Drag, Marquee, Delete, and Keyboard Input

**Files:**
- Create: `packages/core/src/interaction.ts`, `packages/core/src/keyboard-input.ts`
- Modify: `packages/core/src/pointer-input.ts`, `canvas-kit.ts`, `index.ts`
- Test: `packages/core/test/interaction.test.ts`, `keyboard-input.test.ts`

**Produces:** node hit testing, world-space dragging, marquee selection, `deleteSelection`, and keyboard handlers for Delete, V/H/R/C/T, and Ctrl/Cmd+A.

- [ ] Test each behavior in isolation against real scene nodes.
- [ ] Run focused tests; expect missing operations.
- [ ] Implement minimal world-coordinate interaction operations and DOM adapters.
- [ ] Run all Core tests and typecheck; expect PASS.
- [ ] Commit with `feat: add shape interactions and keyboard controls`.

### Task 4: Add Grid, Snap, Rendering, Editable Example, and Release Verification

**Files:**
- Modify: `packages/renderer-canvas/src/canvas-renderer.ts`, `examples/basic-canvas/src/main.ts`, `style.css`, `README.md`, `docs/getting-started.md`
- Create: `packages/core/src/grid.ts`, `packages/core/test/grid.test.ts`, `.changeset/phase-two.md`
- Test: renderer unit tests and `examples/basic-canvas/e2e/shapes.spec.ts`

**Produces:** subtle dot grid, configurable grid snapping, rendered circle/text nodes and selected outlines, an editable shapes example, and `0.2.0` release metadata.

- [ ] Test snapping a world point to a 20px grid and renderer drawing circle/text paths.
- [ ] Run focused tests; expect missing grid and renderer behavior.
- [ ] Implement grid/snap helpers, renderer updates, and example interactions.
- [ ] Run build, all unit tests, and Chrome E2E; expect PASS.
- [ ] Commit with `feat: release interactive shapes editor`.

## Plan Self-Review

- The four tasks cover all Phase 2 roadmap requirements: shapes, selection, drag, marquee, delete, keyboard controls, grid, snap, runnable example, test coverage, and release metadata.
- Edges, groups, history, plugins, adapters, and large-scene performance remain in later phases.
