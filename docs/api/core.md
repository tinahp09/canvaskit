# Core API

`@canvaskit/core` owns versioned scenes, editor state, input plumbing, persistence, history, and extension contracts. It is framework- and renderer-agnostic.

```ts
import { CanvasKit, addRectangle, createScene } from '@canvaskit/core'
```

This page is the curated inventory of every public export from the package root. Types are available to TypeScript consumers and runtime values are available to JavaScript consumers.

## Package identity and scene model

- `PACKAGE_NAME` is the package identifier and `SCENE_VERSION` is the current scene-document version.
- `CanvasScene` is a versioned document with ordered `layers`, `nodes`,
  `connectors`, `groups`, `viewport`, and `metadata`. The current
  `SCENE_VERSION` is `7`.
- `CanvasNode` is the union of `RectangleNode`, `CircleNode`, and `TextNode`.
- Every `CanvasNode` has a `layerId`. `CanvasLayer` has `id`, `name`, `visible`,
  and `locked`; `DEFAULT_LAYER_ID` is `'layer-default'` for Core-created scenes.
- `CanvasConnector` connects named derived ports with `straight` or
  `orthogonal` routing. `CanvasGroup` owns direct leaf `nodeIds`, optional
  `parentId`, and `visible`/`locked` state; group state is inherited by every
  descendant. `CanvasEdge` remains a legacy migration type.
- `CreateRectangleInput`, `CreateCircleInput`, `CreateTextInput`,
  `CreateConnectorInput`, `CreateEdgeInput`, and `CreateGroupInput` are the
  corresponding immutable-scene creation inputs.

Create and transform immutable scene values with:

- `createScene()`;
- `addRectangle`, `addCircle`, `addText`, `addConnector`, `addEdge`, and `addGroup`;
- `connectNodes(scene, sourceId, targetId, type?)` and `removeEdge(scene, edgeId)`; and
- `translateNode(node, id, offset)`.

## `CanvasKit` controller

`new CanvasKit(options?)` owns one editable scene. `CanvasKitOptions` accepts an optional initial `scene`.

- `getScene()` returns the current scene with its current viewport transform.
- `setScene(scene)` replaces the scene, retains only valid selections, and clears history.
- `execute(command)`, `undo()`, and `redo()` apply `SceneCommand` values through history.
- `beginTransaction(label)` and `commitTransaction()` group history commands; `clearHistory()` removes undo and redo state.
- `copy()`, `cut()`, `paste(offset?)`, `duplicate()`, `deleteSelection()`,
  `selectInRect(rect, options?)`, and `executeCommand(command)` implement the
  editor workflow. See the dedicated [editor workflow API](/api/editor-workflow)
  for selection modes, marquee semantics, clipboard constraints, and commands.
- `resizeSelection(handle, point, constraints?)`, `alignSelection(axis)`, and
  `distributeSelection(axis)` apply history-backed transforms to the current
  selection. `transform` is the shared `TransformController`; see the
  dedicated [transform tools API](/api/transform-tools) for handle positions,
  constraints, and persistent node rotation.
- `createLayer(layer)`, `moveSelectionToLayer(layerId)`,
  `setLayerVisibility(layerId, visible)` (and the `setLayerVisible` alias),
  `setLayerLocked(layerId, locked)`, `reorderLayer(layerId, targetIndex)`, and
  `reorderSelection(targetIndex)` apply one undoable document mutation when
  they change the scene. `groupSelection()` and `ungroupSelection()` are also
  history-backed. See [Document & layers](/api/document-layers) for their
  validation and interaction contracts.
- `createConnector(input)`, `reconnectConnector(id, endpoint, nodeId, portId)`,
  `removeConnector(id)`, `selectConnector(id)`, and `getSelectedConnector()`
  provide history-backed relation editing. See [Diagram toolkit](/api/diagram-toolkit).
- `toJSON()` serializes the current scene and `load(json)` validates and replaces it.
- `createPointerEvent(screen, type)` turns a screen point into a `CanvasPointerEvent`, including its world point, and delivers it to pointer listeners.
- `onPointer(listener)` subscribes to `CanvasPointerEvent` values; `subscribe(listener)` receives each scene snapshot as a `SceneListener`. Both return cleanup functions.
- `use(plugin)` installs a `CanvasPlugin`; `dispose()` runs installed plugin cleanups.

The instance exposes five public controllers: `viewport`, `selection`,
`transform`, `nodes`, and `edges`.

### Pointer and scene subscription types

- `CanvasPointerEventType` is `'pointerdown' | 'pointermove' | 'pointerup' |
  'pointercancel'`.
- `CanvasPointerEvent` contains `type`, screen-space `screen`, and transformed world-space `world` points.
- `SceneListener` receives an immutable `CanvasScene` snapshot after observable scene or selection changes.

## Controllers, history, and registries

- `ViewportController` reads and changes the scene transform with `getTransform`, `panBy`, `setZoom`, `zoomAt`, and `reset`.
- `SelectionController` manages node and group IDs with `select`,
  `selectMultiple`, `set`, `add`, `remove`, `toggle`, `clear`, `get`, and
  `selectAll`; group IDs remain compact until an operation resolves their
  descendant leaves. Selections are retained only while interactive.
  `SelectionMode` describes the four explicit selection mutations.
- `HistoryController` is the lower-level undo/redo implementation. `SceneCommand` supplies a label plus `execute` and `undo` scene transformations.
- `NodeRegistry` and `EdgeRegistry` register named node and edge definitions. `NamedDefinition` is the minimum registry shape: an `id` string.

## Clipboard and persistence

- `copySelection(scene, ids)` returns a `SceneClipboard` containing copied nodes, edges, and groups.
- `pasteSelection(scene, clipboard, offset)` returns `PasteSelectionResult`, including the resulting scene and copied IDs.
- `exportScene` and its alias `serializeScene` convert a scene to versioned JSON.
- `importScene` and its alias `loadScene` validate JSON and return a scene.
- `migrateScene(value)` migrates supported older scene data.
- `InvalidSceneError` describes invalid scene data. `UnsupportedSceneVersionError` extends it for unrecognised document versions.

## Document helpers

`addLayer`, `removeLayer`, `reorderLayer`, `moveNodesToLayer`,
`reorderNodeInLayer`, `setLayerVisibility`, `setLayerLocked`, `groupNodes`, and
`ungroupNodes`, `setGroupParent`, `setGroupVisibility`, and `setGroupLocked`
are immutable lower-level document operations. They validate
layer and node references and preserve all relation invariants. Use
`projectVisibleDocument(scene)` when a renderer needs the canonical layer paint
order; it omits hidden-layer/group nodes and connectors whose endpoints are not
both visible. `groupDescendantNodeIds(scene, groupId)` resolves a group to its
recursive leaf nodes in scene order. `interactiveNodesInRenderOrder(scene)` and
`isNodeInteractive(scene, nodeId)` additionally exclude locked content for
interaction paths.

## Input and interaction helpers

- `attachPointerInput(element, canvas)` forwards DOM pointer events and their
  modifiers to a `CanvasKit`; `attachKeyboardInput(element, canvas)` adds the
  editor workflow shortcuts. Each returns a cleanup function.
- `hitTestNode(scene, point, index?)`, `hitTestConnector(scene, point, tolerance?)`,
  `hitTestEdge(scene, point, tolerance?)`,
  `nodesInRect(scene, rect, mode?, index?)`, `nodesInLasso(scene, polygon)`,
  and `moveNodes(scene, ids, delta)`
  support custom editor interaction. `MarqueeMode` selects `contain` or
  `intersect` bounds matching. Lasso uses each interactive node's bounds centre
  and preserves scene order; moving a group resolves its leaves once.
- `CanvasKit.selectInLasso(points, options?)` applies a lasso result with the
  same replace/add/remove/toggle semantics as `selectInRect`. Its
  `nudgeSelection(delta)` is history-backed; the default keyboard adapter maps
  arrow keys to a one-unit nudge.
- `nodeCenter(node)` and `nodeBounds(node)` derive geometry for a node.
- `snapPointToGrid(point, gridSize)` returns the nearest grid point for a positive grid size.
- `SpatialIndex(nodes)` creates a read-only node index. Its `query(rect)` method returns candidates in original scene order; recreate it after node bounds change.

## Tool runtime

`ToolRuntime` is a small renderer-neutral state machine for the built-in
`'select'`, `'pan'`, `'rectangle'`, `'text'`, and `'connector'` tools. Feed it
`ToolPointerEvent` values and consume its typed `ToolIntent` values; previews
are transient, while creation intents appear only at a completed interaction.

Every `CanvasKit` exposes `tools`, `setTool(tool)`, and
`onToolIntent(listener)`. `createPointerEvent` forwards each world-space
pointer event through this runtime after normal pointer listeners receive it.
Hosts decide how a `create-rectangle`, `create-text`, or `create-connector`
intent becomes an application-specific immutable scene mutation.

## Inspector runtime

`InspectorRuntime` registers typed `InspectorProperty` schemas with a label,
optional applicable node types, and `read`/`write` adapters. `read(scene, ids,
propertyId)` reports either a concrete value or `{ kind: 'mixed' }` for a
multi-selection. `apply(scene, ids, propertyId, value)` validates every
requested target before returning a new scene, so an unknown target cannot
produce a partial mutation.

## Command surface

Registered commands may declare `shortcut` and `isAvailable(canvas)`. Use
`CanvasKit.getCommandPalette()` to obtain the currently applicable, UI-neutral
command entries and `executeShortcut(shortcut)` to dispatch only when exactly
one applicable command owns that shortcut.

## Transform tools

`TransformController` computes `TransformOverlay` values and immutable resize,
alignment, and distribution scenes. `TransformHandle`, `TransformConstraints`,
`AlignmentAxis`, and `DistributionAxis` describe its inputs.
`rotateSelection(radians)` and a `rotate` resize request persist a node's
optional `rotation` angle into `CanvasScene`. See
[Transform tools](/api/transform-tools) for the complete contract and examples.
Selection IDs may be node or group IDs; a group transform resolves its
descendant leaves exactly once.

## Plugins and renderers

`CanvasPlugin` has an `id` and `install(canvas)` method; installation may return a cleanup function. `Renderer` is the minimal renderer contract with `render(scene)`. See [Plugins](/plugins) for lifecycle and trust guidance.
