# CanvasKit

CanvasKit is a TypeScript-first engine for interactive visual editors on an infinite canvas.

CanvasKit `1.0.0` is the first stable release. Package-root exports follow the
documented `1.x` compatibility policy; start with the [V1 release
notes](docs/release-notes-v1.md) or [upgrade guide](docs/upgrading-to-v1.md).
The project is available under the [MIT License](LICENSE).

## Current capabilities

CanvasKit provides rectangle, circle, and text scenes; Canvas 2D and SVG rendering; PNG/SVG export; pan/zoom navigation; selection primitives; graph edges and groups; opt-in Grid, Snap, Keyboard, and Minimap plugins; keyboard deletion; undo/redo and clipboard editing; versioned JSON persistence; and viewport-culling support for large Canvas 2D scenes.

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
