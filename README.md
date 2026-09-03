# CanvasKit

CanvasKit is a TypeScript-first engine for interactive visual editors on an infinite canvas.

CanvasKit `6.0.0` adds headless editor sessions and a context-aware command
layer to the professional diagram-editor runtime. Package-root exports follow
the documented compatibility policy; start with the [V6 release notes](docs/release-notes-v6.md)
and [editor-session architecture](docs/architecture/v6-editor-session-commands.md).
The project is available under the [MIT License](LICENSE).

## Current capabilities

CanvasKit provides rectangle, circle, text, and asset-backed image scenes; Canvas 2D and SVG rendering; PNG/SVG export; pan/zoom navigation; selection primitives; graph edges and groups; opt-in Grid, Snap, Keyboard, and Minimap plugins; keyboard deletion; undo/redo and clipboard editing; versioned JSON persistence; and viewport-culling support for large Canvas 2D scenes.

## V6 editor sessions and commands

V6 adds host-owned multi-document sessions, canonical dirty-state baselines,
confirmation-aware close behavior, and immutable command-palette data for the
active document. It intentionally leaves persistence, browser tabs, autosave,
auth, and cross-document transactions to the host. Run the reference editor:

```sh
pnpm --filter @canvaskit/editor-session-example dev
```

See the [Editor Session API](docs/api/editor-session.md) and the [V6 release
notes](docs/release-notes-v6.md) for the integration boundary.

## V5 production collaboration adapters

V5 adds `@canvaskit/collaboration-adapters`: a same-origin BroadcastChannel
transport and an injected WebSocket transport with bounded replay and status
reporting. Core remains server-, auth-, CRDT-, and persistence-agnostic. Run:

```sh
pnpm --filter @canvaskit/collaboration-adapters-example dev
```

V4 adds serializable whole-scene collaboration operations, deterministic
Lamport ordering, duplicate and stale-operation rejection, and ephemeral
presence snapshots. The host supplies authentication, persistence, and a
`CollaborationTransport`; CanvasKit does not bundle a network protocol or
backend. Local scene mutations publish operations, while applied remote changes
update subscribers without entering local undo history. Run the two-client
reference implementation with:

```sh
pnpm --filter @canvaskit/collaboration-example dev
```

See the [Core API](docs/api/core.md), [migration guidance](docs/migrations.md),
and [V4 release notes](docs/release-notes-v4.md) for integration details.

## V3 professional diagram runtime

V3 adds nested Scene V7 groups, renderer-neutral tool intents, lasso and group
selection, keyboard nudge, typed inspector properties, command palette data,
and diagram connection policies. Run the glassy reference editor with:

```sh
pnpm --filter @canvaskit/diagram-editor dev
```

## V2.5 rich content & assets

V2.5 adds Scene V6 assets, reusable image nodes, normalized fit/crop metadata,
and structural text runs. Core remains storage-agnostic: applications supply
their own upload, fetch, and cache strategy. See the [rich content guide](docs/guides/rich-content-assets.md), [API reference](docs/api/rich-content-assets.md), and [migration notes](docs/migrations.md).

## V2.6 export & accessibility

V2.6 adds deterministic vector PDF export and a host-owned ARIA mirror for
visible canvas content. See the [guide](docs/guides/export-accessibility.md)
and [API reference](docs/api/export-accessibility.md).

## V2.7 plugin platform

V2.7 adds stable headless registrations for commands, tools, node definitions,
inspector sections, and diagnostics. See the [plugin platform guide](docs/guides/plugin-platform.md).

## V2.3 diagram toolkit

V2.3 adds serializable Scene V4 connectors, derived node ports, deterministic
straight/orthogonal routes, labels, arrows, and history-backed relation
commands. Imports from V1–V3 migrate safely; exported JSON uses `connectors`
rather than legacy `edges`. The basic-canvas example supports pointer and
keyboard-accessible create/select/retarget/delete flows. See the [diagram
toolkit guide](docs/guides/diagram-toolkit.md), [API
reference](docs/api/diagram-toolkit.md), and [migration notes](docs/migrations.md).

## V2.4 smart layout

V2.4 adds Scene V5 ruler guides, deterministic smart snapping, and explicit
horizontal, vertical, and grid auto-layout. Core calculations respect
hidden/locked layers; transient snap feedback is renderer-only and never saved.
See the [smart layout guide](docs/guides/smart-layout.md) and [API reference](docs/api/smart-layout.md).

## V2.2 document & layers

V2.2 adds ordered document layers, durable metadata-only groups, layer
visibility and locking, plus undoable document commands. Scene JSON now uses
schema version 3: imported V1/V2 scenes are migrated losslessly into the
always-present `layer-default` layer. Hidden nodes and their incomplete edges
do not render; hidden or locked nodes cannot be selected or transformed through
Core interaction APIs. See the [document & layers guide](docs/guides/document-layers.md),
[API reference](docs/api/document-layers.md), and [migration notes](docs/migrations.md).

## V2.0 transform tools

V2.0 adds a headless transform pipeline for selection bounds, eight resize
handles, min-size and aspect-ratio constraints, multi-selection alignment and
distribution, and a Canvas overlay. Begin with the [transform tools
guide](docs/guides/transform-tools.md) or [API
reference](docs/api/transform-tools.md). The overlay includes a persistent
rotation handle; rotation is history-backed, serialized with the node, and
rendered by Canvas and SVG.

## V2.1 editor workflow

V2.1 adds a headless workflow layer for ordered multi-selection, world-space
marquee selection, an internal clipboard, cut/paste/duplicate commands, and
DOM keyboard/pointer adapters. Start with the [editor workflow guide](docs/guides/editor-workflow.md)
or the [editor workflow API reference](docs/api/editor-workflow.md). This
milestone does not provide system clipboard access, collaboration, transform
handles, or a prescribed toolbar UI.

For framework applications, install `@canvaskit/react` or `@canvaskit/vue` alongside Core and the Canvas renderer. Each adapter includes a provider, a reactive scene hook/composable, and an accessible canvas host with lifecycle cleanup. See [Getting Started](docs/getting-started.md), [performance guidance](docs/performance.md), the [Nuxt SSR guide](docs/nuxt.md), [plugin guidance](docs/plugins.md), or run either example:

```sh
pnpm --filter @canvaskit/react-canvas dev
pnpm --filter @canvaskit/vue-canvas dev
```

To explore the deterministic 10,000-node Canvas example and its visible-node
metrics, run `pnpm --filter @canvaskit/performance-canvas dev`.
