# Canvas renderer API

`@canvaskit/renderer-canvas` turns a Core scene into a Canvas 2D surface.

```ts
import { CanvasRenderer, exportPNG, RenderScheduler } from '@canvaskit/renderer-canvas'
```

## `CanvasRenderer`

Create a renderer with a canvas element, then call `render(scene, selection?, overlay?, selectedConnectorId?)` whenever Core publishes a new scene:

```ts
const renderer = new CanvasRenderer(element)
const result = renderer.render(canvas.getScene(), canvas.selection.get(), undefined, canvas.getSelectedConnector())
console.log(result.visibleNodeCount)
```

The renderer accounts for the scene viewport and applies viewport culling. Its
result exposes the count of nodes drawn in the active viewport. V2.3 resolves
and paints visible connectors before nodes, including deterministic route
segments, directional arrowheads, labels, selected state, and ports for
interactive endpoints. See the [diagram toolkit API](/api/diagram-toolkit) for
the relation contract and the [performance guide](/performance) for visibility
semantics.

## `exportPNG(element)`

Returns a PNG data URL for a canvas element. It does not initiate a download, letting the application decide how to present or save the result.

## `RenderScheduler`

`RenderScheduler` batches invalidations into an animation frame. Call `schedule(render)` for repeat updates and `dispose()` during teardown to cancel pending work. React and Vue canvas hosts already apply this lifecycle behavior.
