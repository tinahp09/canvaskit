# Diagram toolkit API

V2.3 makes ports and connectors first-class Scene V4 data. Core validates
relations and derives their geometry; applications do not persist route points.

```ts
import { CanvasKit, createScene, deriveNodePorts, type CanvasConnector } from '@canvaskit/core'

const kit = new CanvasKit({ scene: createScene() })
kit.createConnector({
  id: 'request-store',
  sourceNodeId: 'request', sourcePortId: 'east',
  targetNodeId: 'store', targetPortId: 'west',
  routing: 'orthogonal', label: 'Store record',
})
```

## Scene V4

`SCENE_VERSION` is `4`. A connector is canonical data with endpoint references:

```ts
interface CanvasConnector {
  id: string
  sourceNodeId: string
  sourcePortId: 'north' | 'east' | 'south' | 'west'
  targetNodeId: string
  targetPortId: 'north' | 'east' | 'south' | 'west'
  routing: 'straight' | 'orthogonal'
  label?: string
}
```

`deriveNodePorts(node)` returns the four named ports from the node's current
bounds. `ConnectorController.route(scene, connector)` resolves its current
route. Neither function changes the document, so routes automatically follow
node size and position changes.

## History-backed commands

`CanvasKit` exposes the validated mutable workflow:

- `createConnector(input)` adds an undoable connector.
- `reconnectConnector(id, endpoint, nodeId, portId)` changes one endpoint.
- `removeConnector(id)` removes it.
- `selectConnector(id)`, `getSelectedConnector()`, and `clearSelection()`
  manage connector-aware selection.

All connector methods reject hidden or locked endpoints and return `false` when
there is no valid mutation. The `delete-selection` command removes a selected
connector when no nodes are selected. Undo and redo restore each relation
mutation atomically.

## Rendering and export

`CanvasRenderer.render(scene, selectedNodeIds, overlay, selectedConnectorId)`
draws routes, arrowheads, labels, endpoint affordances, and selected connector
state. `renderSVG(scene, selectedConnectorId?)` exports the matching route,
escaped label, direction marker, and selected style. Both renderers receive
visible document projection from Core; hidden endpoint layers omit their
connectors, while locked endpoints remain visible but non-interactive.

## Migration

`importScene` accepts V1, V2, and V3 documents. Earlier `edges` are upgraded
to V4 `connectors` with `straight` routing and centre ports. `exportScene`
always emits canonical V4 JSON. See [Migrations](/migrations) for compatibility
details.
