# Changelog

## 2.0.0 — 2026-08-31

CanvasKit 2.0.0 turns the V1 canvas engine into a developer-facing foundation
for professional editors.

- Added transform tools: multi-selection bounding boxes, resize constraints,
  persistent rotation, alignment, and distribution with history support.
- Added ordered document layers, visibility/lock controls, grouping, and
  layer-aware interaction and rendering.
- Added diagram ports, connectors, deterministic routing, labels, and
  connector editing.
- Added guides, smart snapping, auto layout, image assets, image nodes, and
  rich-text runs.
- Added deterministic PDF export, accessibility snapshots/DOM mirror, and an
  extensible command, tool, node, and inspector plugin platform.
- Updated all nine public packages to 2.0.0 and introduced PDF and accessibility
  package exports.

Breaking changes: all packages now require the 2.x peer/dependency suite.
Scene V6 remains backward-compatible; node `rotation` is optional.

## 1.0.0 — 2026-08-29

CanvasKit 1.0.0 is the first stable release of the seven-package suite.

- Added framework-independent geometry, versioned scene state, interaction,
  graph editing, history, clipboard, migration, plugin, and spatial-query APIs.
- Added Canvas 2D and SVG renderers with PNG/SVG export and viewport culling.
- Added official Grid, Snap, Keyboard, and Minimap plugins.
- Added React 18+ and Vue 3.3+ lifecycle adapters and accessible canvas hosts.
- Added whiteboard, ERD, architecture, framework, basic, and 10,000-node
  performance examples.
- Established stable root-only package exports, semantic-versioning and scene
  compatibility policies, bundle budgets, deterministic benchmark validation,
  package-consumer smoke tests, and the release publishing runbook.

The Phase 1 through Phase 9 Changesets were consumed into this entry and the
complete [V1 release notes](docs/release-notes-v1.md). They are no longer
pending release inputs.
