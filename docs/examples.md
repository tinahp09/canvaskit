# Examples

Each example is a standalone Vite application that imports CanvasKit only through package-root public APIs. They are both reference implementations and a convenient way to explore editor behavior locally.

## Product editors

| Example | Demonstrates | Run locally |
| --- | --- | --- |
| Whiteboard | Freeform shapes, group selection, import/export, and keyboard controls | `pnpm --filter @canvaskit/whiteboard dev` |
| ERD | Entity nodes, relationship edges, import/export, and labelled actions | `pnpm --filter @canvaskit/erd dev` |
| Architecture | Service and dependency graphs with graph editing controls | `pnpm --filter @canvaskit/architecture dev` |

## Framework adapters

| Example | Demonstrates | Run locally |
| --- | --- | --- |
| React canvas | `CanvasKitProvider`, reactive scene state, Canvas host, SVG/PNG export | `pnpm --filter @canvaskit/react-canvas dev` |
| Vue canvas | Vue provider, composable scene state, Canvas host, SVG/PNG export | `pnpm --filter @canvaskit/vue-canvas dev` |

## Core and performance

| Example | Demonstrates | Run locally |
| --- | --- | --- |
| Basic canvas | The minimal Core plus Canvas 2D setup | `pnpm --filter @canvaskit/basic-canvas dev` |
| Performance canvas | A deterministic 10,000-node scene and visible-node metrics | `pnpm --filter @canvaskit/performance-canvas dev` |

All examples expose labelled canvas surfaces and actions. Exported SVG is shown as text rather than inserted into the document as unsafe markup.
