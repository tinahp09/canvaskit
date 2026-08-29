# CanvasKit 1.0.0

CanvasKit `1.0.0` is the first stable release of the TypeScript-first engine for
interactive visual editors. It promotes the seven package-root APIs to the
stable `1.x` contract described in the [API stability policy](api-stability.md).

## Published packages

| Package | What it provides |
| --- | --- |
| `@canvaskit/geometry` | Framework-independent geometry values and coordinate transforms. |
| `@canvaskit/core` | Scene state, editing, history, persistence, input, spatial queries, and plugin contracts. |
| `@canvaskit/renderer-canvas` | Canvas 2D rendering, viewport culling, scheduling, and PNG export. |
| `@canvaskit/renderer-svg` | SVG rendering and deterministic SVG export. |
| `@canvaskit/plugins` | Opt-in Grid, Snap, Keyboard, and Minimap plugins. |
| `@canvaskit/react` | React 18+ provider, scene subscription, and accessible Canvas host. |
| `@canvaskit/vue` | Vue 3.3+ provider, scene subscription, and accessible Canvas host. |

All packages expose a single documented root entry point. Package `src/`,
`dist/`, and other subpaths are implementation details and are not supported
imports. CanvasKit is released under the repository's MIT license.

## Highlights

- Build rectangle, circle, and text scenes with groups and line, arrow, or
  Bezier edges.
- Pan and zoom an infinite canvas, select and move nodes, connect graph nodes,
  and attach pointer or keyboard input.
- Apply undo/redo transactions, clipboard copy/paste/duplicate operations, and
  versioned scene import/export.
- Render to Canvas 2D or SVG and export PNG or SVG data without forcing a
  download or unsafe DOM insertion.
- Add official plugins through the stable Core plugin lifecycle.
- Connect the same Core instance to React or Vue with lifecycle-safe,
  accessible canvas hosts.
- Cull off-screen nodes and reuse deterministic spatial queries for large
  scenes; the repository includes a 10,000-node example and reproducible
  1k/5k/10k benchmark.

## Compatibility and upgrades

The current scene-document schema is version 2. Version 1 documents are
automatically migrated and then validated; unsupported or malformed documents
fail with typed errors. The npm package version and scene schema version remain
independent.

Applications upgrading from a pre-1.0 build should align all installed
CanvasKit packages on the `1.x` line, replace package-subpath imports with root
imports, and review framework peer requirements. See [Upgrading to
V1](upgrading-to-v1.md) for the complete checklist.

## Release evidence

The stable release gate audits package versions, internal ranges, root exports,
private imports, and required public documentation. The release pipeline also
runs the complete typecheck and unit suites, documentation and Storybook
builds, all example builds, bundle budgets, deterministic performance checks,
browser tests, and consumer-safe pnpm package tarball inspection.

Release owners must complete the [release checklist](release-checklist.md) and
follow the [publishing runbook](publishing.md) before creating a tag or
publishing to npm.

## Intentional V1 boundaries

CanvasKit `1.0.0` is a client-side editor engine, not a hosted collaboration
product. Real-time collaboration, cloud persistence, authentication, billing,
comments, PDF export, Mermaid export, and server-side canvas rendering are not
included. React and Vue adapters remain intentionally thin; applications own
toolbars, persistence UI, downloads, authorization, and product-specific state.
