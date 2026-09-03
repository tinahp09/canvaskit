# Changelog

## 6.0.0 — 2026-09-03

CanvasKit 6.0.0 adds headless multi-document editor sessions and a deterministic
command/keybinding foundation for professional hosts. It includes canonical
dirty baselines, confirmation-aware close, active-document command contexts,
shortcut normalization, and a browser-tested glassy reference editor.

Breaking changes: all public packages now use the 6.x suite. Scene V7 is
unchanged; V6 does not add storage, browser-tab control, autosave, a backend,
CRDT, or cross-document transactions.

## 5.0.0 — 2026-09-02

CanvasKit 5.0.0 makes V4 collaboration usable in browser hosts through a
separate adapter package. It adds BroadcastChannel and injected WebSocket
transports, versioned envelope validation, presence relay, status lifecycle,
bounded FIFO replay, overflow diagnostics, and a browser-tested two-peer demo.

Breaking changes: all public packages now use the 5.x suite. Scene V7 is
unchanged; V5 does not add a backend, auth, persistence, CRDT, or encryption.

## 4.0.0 — 2026-09-02

CanvasKit 4.0.0 provides a framework-neutral collaboration foundation for
hosts that need deterministic scene synchronization without a bundled backend.

- Added serializable `CollaborationOperation` envelopes and canonical incoming
  Scene V7 validation.
- Added `CollaborationRuntime` with Lamport clocks, duplicate/stale rejection,
  deterministic ordering ties, and isolated `PresenceSnapshot` state.
- Added optional CanvasKit collaboration configuration, local operation
  capture, remote scene application, and host-injected transport lifecycle.
- Added a glassy two-client reference app with E2E coverage for sync,
  reconnect replay, presence, and out-of-order delivery.

Breaking changes: all public packages now use the 4.x suite. Scene V7 remains
the canonical serialized format; no scene-document migration is required.

## 3.0.0 — 2026-09-01

CanvasKit 3.0.0 is a headless runtime for professional diagram editors.

- Added Scene V7 nested hierarchy, inherited group state, group-aware transforms,
  lasso selection, group movement, and keyboard nudge.
- Added Tool Runtime, Inspector Runtime, command-surface snapshots, and typed
  diagram connection policies.
- Added the glassy `examples/diagram-editor` reference editor with browser E2E.

Breaking changes: all public packages now use the 3.x suite. `importScene`
migrates supported V1–V6 scenes; exports are canonical Scene V7.

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
