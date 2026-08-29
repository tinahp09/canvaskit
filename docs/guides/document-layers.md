# Document & layers

CanvasKit V2.2 gives a headless editor a single authoritative document model:
ordered layers, durable groups, lock/hide state, and history-backed commands.
Use the [API reference](/api/document-layers) for every export; this guide
focuses on application integration.

## Start with a layer-aware scene

Core-created scenes have one visible, unlocked `layer-default` layer. Create a
layer before assigning a node to it, then use the same `CanvasKit` instance for
undoable commands:

```ts
import { addRectangle, CanvasKit, createScene } from '@canvaskit/core'

let scene = createScene()
const kit = new CanvasKit({ scene })

kit.createLayer({
  id: 'annotations',
  name: 'Annotations',
  visible: true,
  locked: false,
})

scene = addRectangle(kit.getScene(), {
  id: 'note',
  layerId: 'annotations',
  position: { x: 80, y: 60 },
  size: { width: 180, height: 96 },
  fill: '#fff3a3',
})
kit.setScene(scene)
```

For an interactive editor, it is usually simpler to create nodes in the active
layer and call `setScene` only when loading an external document. Keep active
layer UI state in the application; CanvasKit deliberately does not prescribe a
toolbar or active-layer controller.

## Respect layer state

Visibility and locking are document state, not renderer-only styling:

- A hidden layer's nodes and any edge missing a visible endpoint are omitted
  from the canonical renderer projection.
- Locked nodes still render but Core pointer, marquee, selection, move,
  transform, and connection paths reject them.
- Changing visibility or locking clears affected nodes from the selection.

This means an application should call the public commands rather than simply
changing what it paints:

```ts
kit.setLayerVisibility('annotations', false)
kit.undo() // restores the layer and its formerly selectable nodes

kit.setLayerLocked('annotations', true)
// Pointer selection and resize attempts now leave its nodes unchanged.
```

For custom renderers, paint `projectVisibleDocument(kit.getScene())`. For
custom input, use `isNodeInteractive(scene, id)` or
`interactiveNodesInRenderOrder(scene)` instead of treating every raw node as
targetable.

## Arrange and group

Layer order is back-to-front paint order. Move a layer with
`reorderLayer(layerId, targetIndex)`. Within a layer, select one or more nodes
and call `reorderSelection(targetIndex)`; all selected nodes must be on the
same layer so their stable relative order remains predictable.

Groups preserve a named set of node IDs:

```ts
kit.selection.set(['title', 'subtitle'])
kit.groupSelection()
kit.executeCommand('ungroup-selection')
```

Groups may span layers, but they do not nest nodes or change their transforms
in V2.2. This keeps layer paint order authoritative while providing durable
document metadata for later editor workflows.

## Load existing V2 documents

No pre-processing is required. `importScene` and `CanvasKit.load` migrate a V2
scene to V3 by adding `layer-default` and attaching every prior node to it.
The migration preserves existing graph relations, viewport, metadata, and node
order. When saving the result, `exportScene` writes version 3 JSON; clients
that require V2 output must keep their own compatibility export rather than
discarding V3 layer information.

## Example

The [basic-canvas example](/examples) exposes accessible native controls for
choosing, adding, reordering, hiding, locking, grouping, and ungrouping layers.
It is an integration example rather than required UI: framework and renderer
consumers can present these public commands in their own controls.
