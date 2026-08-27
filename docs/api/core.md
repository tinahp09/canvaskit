# Core API

`@canvaskit/core` owns scenes and editor behavior. It does not import a framework or renderer.

```ts
import { CanvasKit, addRectangle, createScene } from '@canvaskit/core'
```

## Scene model

- `CanvasScene` is a versioned document with `nodes`, `edges`, `groups`, `viewport`, and `metadata`.
- `CanvasNode` is a rectangle, circle, or text node. Use `RectangleNode`, `CircleNode`, and `TextNode` for narrower types.
- `CanvasEdge` connects node IDs as a `line`, `arrow`, or `bezier`; `CanvasGroup` collects node IDs.
- `SCENE_VERSION` is the current document version.

Create and change immutable scene values with `createScene`, `addRectangle`, `addCircle`, `addText`, `addEdge`, `addGroup`, `connectNodes`, `removeEdge`, and `translateNode`.

## `CanvasKit`

`new CanvasKit({ scene? })` is the stateful editor controller. Its main methods are:

- `getScene()` and `setScene(scene)` to read or replace the current scene. Replacing a scene clears undo and redo history.
- `execute(command)`, `undo()`, `redo()`, `beginTransaction(label)`, and `commitTransaction()` for history-aware changes.
- `copy()`, `paste(offset?)`, `duplicate()`, and `deleteSelection()` for editing.
- `onPointer(listener)` and `subscribe(listener)` for pointer events and scene snapshots.
- `use(plugin)` and `dispose()` for plugin lifecycle.

The public `viewport` controller, `selection` controller, `nodes` registry, and `edges` registry are available as instance properties.

## Input and interaction

- `attachPointerInput(element, canvas)` wires an `HTMLElement` to Core pointer events and returns a cleanup function.
- `attachKeyboardInput(element, canvas)` adds select-all and delete/backspace shortcuts; it also returns cleanup.
- `hitTestNode`, `hitTestEdge`, `nodesInRect`, `nodeCenter`, `nodeBounds`, and `moveNodes` help build custom interactions.
- `snapPointToGrid(point, gridSize)` snaps a point to a positive grid size.
- `SpatialIndex(nodes)` creates a read-only snapshot index. Call `query(rect)` for nodes in original scene order; recreate it whenever bounds change.

## Persistence and extensibility

`exportScene`, `importScene`, `serializeScene`, and `loadScene` work with versioned JSON. `migrateScene` migrates supported older documents. Invalid input throws `InvalidSceneError`; unknown versions throw `UnsupportedSceneVersionError`.

Implement `CanvasPlugin` to extend a controller with `install(canvas)`, optionally returning a cleanup function. `Renderer` is the minimal `render(scene)` contract for custom renderers. See [Plugins](/plugins) for lifecycle and trust guidance.
