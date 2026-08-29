# Document & layers API

V2.2 adds a serializable, ordered document model to `@canvaskit/core`. Core
owns validation and mutation semantics; renderers and applications consume the
resulting scene rather than maintaining a second layer model.

```ts
import {
  CanvasKit,
  DEFAULT_LAYER_ID,
  addLayer,
  createScene,
  projectVisibleDocument,
  type CanvasLayer,
} from '@canvaskit/core'
```

## Scene V3

`SCENE_VERSION` is `3`. A canonical `CanvasScene` has an ordered `layers`
array, and every `CanvasNode` has exactly one `layerId` that names one of those
layers.

```ts
interface CanvasLayer {
  id: string
  name: string
  visible: boolean
  locked: boolean
}
```

`createScene()` creates the permanent default layer:

```ts
{ id: DEFAULT_LAYER_ID, name: 'Default', visible: true, locked: false }
```

`addRectangle`, `addCircle`, and `addText` accept optional `layerId` input.
Omitting it assigns the node to `layer-default` when present, or to the first
layer of a valid imported V3 scene without that default. Supplying an unknown
layer ID throws. A layer cannot be removed while it contains nodes, the final
layer cannot be removed, and `layer-default` cannot be removed from a
Core-created document.

## Immutable document operations

These functions return new scenes and never mutate their input:

- `addLayer(scene, layer)` adds a unique layer.
- `removeLayer(scene, layerId)` removes an empty, non-default layer.
- `reorderLayer(scene, layerId, targetIndex)` moves a layer in the paint order.
- `moveNodesToLayer(scene, nodeIds, layerId)` changes validated node membership.
- `reorderNodeInLayer(scene, nodeId, targetIndex)` changes a node's position
  among nodes in its own layer.
- `setLayerVisibility(scene, layerId, visible)` and
  `setLayerLocked(scene, layerId, locked)` update a layer state.
- `groupNodes(scene, { id, nodeIds })` and `ungroupNodes(scene, groupId)` manage
  durable group metadata.

Layer order determines paint and hit-test order. Node order is stable within
each layer. A `CanvasGroup` can include nodes on different layers, but it is
metadata only in V2.2: it does not create a nested coordinate system, a
transform container, or a separate z-order.

## Visibility and interaction projection

`projectVisibleDocument(scene)` returns the renderer projection:

- nodes are emitted in layer order, then their existing order within each layer;
- nodes on hidden layers are omitted; and
- an edge is emitted only when both endpoint nodes are visible.

`interactiveNodesInRenderOrder(scene)` returns the same paint order while also
excluding locked-layer nodes. `isNodeInteractive(scene, nodeId)` is the
single-node predicate used by Core interaction paths. Consequently, a locked
node remains visible but cannot be selected, moved, resized, connected, or
found by pointer/marquee helpers. A hidden node is neither rendered nor
interactive. Programmatic document commands validate referenced layers and
nodes instead of bypassing those document invariants.

## `CanvasKit` commands

`CanvasKit` wraps document changes in one history entry when a mutation occurs:

```ts
const kit = new CanvasKit({ scene: createScene() })

kit.createLayer({ id: 'annotations', name: 'Annotations', visible: true, locked: false })
kit.moveSelectionToLayer('annotations')
kit.setLayerVisibility('annotations', false)
kit.setLayerVisible('annotations', true) // compatibility alias
kit.setLayerLocked('annotations', true)
kit.reorderLayer('annotations', 0)
kit.reorderSelection(0) // selected nodes must share a layer
kit.groupSelection()
kit.ungroupSelection()
```

All methods return `false` if there is no applicable document mutation. Invalid
IDs or out-of-range target indexes throw rather than producing a partial scene.
After each scene mutation, selection retains only existing, visible, unlocked
nodes. `group-selection` and `ungroup-selection` are also valid
argument-free `executeCommand` values; other layer operations need their
arguments and are called directly.

`undo()` and `redo()` restore layer membership, layer state, order, and groups
as one operation. Deleting or cutting nodes continues to remove dangling edges
and prunes group membership, so a serialized V3 scene never retains dangling
relations.

## Migration and persistence

`importScene` accepts V1, V2, and canonical V3 JSON. A V2 import becomes V3
with exactly `layer-default`; all original nodes gain that `layerId`, while
edges, groups, viewport, metadata, and order are preserved. `exportScene`
always writes canonical V3 JSON. See [Migrations](/migrations) for the complete
compatibility contract.
