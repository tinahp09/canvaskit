# CanvasKit V1 Roadmap Design

**Date:** 2026-08-23  
**Status:** Proposed for review

## Objective

Deliver CanvasKit as a stable, open-source TypeScript engine for interactive visual editors. Every phase must produce a documented, tested, publishable package version that developers can use independently.

## Delivery Model

CanvasKit will use vertical slices rather than isolated technical layers. A phase ships the public API, implementation, tests, documentation, and a real example needed to validate that slice. This prevents the core API from being designed only in the abstract and creates useful releases throughout development.

## Package Boundaries

- `@canvaskit/geometry`: framework-independent mathematical primitives and transformations.
- `@canvaskit/core`: scene state, nodes, edges, selection, viewport, history, serialization, commands, and plugin contracts.
- `@canvaskit/renderer-canvas`: Canvas 2D implementation of the renderer contract.
- `@canvaskit/renderer-svg`: SVG implementation of the renderer contract.
- `@canvaskit/plugins`: official optional plugins.
- `@canvaskit/vue` and `@canvaskit/react`: framework integrations that depend on the public core API.
- `examples/*`: end-user validation and reference implementations; examples must not contain private engine logic.

## Release Phases

### Phase 0 — Foundation (`0.0.x`)

Create the pnpm/Turborepo TypeScript monorepo and its engineering baseline: package boundaries, linting, Vitest, Playwright, Changesets, GitHub Actions, and a minimal package build pipeline. No CanvasKit API is stable in this phase.

### Phase 1 — Foundational Infinite Canvas (`0.1.0`)

Ship the smallest useful embedded canvas:

- `Canvas` instance and scene state.
- A rectangle node with position and size in world coordinates.
- Canvas 2D renderer.
- World-to-screen and screen-to-world coordinate conversion.
- Pointer-driven pan and pointer-centered zoom.
- Basic pointer events.
- JSON serialization/loading for the Phase 1 scene schema.
- A runnable getting-started example and API documentation.

The phase is complete when a developer can install the packages, render rectangles, pan and zoom smoothly, and save/reload the scene.

### Phase 2 — Objects and Selection (`0.2.0`)

Add circle and text nodes, dragging, single and multi-selection, rectangle selection, delete, core keyboard shortcuts, a subtle grid, and grid snapping. Ship an editable shapes example.

### Phase 3 — Graph Editing (`0.3.0`)

Add line, arrow, and Bezier edges; connection handles; drag-to-connect; edge hit testing; groups; and object snapping. Ship a workflow-editor example.

### Phase 4 — History and Persistence (`0.4.0`)

Add command-based undo/redo, transactions, copy/paste/duplicate, stable versioned JSON import/export, scene migrations, and input validation. Ship a durable editing example and migration documentation.

### Phase 5 — Extensibility and Export (`0.5.0`)

Add the plugin API, custom node and edge registries, a renderer interface, SVG rendering, SVG/PNG export, and official Grid, Snap, Keyboard, and Minimap plugins.

### Phase 6 — Framework Integrations (`0.6.0`)

Ship the Vue 3 adapter, Nuxt 4 integration guide, React adapter, reactive lifecycle bindings, and framework-specific examples.

### Phase 7 — Performance at Scale (`0.7.0`)

Add viewport culling, a benchmark-chosen spatial index, optimized hit testing, dirty rendering/batching, and benchmark tooling. Validate a 10,000-node scene.

### Phase 8 — Product Readiness (`0.9.0`)

Complete Whiteboard, ERD, and Architecture examples; VitePress documentation; API reference; Storybook; accessibility QA; contributor guides; release documentation; and RC feedback fixes.

### Phase 9 — Stable V1 (`1.0.0`)

Stabilize the public API, review bundle size, performance and coverage, validate CI and publishing, and release the first stable npm packages.

## Explicitly Deferred Beyond V1

Collaboration, cloud persistence, real-time presence, comments, authentication, billing, PDF/Mermaid export, advanced enterprise capabilities, and paid packages are not V1 requirements. The core must leave extension points for them without implementing them prematurely.

## Quality Gates for Every Release

- Public API types and examples are documented.
- Relevant unit and integration tests pass.
- The release includes a runnable example demonstrating the feature.
- Serialization changes declare a schema version and migration path where needed.
- Core behavior remains framework-agnostic.
- Accessibility and performance impact are considered before a feature is declared complete.

## Phase 1 Validation

Phase 1 must verify coordinate math, viewport pan/zoom behavior, scene serialization/loading, pointer event routing, and rendering of rectangle nodes. An end-to-end test must prove that a user can create the example scene, navigate it, and restore it from JSON.
