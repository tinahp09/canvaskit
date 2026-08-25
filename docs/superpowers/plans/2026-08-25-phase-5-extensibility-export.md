# Phase 5 Extensibility and Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Release `0.5.0` with renderer and plugin extension contracts, custom node/edge registries, SVG/PNG export, and official Grid, Snap, Keyboard, and Minimap plugins.

**Architecture:** Core owns typed registry and plugin lifecycle contracts and does not import concrete renderers. `@canvaskit/renderer-svg` serializes a validated `CanvasScene` to sanitized SVG; Canvas export produces PNG from an existing canvas without DOM assumptions in Core. `@canvaskit/plugins` supplies opt-in plugins that only use public Core APIs.

**Tech Stack:** TypeScript strict mode, pnpm workspaces, Vitest, Playwright system Chrome, Canvas 2D, SVG strings, Vite, Changesets.

**Spec:** `docs/superpowers/specs/2026-08-23-canvaskit-v1-roadmap-design.md`, `docs/prd.md`

## Global Constraints

- Core remains framework- and renderer-agnostic; plugin code is never executed from imported scene JSON.
- SVG output must escape text and attribute values; no untrusted string may become executable markup.
- Custom node/edge registration is explicit and collision-safe.
- SVG and PNG export are deterministic for a given scene and viewport.
- Every public API receives red/green tests and the example demonstrates export and at least one official plugin.

---

### Task 1: Core extension contracts and registries

**Files:** Create `packages/core/src/plugin.ts`, `packages/core/src/registry.ts`; modify `packages/core/src/canvas-kit.ts`, `packages/core/src/index.ts`; test `packages/core/test/plugin.test.ts`.

**Interfaces:** Export `CanvasPlugin { id: string; install(canvas: CanvasKit): void | (() => void) }`, `Renderer { render(scene: CanvasScene): void }`, `NodeRegistry`, and `EdgeRegistry`. `CanvasKit.use(plugin)` installs once and `dispose()` runs cleanup in reverse order.

- [x] Write failing tests for duplicate-safe registration, plugin cleanup, and double installation rejection.
- [x] Run `pnpm exec vitest run packages/core/test/plugin.test.ts` and observe missing APIs.
- [x] Implement minimal contracts, registries, and lifecycle methods without renderer imports.
- [x] Run focused tests, all Core tests, and Core typecheck.
- [x] Commit `feat: add extension registries and plugin lifecycle`.

### Task 2: SVG renderer package and SVG export

**Files:** Create `packages/renderer-svg/package.json`, `packages/renderer-svg/tsconfig.json`, `packages/renderer-svg/src/svg-renderer.ts`, `packages/renderer-svg/src/index.ts`, `packages/renderer-svg/test/svg-renderer.test.ts`; modify workspace config if required.

**Interfaces:** Export `renderSVG(scene: CanvasScene): string` and `SvgRenderer implements Renderer`; cover rectangle, circle, text, line, arrow, and Bezier edges. Text and XML attributes are escaped. The output has the scene viewport dimensions and an SVG marker for arrows.

- [x] Write failing tests for all primitive types and hostile text such as `<script>`.
- [x] Run focused SVG tests and observe missing package/API.
- [x] Implement deterministic escaped SVG serialization and renderer contract conformance.
- [x] Run focused tests, SVG typecheck, and workspace unit tests.
- [x] Commit `feat: add SVG renderer and export`.

### Task 3: Canvas PNG export

**Files:** Create `packages/renderer-canvas/src/export.ts`; modify `packages/renderer-canvas/src/index.ts`; test `packages/renderer-canvas/test/export.test.ts`.

**Interfaces:** Export `exportPNG(canvas: HTMLCanvasElement): string`; it returns the canvas `image/png` data URL and throws a clear error if the canvas cannot export. No filesystem write or browser download occurs.

- [x] Write a failing mocked-canvas test for PNG data URL export and export failure.
- [x] Run focused test and observe missing API.
- [x] Implement minimal Canvas-only export helper and public export.
- [x] Run renderer tests and typecheck.
- [x] Commit `feat: add PNG export helper`.

### Task 4: Official opt-in plugins

**Files:** Create `packages/plugins/package.json`, `packages/plugins/tsconfig.json`, `packages/plugins/src/{grid,snap,keyboard,minimap,index}.ts`, `packages/plugins/test/plugins.test.ts`.

**Interfaces:** Export `createGridPlugin`, `createSnapPlugin`, `createKeyboardPlugin`, and `createMinimapPlugin`, each returning `CanvasPlugin`. Grid exposes visual configuration, Snap exposes grid-size configuration, Keyboard installs/removes keyboard bindings through a supplied HTMLElement, and Minimap derives a readonly scene summary without a renderer dependency.

- [x] Write failing lifecycle/configuration tests for all four factories.
- [x] Run focused plugin tests and observe missing package/API.
- [x] Implement the four factories using public Core APIs only and test cleanup.
- [x] Run plugin tests, all workspace unit tests, and typechecks.
- [x] Commit `feat: add official editor plugins`.

### Task 5: Export example, docs, release metadata, and browser validation

**Files:** Modify `examples/basic-canvas/src/main.ts`, `examples/basic-canvas/e2e/canvas.spec.ts`, `README.md`, `docs/getting-started.md`; create `docs/plugins.md`, `.changeset/phase-five.md`.

**Interfaces:** Example imports only public APIs from Core, Canvas renderer, SVG renderer, and plugins. It exposes Export SVG and Export PNG controls, shows a safe preview/status result, and installs Grid/Snap through factories.

- [x] Write failing E2E test that exports SVG (assert escaped output), exports PNG (assert data URL), and renders with plugin controls present.
- [x] Run focused E2E and observe missing controls.
- [x] Wire example controls, docs, plugin trust boundary, and changeset; show errors accessibly.
- [x] Run full verification: all package typechecks, Vite build, Vitest, and Chrome Playwright.
- [x] Commit `feat: release extensibility and export`.

## Plan Self-Review

- Task 1 covers the plugin API, custom node/edge registries, and renderer interface.
- Task 2 covers SVG rendering plus secure SVG export.
- Task 3 covers PNG export.
- Task 4 covers the four official plugins.
- Task 5 covers a runnable example, docs, release metadata, and end-to-end validation.
