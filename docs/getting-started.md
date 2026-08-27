# Getting Started

Install the core and Canvas renderer packages, create a scene, then mount a renderer on a canvas element.

```ts
import { CanvasKit, addRectangle, createScene, attachPointerInput } from '@canvaskit/core'
import { CanvasRenderer, exportPNG } from '@canvaskit/renderer-canvas'
import { renderSVG } from '@canvaskit/renderer-svg'
import { createGridPlugin, createSnapPlugin } from '@canvaskit/plugins'

const scene = addRectangle(createScene(), {
  id: 'welcome', position: { x: 120, y: 80 }, size: { width: 240, height: 120 }, fill: '#7C7FF2',
})
const canvas = new CanvasKit({ scene })
const grid = createGridPlugin({ size: 20 })
const snap = createSnapPlugin({ gridSize: 20 })
canvas.use(grid)
canvas.use(snap)
const renderer = new CanvasRenderer(document.querySelector('canvas')!)
renderer.render(canvas.getScene())
attachPointerInput(document.querySelector('canvas')!, canvas)

const svg = renderSVG(canvas.getScene())
const pngDataUrl = exportPNG(document.querySelector('canvas')!)
```

`renderSVG()` returns a serialized SVG string and `exportPNG()` returns a PNG data URL; neither function initiates a browser download. Display these values as text or use your own download flow. The example uses a read-only text area so SVG is never inserted into the page as HTML.

The Grid and Snap plugins are opt-in factories. `grid.config` provides the display configuration for your renderer or UI, while `snap.snap(point)` applies the configured grid size. See [Plugins](plugins.md) for lifecycle and trust-boundary guidance.

## Durable editing and persistence

The editing APIs work independently of keyboard input, so toolbars and other accessible controls can offer the same workflow:

```ts
import { exportScene, importScene } from '@canvaskit/core'

canvas.copy()
canvas.paste()
canvas.duplicate()
canvas.undo()
canvas.redo()

const json = exportScene(canvas.getScene())
const restored = importScene(json)
```

`exportScene()` creates the current version 2 JSON payload. `importScene(json)` validates it before returning the scene, and automatically migrates version 1 payloads by adding empty `edges` and `groups` collections. Invalid or unsupported payloads throw an error; keep the current scene until import succeeds, then call `canvas.setScene(restored)`, which clears history so undo and redo cannot cross the import boundary.

`setScene(scene)` is a direct replacement and clears undo/redo history. For user edits that should participate in history, call `canvas.execute({ label, execute, undo })`; use `beginTransaction(label)` and `commitTransaction()` to make several commands undo together.

Viewport navigation remains outside undo history, but panning or zooming after an undo clears redo so it cannot replace the newer viewport state.

Current support includes rectangle, circle, and text nodes; viewport navigation; selection; keyboard deletion; grid snapping; graph groups; and line, arrow, or Bezier edges. In the workflow example, select a node and drag from its white connection handle to another node to create an arrow.

## Large Canvas scenes

`CanvasRenderer` applies viewport culling automatically: during each render it
draws only nodes whose world bounds intersect the current canvas viewport. The
render result includes `visibleNodeCount` if surrounding UI needs to display the
current draw-set size:

```ts
const result = renderer.render(canvas.getScene())
console.log(result.visibleNodeCount)
```

For repeated application-side spatial queries, create a `SpatialIndex` from the
current scene nodes and pass it to `hitTestNode` or `nodesInRect`. The index is a
snapshot, so create a new one when node bounds change. Queries preserve scene
order, including topmost hit-test selection.

```ts
import { SpatialIndex, hitTestNode } from '@canvaskit/core'

const scene = canvas.getScene()
const index = new SpatialIndex(scene.nodes)
const node = hitTestNode(scene, { x: 180, y: 120 }, index)
```

See [Performance at scale](performance.md) for culling and edge semantics,
benchmark reproduction, and the runnable 10,000-node example.

## React and Vue

The framework adapters keep `CanvasKit` as the source of truth while connecting it to framework lifecycle and reactive UI updates. Install the adapter with Core and the Canvas renderer:

```sh
# React 18+
pnpm add @canvaskit/core @canvaskit/renderer-canvas @canvaskit/react react react-dom

# Vue 3.3+
pnpm add @canvaskit/core @canvaskit/renderer-canvas @canvaskit/vue vue
```

In React, provide an instance and render the canvas host. `useCanvasScene()` redraws surrounding UI when Core publishes a new scene snapshot, and `CanvasKitCanvas` attaches and removes pointer listeners with the component lifecycle.

```tsx
import { useState } from 'react'
import { CanvasKit, addRectangle, createScene } from '@canvaskit/core'
import { CanvasKitCanvas, CanvasKitProvider, useCanvasScene } from '@canvaskit/react'

function Editor() {
  const scene = useCanvasScene()
  return <>
    <p>Nodes: {scene.nodes.length}</p>
    <CanvasKitCanvas width={960} height={540} />
  </>
}

export function App() {
  const [canvas] = useState(() => new CanvasKit({
    scene: addRectangle(createScene(), {
      id: 'welcome', position: { x: 120, y: 80 }, size: { width: 240, height: 120 }, fill: '#7C7FF2',
    }),
  }))
  return <CanvasKitProvider canvas={canvas}><Editor /></CanvasKitProvider>
}
```

Vue uses the same public concepts. `useCanvasScene()` returns a readonly shallow ref, so read its value in script or let Vue unwrap it in a template.

```vue
<script setup lang="ts">
import { CanvasKit, addRectangle, createScene } from '@canvaskit/core'
import { CanvasKitCanvas, CanvasKitProvider, useCanvasScene } from '@canvaskit/vue'

const canvas = new CanvasKit({
  scene: addRectangle(createScene(), {
    id: 'welcome', position: { x: 120, y: 80 }, size: { width: 240, height: 120 }, fill: '#7C7FF2',
  }),
})
</script>

<template>
  <CanvasKitProvider :canvas="canvas">
    <Editor />
  </CanvasKitProvider>
</template>
```

```vue
<!-- Editor.vue -->
<script setup lang="ts">
import { CanvasKitCanvas, useCanvasScene } from '@canvaskit/vue'

const scene = useCanvasScene()
</script>

<template>
  <p>Nodes: {{ scene.nodes.length }}</p>
  <CanvasKitCanvas :width="960" :height="540" />
</template>
```

Both hosts clean up their adapter subscriptions and DOM input listeners when unmounted. A provider disposes only an instance that it created itself; callers retain ownership of an instance passed through `canvas`. See the runnable [React example](../examples/react-canvas) and [Vue example](../examples/vue-canvas). For Nuxt, keep the canvas host client-only; see [Nuxt and SSR](nuxt.md).
