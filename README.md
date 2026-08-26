# CanvasKit

CanvasKit is a TypeScript-first engine for interactive visual editors on an infinite canvas.

## Current capabilities

CanvasKit provides rectangle, circle, and text scenes; Canvas 2D and SVG rendering; PNG/SVG export; pan/zoom navigation; selection primitives; graph edges and groups; opt-in Grid, Snap, Keyboard, and Minimap plugins; keyboard deletion; undo/redo and clipboard editing; and versioned JSON persistence.

For framework applications, install `@canvaskit/react` or `@canvaskit/vue` alongside Core and the Canvas renderer. Each adapter includes a provider, a reactive scene hook/composable, and an accessible canvas host with lifecycle cleanup. See [Getting Started](docs/getting-started.md), the [Nuxt SSR guide](docs/nuxt.md), [plugin guidance](docs/plugins.md), or run either example:

```sh
pnpm --filter @canvaskit/react-canvas dev
pnpm --filter @canvaskit/vue-canvas dev
```
