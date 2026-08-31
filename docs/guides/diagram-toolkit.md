# Diagram toolkit

V2.3 lets a headless CanvasKit editor model flowchart and ERD relationships as
validated, serializable connectors. Use the [API reference](/api/diagram-toolkit)
for the complete contract; this guide covers integration boundaries.

## Create a connector

Give nodes stable IDs, then create a connector through `CanvasKit` so it is
validated and recorded in history:

```ts
const created = kit.createConnector({
  id: 'webhook-request',
  sourceNodeId: 'webhook', sourcePortId: 'east',
  targetNodeId: 'request', targetPortId: 'west',
  routing: 'orthogonal', label: 'Webhook request',
})
```

Connectors use derived `north`, `east`, `south`, and `west` ports. Do not store
screen coordinates or bends: Core recomputes geometry after a node moves or
resizes.

## Select, reconnect, and delete

Use connector selection independently from node selection:

```ts
kit.selectConnector('webhook-request')
kit.reconnectConnector('webhook-request', 'target', 'database', 'west')
kit.executeCommand('delete-selection')
kit.undo()
```

Pointer UIs should cancel a port drag on `pointercancel`, rather than treating
it as a completed drop. The basic-canvas example shows both port-to-port pointer
interaction and accessible native controls for selecting, creating, retargeting,
cancelling, and deleting connectors without pointer input.

## Respect document state

Visible endpoint nodes are required for rendering a connector. Hidden endpoint
layers remove the connector from the visible projection; locked nodes remain
painted but cannot be used to create or reconnect a relation. Keep custom UI
aligned with Core by using `isNodeInteractive` before offering a port action.

## Renderer contract

Canvas and SVG renderers receive resolved connector geometry from Core. They
draw arrow direction and labels before nodes, use the selected connector style
when supplied, and omit port affordances for non-interactive nodes. Custom
renderers should use `projectVisibleDocument(scene)` together with
`ConnectorController.route(scene, connector)` instead of duplicating routing.
