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
