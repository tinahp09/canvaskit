# CanvasKit V2.7 Plugin Platform Design

## Goal

Stabilize CanvasKit extension points so hosts can install trusted plugins that
register commands, tools, node definitions, inspector sections, and diagnostics
without coupling extensions to a particular renderer or toolbar.

## Scope

Core gains `ExtensionRegistry`, owned by every `CanvasKit` instance. It exposes
immutable snapshots and typed registration methods for:

- `CanvasCommandDefinition`: ID, label, and `run(canvas)` action.
- `CanvasToolDefinition`: ID, label, optional keyboard shortcut, and activate /
  deactivate hooks.
- `CanvasNodeDefinition`: ID, label, and inspector metadata for host UIs.
- `InspectorSection`: ID, label, optional node type filter, and data-only fields.

`CanvasKit` adds `registerCommand`, `executeRegisteredCommand`,
`registerTool`, `activateTool`, `registerNodeDefinition`, `registerInspector`,
and `getDiagnostics`. `CanvasPlugin.install` receives this runtime naturally
through its existing CanvasKit argument and still cleans up in reverse order.

`@canvaskit/plugins` gains a small `createCommandPlugin` example factory. The
basic-canvas example exposes a plugin-provided command and a diagnostics panel
through native labelled controls.

## Invariants

- IDs are unique inside each extension kind; duplicate registration throws.
- Every registration returns an idempotent cleanup function that removes only
  its own definition.
- Active-tool replacement deactivates the previous tool before activating the
  next; disposal deactivates the active tool before plugin cleanups.
- Command actions are host-trusted code; failures are recorded in diagnostics
  and rethrown without mutating Core implicitly.
- Snapshots are copied and frozen at the outer level so hosts cannot mutate
  registry state.

## Diagnostics

`CanvasDiagnostics` reports installed plugin IDs, active tool ID, registered
definition IDs by kind, and the latest command failure message. It is a
read-only report for inspector/devtools UIs and contains no DOM or renderer
references.

## Non-goals

No sandboxing, remote marketplace, dynamic module loader, declarative node
renderer protocol, or mandated inspector UI. Plugins remain trusted code loaded
by the host; node rendering remains an application/renderer responsibility.

## Tests and acceptance

- Unit tests cover unique registration, cleanup, command execution/failure,
  tool lifecycle order, immutable diagnostics, and plugin disposal.
- Plugin-package tests cover the public factory through `canvas.use`.
- Basic-canvas E2E executes an extension command and reads diagnostics.
- Unit suite, docs build, focused E2E, release notes, architecture notes, and
  media manifest pass before V2.7 freeze.
