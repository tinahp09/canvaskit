# Core API

`@canvaskit/core` owns versioned scenes, editor state, input plumbing, persistence, history, and extension contracts. It is framework- and renderer-agnostic.

```ts
import { CanvasKit, addRectangle, createScene } from '@canvaskit/core'
```

This page is the curated inventory of every public export from the package root. Types are available to TypeScript consumers and runtime values are available to JavaScript consumers.

## Package identity and scene model

- `PACKAGE_NAME` is the package identifier and `SCENE_VERSION` is the current scene-document version.
- `CanvasScene` is a versioned document with `nodes`, `edges`, `groups`, `viewport`, and `metadata`.
- `CanvasNode` is the union of `RectangleNode`, `CircleNode`, and `TextNode`.
- `CanvasEdge` connects node IDs as a `line`, `arrow`, or `bezier`; `CanvasGroup` collects node IDs.
- `CreateRectangleInput`, `CreateCircleInput`, `CreateTextInput`, `CreateEdgeInput`, and `CreateGroupInput` are the corresponding immutable-scene creation inputs.

Create and transform immutable scene values with:

- `createScene()`;
- `addRectangle`, `addCircle`, `addText`, `addEdge`, and `addGroup`;
- `connectNodes(scene, sourceId, targetId, type?)` and `removeEdge(scene, edgeId)`; and
- `translateNode(node, id, offset)`.

## `CanvasKit` controller

`new CanvasKit(options?)` owns one editable scene. `CanvasKitOptions` accepts an optional initial `scene`.

- `getScene()` returns the current scene with its current viewport transform.
- `setScene(scene)` replaces the scene, retains only valid selections, and clears history.
- `execute(command)`, `undo()`, and `redo()` apply `SceneCommand` values through history.
- `beginTransaction(label)` and `commitTransaction()` group history commands; `clearHistory()` removes undo and redo state.
- `copy()`, `paste(offset?)`, `duplicate()`, and `deleteSelection()` implement clipboard editing.
- `toJSON()` serializes the current scene and `load(json)` validates and replaces it.
- `createPointerEvent(screen, type)` turns a screen point into a `CanvasPointerEvent`, including its world point, and delivers it to pointer listeners.
- `onPointer(listener)` subscribes to `CanvasPointerEvent` values; `subscribe(listener)` receives each scene snapshot as a `SceneListener`. Both return cleanup functions.
- `use(plugin)` installs a `CanvasPlugin`; `dispose()` runs installed plugin cleanups.

The instance exposes four public controllers: `viewport`, `selection`, `nodes`, and `edges`.

### Pointer and scene subscription types

- `CanvasPointerEventType` is `'pointerdown' | 'pointermove' | 'pointerup'`.
- `CanvasPointerEvent` contains `type`, screen-space `screen`, and transformed world-space `world` points.
- `SceneListener` receives an immutable `CanvasScene` snapshot after observable scene or selection changes.

## Controllers, history, and registries

- `ViewportController` reads and changes the scene transform with `getTransform`, `setTransform`, `pan`, and `zoomAt`.
- `SelectionController` manages node IDs with `select`, `selectMultiple`, `clear`, `get`, and `selectAll`; selections are retained only for nodes that still exist.
- `HistoryController` is the lower-level undo/redo implementation. `SceneCommand` supplies a label plus `execute` and `undo` scene transformations.
- `NodeRegistry` and `EdgeRegistry` register named node and edge definitions. `NamedDefinition` is the minimum registry shape: an `id` string.

## Clipboard and persistence

- `copySelection(scene, ids)` returns a `SceneClipboard` containing copied nodes, edges, and groups.
- `pasteSelection(scene, clipboard, offset?)` returns `PasteSelectionResult`, including the resulting scene and copied IDs.
- `exportScene` and its alias `serializeScene` convert a scene to versioned JSON.
- `importScene` and its alias `loadScene` validate JSON and return a scene.
- `migrateScene(value)` migrates supported older scene data.
- `InvalidSceneError` describes invalid scene data. `UnsupportedSceneVersionError` extends it for unrecognised document versions.

## Input and interaction helpers

- `attachPointerInput(element, canvas)` forwards DOM pointer events to a `CanvasKit`; `attachKeyboardInput(element, canvas)` adds select-all and delete/backspace shortcuts. Each returns a cleanup function.
- `hitTestNode(scene, point, index?)`, `hitTestEdge(scene, point, tolerance?)`, `nodesInRect(scene, rect, index?)`, and `moveNodes(scene, ids, delta)` support custom editor interaction.
- `nodeCenter(node)` and `nodeBounds(node)` derive geometry for a node.
- `snapPointToGrid(point, gridSize)` returns the nearest grid point for a positive grid size.
- `SpatialIndex(nodes)` creates a read-only node index. Its `query(rect)` method returns candidates in original scene order; recreate it after node bounds change.

## Plugins and renderers

`CanvasPlugin` has an `id` and `install(canvas)` method; installation may return a cleanup function. `Renderer` is the minimal renderer contract with `render(scene)`. See [Plugins](/plugins) for lifecycle and trust guidance.
