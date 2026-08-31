# V2.7 Plugin Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide stable headless extension registrations, lifecycle, and diagnostics.

**Architecture:** A Core `ExtensionRegistry` is owned by `CanvasKit`; trusted
plugins receive CanvasKit and register data-only definitions. Host UIs consume
snapshots/diagnostics rather than plugin internals.

**Tech Stack:** TypeScript, Vitest, Playwright, VitePress.

**Spec:** `docs/superpowers/specs/2026-08-31-v2-7-plugin-platform-design.md`

### Task 1: Extension registry

**Files:** `packages/core/src/extensions.ts`, `packages/core/src/index.ts`,
`packages/core/test/extensions.test.ts`.

- [ ] Write failing tests for command/node/inspector uniqueness and cleanup.
- [ ] Implement typed definitions, registration cleanup, frozen snapshots, and diagnostics.
- [ ] Run `node_modules/.bin/vitest run packages/core/test/extensions.test.ts`.
- [ ] Commit `feat: add extension registry`.

### Task 2: CanvasKit command and tool lifecycle

**Files:** `packages/core/src/canvas-kit.ts`, `packages/core/test/extensions.test.ts`.

- [ ] Write failing tests for command failure diagnostics and ordered tool transitions.
- [ ] Delegate public methods to the registry; deactivate active tools at disposal.
- [ ] Run focused tests and `node_modules/.bin/vitest run`.
- [ ] Commit `feat: add extension commands and tools`.

### Task 3: Official plugin factory and example

**Files:** `packages/plugins/src/command.ts`, `packages/plugins/src/index.ts`,
`packages/plugins/test/plugins.test.ts`, `examples/basic-canvas/src/main.ts`,
`examples/basic-canvas/e2e/canvas.spec.ts`.

- [ ] Write failing plugin/E2E tests.
- [ ] Implement a trusted command plugin, labelled controls, and diagnostics readout.
- [ ] Verify focused E2E and full unit suite.
- [ ] Commit `feat: add plugin platform example workflow`.

### Task 4: Release candidate

**Files:** V2.7 API/guide/architecture/release-note/asset-manifest docs,
VitePress navigation, README, release checklist.

- [ ] Document API boundaries and trade-offs.
- [ ] Run unit suite, docs build, and E2E.
- [ ] Commit `docs: document V2.7 plugin platform`.
