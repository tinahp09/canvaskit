# V2.5 Rich Content & Assets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add serializable image assets, crop/fit image nodes, and history-backed rich-text primitives.

**Architecture:** Scene V6 holds validated reusable asset metadata. Pure Core operations own asset/node/text mutation; renderers share deterministic image-box calculations; the example uses public APIs only.

**Tech Stack:** TypeScript, Vitest, Canvas 2D, SVG, Vite, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-31-v2-5-rich-content-assets-design.md`

### Task 1: Scene V6 assets and rich nodes

- [ ] Write failing migration/validation tests for V5→V6 empty assets, image asset references, crop bounds, and rich text runs.
- [ ] Implement V6 model, migration, serialization, image-node constructors, and root exports.
- [ ] Run focused tests/Core typecheck and commit `feat: add rich content schema`.

### Task 2: Pure content controller and CanvasKit history APIs

- [ ] Write failing tests for asset lifecycle, image fit/crop, text-run replacement, undo/redo, and rejection of in-use asset deletion.
- [ ] Implement immutable `ContentController` plus `CanvasKit` asset/image/text wrappers.
- [ ] Run Core suite/typecheck and commit `feat: add rich content commands`.

### Task 3: Canvas/SVG rendering and accessible example

- [ ] Write failing Canvas/SVG tests for image box/crop and escaped rich text; add browser E2E for labelled image/text controls and history.
- [ ] Implement shared image layout, renderer support, SVG safe output, and example controls.
- [ ] Run renderer tests, Vite build, all E2E and commit `feat: add rich content example workflow`.

### Task 4: V2.5 docs and release evidence

- [ ] Update API/guide/architecture/migrations/README/navigation/release notes and checklist.
- [ ] Run full unit/E2E/docs/performance verification and apply release-showcase evidence policy.
- [ ] Commit `docs: document V2.5 rich content assets`.
