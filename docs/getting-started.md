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

Use `canvas.toJSON()` to persist a scene and `canvas.load(json)` to restore it. Current support includes rectangle, circle, and text nodes; viewport navigation; selection; keyboard deletion; grid snapping; graph groups; and line, arrow, or Bezier edges. In the workflow example, select a node and drag from its white connection handle to another node to create an arrow. History and plugins arrive in later phases.
