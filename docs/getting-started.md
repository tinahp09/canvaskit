# Getting Started

Install the core and Canvas renderer packages, create a scene, then mount a renderer on a canvas element.

```ts
import { CanvasKit, addRectangle, createScene, attachPointerInput } from '@canvaskit/core'
import { CanvasRenderer } from '@canvaskit/renderer-canvas'

const scene = addRectangle(createScene(), {
  id: 'welcome', position: { x: 120, y: 80 }, size: { width: 240, height: 120 }, fill: '#7C7FF2',
})
const canvas = new CanvasKit({ scene })
const renderer = new CanvasRenderer(document.querySelector('canvas')!)
renderer.render(canvas.getScene())
attachPointerInput(document.querySelector('canvas')!, canvas)
```

Use `canvas.toJSON()` to persist a scene and `canvas.load(json)` to restore it. Phase 1 supports rectangle nodes and canvas navigation; selection, edges, history, and plugins arrive in later phases.
