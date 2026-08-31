import { CanvasKit, addCircle, addConnector, addRectangle, addText, attachKeyboardInput, attachPointerInput, deriveNodePorts, hitTestConnector, hitTestNode, importScene, isNodeInteractive, createScene, exportScene, moveNodes, projectVisibleDocument, type MarqueeMode, type SelectionMode, type TransformHandle } from '@canvaskit/core'
import { CanvasRenderer, exportPNG } from '@canvaskit/renderer-canvas'
import { CanvasAccessibilityMirror, createAccessibilitySnapshot } from '@canvaskit/accessibility'
import { exportPDFDataURL } from '@canvaskit/renderer-pdf'
import { renderSVG } from '@canvaskit/renderer-svg'
import { createCommandPlugin, createGridPlugin, createSnapPlugin } from '@canvaskit/plugins'
import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `<header><strong>CanvasKit V2.7 — Plugin Platform</strong><div class="toolbar" aria-label="Editor controls"><button id="circle">Add circle</button><button id="text">Add text</button><button id="connect">Connect selected</button><button id="undo">Undo</button><button id="redo">Redo</button><button id="copy">Copy</button><button id="cut">Cut</button><button id="paste">Paste</button><button id="duplicate">Duplicate</button><span class="toolbar-divider" aria-hidden="true"></span><button id="align-left">Align left</button><button id="align-center">Align center</button><button id="distribute-horizontal">Distribute horizontal</button><button id="export">Export scene</button><button id="import">Import scene</button><button id="export-svg">Export SVG</button><button id="export-png">Export PNG</button><button id="export-pdf">Export PDF</button></div><span class="workflow-hint" id="diagram-instructions">Drag between visible port dots to connect; drag a selected connector endpoint to reconnect. Keyboard users can choose source and target ports, create or reconnect a connector, then use Escape to cancel and Delete to remove the selected connector.</span><fieldset class="plugin-controls"><legend>Plugins</legend><label><input id="show-grid" type="checkbox" checked> Show grid</label><label><input id="snap-to-grid" type="checkbox" checked> Snap to grid</label></fieldset><fieldset class="layer-controls"><legend>Layers</legend><label>Active layer <select id="active-layer" aria-label="Active layer"></select></label><button id="add-layer">Add layer</button><button id="move-selection-to-layer">Move selected nodes to active layer</button><button id="toggle-layer-visibility">Hide active layer</button><button id="toggle-layer-lock">Lock active layer</button><button id="move-layer-backward">Move active layer backward</button><button id="move-layer-forward">Move active layer forward</button><button id="group-selection">Group selected nodes</button><button id="ungroup-selection">Ungroup selected nodes</button></fieldset><fieldset class="connector-controls"><legend>Diagram connectors</legend><label>Source port <select id="connector-source-port" aria-label="Source port"></select></label><label>Target port <select id="connector-target-port" aria-label="Target port"></select></label><button id="create-connector">Create connector</button><label>Selected connector <select id="selected-connector" aria-label="Selected connector"></select></label><button id="reconnect-connector">Reconnect selected connector target</button><button id="cancel-connector" aria-keyshortcuts="Escape">Cancel connector interaction</button></fieldset></header><canvas role="application" aria-label="CanvasKit example" aria-describedby="diagram-instructions" aria-keyshortcuts="Control+A Meta+A Control+C Meta+C Control+X Meta+X Control+V Meta+V Control+D Meta+D Delete Backspace Escape" tabindex="0"></canvas><section class="data-panels" aria-label="Scene and export data"><textarea data-testid="scene-json" aria-label="Scene JSON"></textarea><textarea data-testid="export-preview" aria-label="Export preview" readonly></textarea></section><p id="scene-status" role="status" aria-live="polite"></p>`
const canvasElement = app.querySelector('canvas')!
canvasElement.width = 1200
canvasElement.height = 720
const layoutControls = document.createElement('fieldset')
layoutControls.className = 'layer-controls layout-controls'
layoutControls.innerHTML = '<legend>Smart layout</legend><label>Guide position <input id="layout-guide-position" aria-label="Guide position" type="number" value="300"></label><button id="add-vertical-guide">Add vertical guide</button><button id="add-horizontal-guide">Add horizontal guide</button><label>Guide <select id="layout-guide" aria-label="Layout guide"></select></label><button id="remove-layout-guide">Remove guide</button><label>Layout <select id="layout-direction" aria-label="Layout direction"><option value="horizontal">Horizontal</option><option value="vertical">Vertical</option><option value="grid">Grid</option></select></label><label>Columns <input id="layout-columns" aria-label="Layout columns" type="number" min="1" value="2"></label><label>Gap <input id="layout-gap" aria-label="Layout gap" type="number" min="0" value="24"></label><button id="apply-layout">Apply auto layout</button><button id="preview-snap">Preview smart snap</button></fieldset>'
app.querySelector('header')!.append(layoutControls)
const assetControls = document.createElement('fieldset')
assetControls.className = 'layer-controls asset-controls'
assetControls.innerHTML = '<legend>Assets</legend><label>Image asset URL <input id="image-asset-url" aria-label="Image asset URL" type="url" placeholder="https://example.com/image.png"></label><button id="add-image-asset">Add image asset</button><button id="add-image-node">Add image node</button>'
app.querySelector('header')!.append(assetControls)
const extensionControls = document.createElement('fieldset')
extensionControls.className = 'layer-controls extension-controls'
extensionControls.innerHTML = '<legend>Extension platform</legend><button id="show-plugin-diagnostics">Show plugin diagnostics</button><output id="plugin-diagnostics" aria-live="polite"></output>'
app.querySelector('header')!.append(extensionControls)
const workflow = addRectangle(addRectangle(addRectangle(createScene(), { id: 'webhook', position: { x: 120, y: 180 }, size: { width: 150, height: 70 }, fill: '#7C7FF2' }), { id: 'request', position: { x: 400, y: 180 }, size: { width: 150, height: 70 }, fill: '#60A5FA' }), { id: 'database', position: { x: 680, y: 180 }, size: { width: 150, height: 70 }, fill: '#34D399' })
const diagram = addConnector(addConnector(workflow, { id: 'webhook-request', sourceNodeId: 'webhook', sourcePortId: 'east', targetNodeId: 'request', targetPortId: 'west', routing: 'orthogonal', label: 'Webhook request' }), { id: 'request-database', sourceNodeId: 'request', sourcePortId: 'east', targetNodeId: 'database', targetPortId: 'west', routing: 'orthogonal', label: 'Store record' })
const kit = new CanvasKit({ scene: diagram })
const accessibilityMirror = new CanvasAccessibilityMirror(app, { label: 'Canvas content' })
const syncAccessibilityMirror = () => accessibilityMirror.update(createAccessibilitySnapshot(kit.getScene(), kit.selection.get()))
const gridPlugin = createGridPlugin({ size: 20, style: 'dots', color: '#3A414D' })
const snapPlugin = createSnapPlugin({ gridSize: 20 })
kit.use(gridPlugin)
kit.use(snapPlugin)
const renderer = new CanvasRenderer(canvasElement)
const redraw = () => {
  const scene = kit.getScene()
  renderer.render(scene, kit.selection.get(), kit.transform.getOverlay(scene, kit.selection.get()), kit.getSelectedConnector(), kit.getActiveLayoutGuides())
}
attachPointerInput(canvasElement, kit)
attachKeyboardInput(canvasElement, kit)
const showGrid = app.querySelector<HTMLInputElement>('#show-grid')!
const snapToGrid = app.querySelector<HTMLInputElement>('#snap-to-grid')!
const activeLayer = app.querySelector<HTMLSelectElement>('#active-layer')!
let activeLayerId = kit.getScene().layers[0]?.id ?? ''
const syncLayerControls = () => {
  const scene = kit.getScene()
  const layer = scene.layers.find((candidate) => candidate.id === activeLayerId) ?? scene.layers[0]
  activeLayerId = layer?.id ?? ''
  activeLayer.replaceChildren(...scene.layers.map((candidate) => {
    const option = document.createElement('option')
    option.value = candidate.id
    option.textContent = candidate.name
    return option
  }))
  activeLayer.value = activeLayerId
  const layerIndex = scene.layers.findIndex((candidate) => candidate.id === activeLayerId)
  const visibilityButton = app.querySelector<HTMLButtonElement>('#toggle-layer-visibility')!
  const lockButton = app.querySelector<HTMLButtonElement>('#toggle-layer-lock')!
  visibilityButton.textContent = layer?.visible ? 'Hide active layer' : 'Show active layer'
  lockButton.textContent = layer?.locked ? 'Unlock active layer' : 'Lock active layer'
  app.querySelector<HTMLButtonElement>('#move-layer-backward')!.disabled = layerIndex <= 0
  app.querySelector<HTMLButtonElement>('#move-layer-forward')!.disabled = layerIndex < 0 || layerIndex >= scene.layers.length - 1
}
activeLayer.onchange = () => { activeLayerId = activeLayer.value; syncLayerControls() }
const nextLayerId = () => {
  const existing = new Set(kit.getScene().layers.map((layer) => layer.id))
  let number = 1
  while (existing.has(`layer-${number}`)) number += 1
  return `layer-${number}`
}
app.querySelector<HTMLButtonElement>('#add-layer')!.onclick = () => {
  const id = nextLayerId()
  if (kit.createLayer({ id, name: `Layer ${id.slice('layer-'.length)}`, visible: true, locked: false })) activeLayerId = id
  syncLayerControls()
}
app.querySelector<HTMLButtonElement>('#move-selection-to-layer')!.onclick = () => { kit.moveSelectionToLayer(activeLayerId) }
app.querySelector<HTMLButtonElement>('#toggle-layer-visibility')!.onclick = () => {
  const layer = kit.getScene().layers.find((candidate) => candidate.id === activeLayerId)
  if (layer) kit.setLayerVisibility(layer.id, !layer.visible)
}
app.querySelector<HTMLButtonElement>('#toggle-layer-lock')!.onclick = () => {
  const layer = kit.getScene().layers.find((candidate) => candidate.id === activeLayerId)
  if (layer) kit.setLayerLocked(layer.id, !layer.locked)
}
app.querySelector<HTMLButtonElement>('#move-layer-backward')!.onclick = () => {
  const index = kit.getScene().layers.findIndex((layer) => layer.id === activeLayerId)
  if (index > 0) kit.reorderLayer(activeLayerId, index - 1)
}
app.querySelector<HTMLButtonElement>('#move-layer-forward')!.onclick = () => {
  const index = kit.getScene().layers.findIndex((layer) => layer.id === activeLayerId)
  if (index >= 0 && index < kit.getScene().layers.length - 1) kit.reorderLayer(activeLayerId, index + 1)
}
app.querySelector<HTMLButtonElement>('#group-selection')!.onclick = () => { kit.groupSelection() }
app.querySelector<HTMLButtonElement>('#ungroup-selection')!.onclick = () => { kit.ungroupSelection() }
const updateGrid = () => {
  canvasElement.style.backgroundImage = showGrid.checked
    ? `radial-gradient(${gridPlugin.config.color} 1px, transparent 1px)`
    : 'none'
  canvasElement.style.backgroundSize = `${gridPlugin.config.size}px ${gridPlugin.config.size}px`
}
showGrid.addEventListener('change', updateGrid)
updateGrid()
syncLayerControls()
let dragStart: { x: number; y: number } | undefined
let marquee: { start: { x: number; y: number }; mode: MarqueeMode; selection: SelectionMode } | undefined
let connectionSource: string | undefined
type PortHit = { nodeId: string; portId: string }
type ConnectorDrag =
  | { kind: 'create'; source: PortHit }
  | { kind: 'reconnect'; connectorId: string; endpoint: 'source' | 'target' }
let connectorDrag: ConnectorDrag | undefined
let resizeHandle: Exclude<TransformHandle, 'rotate'> | undefined
let resizePreservesAspect = false
let resizeTransactionActive = false
let rotatePointerAngle: number | undefined
const status = app.querySelector<HTMLParagraphElement>('#scene-status')!
const pluginDiagnostics = app.querySelector<HTMLOutputElement>('#plugin-diagnostics')!
kit.use(createCommandPlugin({ id: 'show-diagnostics', label: 'Show plugin diagnostics', run: (canvas) => { pluginDiagnostics.value = JSON.stringify(canvas.getDiagnostics()); status.textContent = 'Plugin diagnostics shown.' } }))
app.querySelector<HTMLButtonElement>('#show-plugin-diagnostics')!.onclick = () => kit.executeRegisteredCommand('show-diagnostics')
const imageAssetURL = app.querySelector<HTMLInputElement>('#image-asset-url')!
const nextAssetId = () => {
  const ids = new Set(kit.getScene().assets.map((asset) => asset.id))
  let number = 1
  while (ids.has(`asset-${number}`)) number += 1
  return `asset-${number}`
}
const nextImageNodeId = () => {
  const ids = new Set(kit.getScene().nodes.map((node) => node.id))
  let number = 1
  while (ids.has(`image-${number}`)) number += 1
  return `image-${number}`
}
app.querySelector<HTMLButtonElement>('#add-image-asset')!.onclick = () => {
  const source = imageAssetURL.value.trim()
  if (!source) { status.textContent = 'Enter an image asset URL.'; return }
  const id = nextAssetId()
  if (kit.addAsset({ id, kind: 'image', source, mimeType: 'image/png', width: 160, height: 80 })) {
    status.textContent = `Image asset ${id} added.`
  }
}
app.querySelector<HTMLButtonElement>('#add-image-node')!.onclick = () => {
  const asset = kit.getScene().assets.at(-1)
  if (!asset || asset.kind !== 'image') { status.textContent = 'Add an image asset first.'; return }
  const id = nextImageNodeId()
  if (kit.addImage({ id, assetId: asset.id, position: { x: 280, y: 380 }, size: { width: 160, height: 80 }, fit: 'contain' })) {
    status.textContent = `Image node ${id} added.`
  }
}
const guidePosition = app.querySelector<HTMLInputElement>('#layout-guide-position')!
const layoutGuide = app.querySelector<HTMLSelectElement>('#layout-guide')!
const layoutDirection = app.querySelector<HTMLSelectElement>('#layout-direction')!
const layoutColumns = app.querySelector<HTMLInputElement>('#layout-columns')!
const layoutGap = app.querySelector<HTMLInputElement>('#layout-gap')!
const syncLayoutControls = () => {
  const current = layoutGuide.value
  layoutGuide.replaceChildren(...kit.getScene().guides.map((guide) => {
    const option = document.createElement('option')
    option.value = guide.id
    option.textContent = `${guide.axis} @ ${guide.position}`
    return option
  }))
  layoutGuide.value = kit.getScene().guides.some((guide) => guide.id === current) ? current : (layoutGuide.options[0]?.value ?? '')
}
const nextGuideId = () => {
  const ids = new Set(kit.getScene().guides.map((guide) => guide.id))
  let number = 1
  while (ids.has(`guide-${number}`)) number += 1
  return `guide-${number}`
}
const addGuide = (axis: 'horizontal' | 'vertical') => {
  const position = Number(guidePosition.value)
  if (!Number.isFinite(position)) { status.textContent = 'Guide position must be finite.'; return }
  if (kit.createGuide({ id: nextGuideId(), axis, position })) status.textContent = `${axis} guide added.`
}
app.querySelector<HTMLButtonElement>('#add-vertical-guide')!.onclick = () => addGuide('vertical')
app.querySelector<HTMLButtonElement>('#add-horizontal-guide')!.onclick = () => addGuide('horizontal')
app.querySelector<HTMLButtonElement>('#remove-layout-guide')!.onclick = () => {
  if (layoutGuide.value && kit.removeGuide(layoutGuide.value)) status.textContent = 'Guide removed.'
}
app.querySelector<HTMLButtonElement>('#apply-layout')!.onclick = () => {
  const columns = Number(layoutColumns.value)
  const gap = Number(layoutGap.value)
  if (kit.layoutSelection({ direction: layoutDirection.value as 'horizontal' | 'vertical' | 'grid', columns, gap: { x: gap, y: gap }, origin: { x: 80, y: 120 } })) status.textContent = 'Auto layout applied.'
  else status.textContent = 'Select visible unlocked nodes to lay out.'
}
app.querySelector<HTMLButtonElement>('#preview-snap')!.onclick = () => {
  const result = kit.snapSelection({ x: 9, y: 0 })
  status.textContent = result.activeGuides.length > 0 ? 'Smart snap preview visible.' : 'No snap target nearby.'
}
const CONNECTION_HANDLE_OFFSET = 16
const TRANSFORM_HANDLE_HIT_RADIUS = 8
const PORT_HIT_RADIUS = 8
const nextConnectorId = () => {
  const existing = new Set(kit.getScene().connectors.map((connector) => connector.id))
  let number = 1
  while (existing.has(`connector-${number}`)) number += 1
  return `connector-${number}`
}
const portAt = (world: { x: number; y: number }): PortHit | undefined => {
  const scene = kit.getScene()
  const tolerance = PORT_HIT_RADIUS / Math.max(Math.abs(scene.viewport.zoom), 0.001)
  const hit = [...projectVisibleDocument(scene).nodes]
    .reverse()
    .filter((node) => isNodeInteractive(scene, node.id))
    .flatMap((node) => deriveNodePorts(node).map((port) => ({ nodeId: node.id, port })))
    .find(({ port }) => Math.hypot(world.x - port.position.x, world.y - port.position.y) <= tolerance)
  return hit && { nodeId: hit.nodeId, portId: hit.port.id }
}
const sourcePort = app.querySelector<HTMLSelectElement>('#connector-source-port')!
const targetPort = app.querySelector<HTMLSelectElement>('#connector-target-port')!
const selectedConnector = app.querySelector<HTMLSelectElement>('#selected-connector')!
const reconnectConnectorButton = app.querySelector<HTMLButtonElement>('#reconnect-connector')!
reconnectConnectorButton.setAttribute('aria-label', 'Retarget selected connector')
const portValue = (port: PortHit) => JSON.stringify(port)
const readPortValue = (value: string): PortHit | undefined => {
  try {
    const port = JSON.parse(value) as Partial<PortHit>
    return typeof port.nodeId === 'string' && typeof port.portId === 'string' ? { nodeId: port.nodeId, portId: port.portId } : undefined
  } catch { return undefined }
}
const interactivePorts = () => [...projectVisibleDocument(kit.getScene()).nodes]
  .filter((node) => kit.isNodeInteractive(node.id))
  .flatMap((node) => deriveNodePorts(node).map((port) => ({ nodeId: node.id, portId: port.id })))
const syncConnectorControls = () => {
  const currentSource = sourcePort.value
  const currentTarget = targetPort.value
  const ports = interactivePorts()
  const portOptions = ports.map((port) => {
    const option = document.createElement('option')
    option.value = portValue(port)
    option.textContent = `${port.nodeId} — ${port.portId}`
    return option
  })
  sourcePort.replaceChildren(...portOptions.map((option) => option.cloneNode(true)))
  targetPort.replaceChildren(...portOptions)
  sourcePort.value = ports.some((port) => portValue(port) === currentSource) ? currentSource : (sourcePort.options[0]?.value ?? '')
  targetPort.value = ports.some((port) => portValue(port) === currentTarget) ? currentTarget : (targetPort.options[0]?.value ?? '')
  const selectedId = kit.getSelectedConnector()
  const empty = document.createElement('option')
  empty.value = ''
  empty.textContent = 'None selected'
  selectedConnector.replaceChildren(empty, ...kit.getScene().connectors.filter((connector) => kit.getSelectedConnector() === connector.id || kit.isConnectorInteractive(connector)).map((connector) => {
    const option = document.createElement('option')
    option.value = connector.id
    option.textContent = connector.label ? `${connector.id} — ${connector.label}` : connector.id
    return option
  }))
  selectedConnector.value = selectedId ?? ''
  reconnectConnectorButton.disabled = selectedId === undefined || targetPort.value === ''
}
const abortConnectorInteraction = () => {
  connectorDrag = undefined
  connectionSource = undefined
  status.textContent = 'Connector interaction cancelled.'
  redraw()
}
app.querySelector<HTMLButtonElement>('#create-connector')!.onclick = () => {
  const source = readPortValue(sourcePort.value)
  const target = readPortValue(targetPort.value)
  if (!source || !target || (source.nodeId === target.nodeId && source.portId === target.portId)) {
    status.textContent = 'Choose two different visible, unlocked ports.'
    return
  }
  const id = nextConnectorId()
  if (kit.createConnector({ id, sourceNodeId: source.nodeId, sourcePortId: source.portId, targetNodeId: target.nodeId, targetPortId: target.portId, routing: 'orthogonal', label: 'Diagram connection' })) {
    kit.selectConnector(id)
    status.textContent = `Connector ${id} created and selected.`
  } else status.textContent = 'Connector endpoints must be visible and unlocked.'
}
selectedConnector.onchange = () => {
  if (selectedConnector.value) kit.selectConnector(selectedConnector.value)
  else kit.clearSelection()
}
reconnectConnectorButton.onclick = () => {
  const target = readPortValue(targetPort.value)
  const id = kit.getSelectedConnector()
  if (!id || !target) return
  if (kit.reconnectConnector(id, 'target', target.nodeId, target.portId)) status.textContent = `Connector ${id} target reconnected.`
  else status.textContent = 'Connector target must be visible and unlocked.'
}
app.querySelector<HTMLButtonElement>('#cancel-connector')!.onclick = abortConnectorInteraction
canvasElement.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') abortConnectorInteraction()
})
kit.subscribe(() => { syncLayerControls(); syncConnectorControls(); syncLayoutControls(); syncAccessibilityMirror(); redraw() })
syncConnectorControls()
syncLayoutControls()
const connectionSourceAt = (screen: { x: number; y: number }) => kit.selection.get().map((id) => kit.getScene().nodes.find((node) => node.id === id)).find((node) => {
  if (!node) return false
  if (!kit.isNodeInteractive(node.id)) return false
  const { viewport } = kit.getScene()
  const handle = node.type === 'rectangle'
    ? { x: node.position.x + node.size.width, y: node.position.y + node.size.height / 2 }
    : node.type === 'circle'
      ? { x: node.position.x + node.radius, y: node.position.y }
      : { x: node.position.x + node.text.length * node.fontSize, y: node.position.y - node.fontSize / 2 }
  const handleScreen = { x: handle.x * viewport.zoom + viewport.x + CONNECTION_HANDLE_OFFSET, y: handle.y * viewport.zoom + viewport.y }
  return Math.hypot(screen.x - handleScreen.x, screen.y - handleScreen.y) <= 8
})
const transformHandleAt = (screen: { x: number; y: number }): TransformHandle | undefined => {
  const scene = kit.getScene()
  const overlay = kit.transform.getOverlay(scene, kit.selection.get())
  if (!overlay) return undefined
  const nearest = (Object.entries(overlay.handles) as Array<[TransformHandle, { x: number; y: number }]>).reduce<
    { handle: TransformHandle; distance: number } | undefined
  >((current, [handle, point]) => {
    const distance = Math.hypot(
      screen.x - (point.x * scene.viewport.zoom + scene.viewport.x),
      screen.y - (point.y * scene.viewport.zoom + scene.viewport.y),
    )
    return !current || distance < current.distance ? { handle, distance } : current
  }, undefined)
  return nearest && nearest.distance <= TRANSFORM_HANDLE_HIT_RADIUS ? nearest.handle : undefined
}
kit.onPointer((event) => {
  const primaryModifier = event.modifiers?.metaKey || event.modifiers?.ctrlKey
  if (event.type === 'pointerdown') {
    if (event.button !== undefined && event.button !== 0) return
    const transformHandle = transformHandleAt(event.screen)
    if (transformHandle === 'rotate') {
      const overlay = kit.transform.getOverlay(kit.getScene(), kit.selection.get())
      if (!overlay) return
      const centre = { x: overlay.bounds.x + overlay.bounds.width / 2, y: overlay.bounds.y + overlay.bounds.height / 2 }
      rotatePointerAngle = Math.atan2(event.world.y - centre.y, event.world.x - centre.x)
      kit.beginTransaction('rotate selection')
      resizeTransactionActive = true
      return
    }
    if (transformHandle) {
      resizeHandle = transformHandle
      resizePreservesAspect = Boolean(event.modifiers?.shiftKey)
      kit.beginTransaction('resize selection')
      resizeTransactionActive = true
      return
    }
    const port = portAt(event.world)
    if (port) {
      const selectedConnectorId = kit.getSelectedConnector()
      const selectedConnector = selectedConnectorId === undefined
        ? undefined
        : kit.getScene().connectors.find((connector) => connector.id === selectedConnectorId)
      if (selectedConnector && port.nodeId === selectedConnector.sourceNodeId && port.portId === selectedConnector.sourcePortId) {
        connectorDrag = { kind: 'reconnect', connectorId: selectedConnector.id, endpoint: 'source' }
      } else if (selectedConnector && port.nodeId === selectedConnector.targetNodeId && port.portId === selectedConnector.targetPortId) {
        connectorDrag = { kind: 'reconnect', connectorId: selectedConnector.id, endpoint: 'target' }
      } else {
        connectorDrag = { kind: 'create', source: port }
      }
      redraw()
      return
    }
    const source = connectionSourceAt(event.screen)
    if (source) { connectionSource = source.id; redraw(); return }
    const scene = kit.getScene()
    const connector = hitTestConnector(scene, event.world)
    if (connector) {
      kit.selectConnector(connector.id)
      redraw()
      return
    }
    const node = hitTestNode(scene, event.world)
    if (node) {
      if (primaryModifier) kit.selection.toggle([node.id])
      else if (event.modifiers?.shiftKey) kit.selection.add([node.id])
      else kit.selection.set([node.id])
      dragStart = event.world
    } else {
      marquee = {
        start: event.world,
        mode: event.modifiers?.shiftKey ? 'intersect' : 'contain',
        selection: event.modifiers?.shiftKey ? 'add' : 'replace',
      }
    }
  } else if (event.type === 'pointermove' && rotatePointerAngle !== undefined && (event.buttons === undefined || (event.buttons & 1) !== 0)) {
    const overlay = kit.transform.getOverlay(kit.getScene(), kit.selection.get())
    if (overlay) {
      const centre = { x: overlay.bounds.x + overlay.bounds.width / 2, y: overlay.bounds.y + overlay.bounds.height / 2 }
      const nextAngle = Math.atan2(event.world.y - centre.y, event.world.x - centre.x)
      kit.rotateSelection(nextAngle - rotatePointerAngle)
      rotatePointerAngle = nextAngle
    }
  } else if (event.type === 'pointermove' && resizeHandle && (event.buttons === undefined || (event.buttons & 1) !== 0)) {
    kit.resizeSelection(resizeHandle, event.world, { preserveAspectRatio: resizePreservesAspect })
  } else if (event.type === 'pointermove' && dragStart && (event.buttons === undefined || (event.buttons & 1) !== 0)) {
    const snapped = snapToGrid.checked ? snapPlugin.snap(event.world) : event.world
    const before = kit.getScene()
    const ids = kit.selection.get().filter((id) => kit.isNodeInteractive(id))
    const after = moveNodes(before, ids, { x: snapped.x - dragStart.x, y: snapped.y - dragStart.y })
    kit.execute({ label: 'move selection', execute: () => after, undo: () => before })
    dragStart = snapped
  } else if (event.type === 'pointercancel') {
    if (resizeTransactionActive) {
      kit.commitTransaction()
      resizeTransactionActive = false
    }
    resizeHandle = undefined
    rotatePointerAngle = undefined
    resizePreservesAspect = false
    connectorDrag = undefined
    connectionSource = undefined
    dragStart = undefined
    marquee = undefined
  } else if (event.type === 'pointerup') {
    if (event.button !== undefined && event.button !== 0) return
    if (resizeTransactionActive) {
      kit.commitTransaction()
      resizeTransactionActive = false
    }
    resizeHandle = undefined
    rotatePointerAngle = undefined
    resizePreservesAspect = false
    if (connectorDrag) {
      const target = portAt(event.world)
      if (target) {
        if (connectorDrag.kind === 'create') {
          const { source } = connectorDrag
          if (source.nodeId !== target.nodeId || source.portId !== target.portId) {
            const created = kit.createConnector({
              id: nextConnectorId(),
              sourceNodeId: source.nodeId,
              sourcePortId: source.portId,
              targetNodeId: target.nodeId,
              targetPortId: target.portId,
              routing: 'orthogonal',
              label: 'Diagram connection',
            })
            if (created) status.textContent = 'Connector created.'
          }
        } else if (kit.reconnectConnector(connectorDrag.connectorId, connectorDrag.endpoint, target.nodeId, target.portId)) {
          status.textContent = 'Connector reconnected.'
        }
      }
      connectorDrag = undefined
    }
    if (connectionSource) {
      const target = hitTestNode(kit.getScene(), event.world)
      if (target && target.id !== connectionSource) {
        kit.createConnector({
          id: nextConnectorId(),
          sourceNodeId: connectionSource,
          sourcePortId: 'east',
          targetNodeId: target.id,
          targetPortId: 'west',
          routing: 'orthogonal',
        })
      }
      connectionSource = undefined
    }
    if (marquee) {
      const { start, mode, selection } = marquee
      kit.selectInRect({
        x: Math.min(start.x, event.world.x), y: Math.min(start.y, event.world.y),
        width: Math.abs(event.world.x - start.x), height: Math.abs(event.world.y - start.y),
      }, { mode, selection })
    }
    dragStart = undefined
    marquee = undefined
  }
  redraw()
})
redraw()
syncAccessibilityMirror()
const json = app.querySelector<HTMLTextAreaElement>('[data-testid="scene-json"]')!
const exportPreview = app.querySelector<HTMLTextAreaElement>('[data-testid="export-preview"]')!
app.querySelector<HTMLButtonElement>('#undo')!.onclick = () => { kit.undo(); redraw() }
app.querySelector<HTMLButtonElement>('#redo')!.onclick = () => { kit.redo(); redraw() }
app.querySelector<HTMLButtonElement>('#copy')!.onclick = () => { kit.executeCommand('copy') }
app.querySelector<HTMLButtonElement>('#cut')!.onclick = () => { kit.executeCommand('cut'); redraw() }
app.querySelector<HTMLButtonElement>('#paste')!.onclick = () => { kit.executeCommand('paste'); redraw() }
app.querySelector<HTMLButtonElement>('#duplicate')!.onclick = () => { kit.executeCommand('duplicate'); redraw() }
app.querySelector<HTMLButtonElement>('#align-left')!.onclick = () => { kit.executeCommand('align-left'); redraw() }
app.querySelector<HTMLButtonElement>('#align-center')!.onclick = () => { kit.executeCommand('align-center'); redraw() }
app.querySelector<HTMLButtonElement>('#distribute-horizontal')!.onclick = () => { kit.executeCommand('distribute-horizontal'); redraw() }
app.querySelector<HTMLButtonElement>('#export')!.onclick = () => { json.value = exportScene(kit.getScene()); status.textContent = 'Scene exported.' }
app.querySelector<HTMLButtonElement>('#export-svg')!.onclick = () => {
  try {
    exportPreview.value = renderSVG(kit.getScene(), kit.getSelectedConnector())
    status.textContent = 'SVG exported.'
  } catch {
    status.textContent = 'SVG export failed.'
  }
}
app.querySelector<HTMLButtonElement>('#export-png')!.onclick = () => {
  try {
    exportPreview.value = exportPNG(canvasElement)
    status.textContent = 'PNG exported.'
  } catch {
    status.textContent = 'PNG export failed.'
  }
}
app.querySelector<HTMLButtonElement>('#export-pdf')!.onclick = () => {
  try {
    exportPreview.value = exportPDFDataURL(kit.getScene())
    status.textContent = 'PDF exported.'
  } catch {
    status.textContent = 'PDF export failed.'
  }
}
app.querySelector<HTMLButtonElement>('#import')!.onclick = () => {
  try {
    const scene = importScene(json.value)
    kit.setScene(scene)
    kit.clearHistory()
    kit.selection.clear()
    status.textContent = 'Scene imported.'
    redraw()
  } catch (error) {
    status.textContent = `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}
app.querySelector<HTMLButtonElement>('#circle')!.onclick = () => { const before = kit.getScene(); const after = addCircle(before, { id: crypto.randomUUID(), position: { x: 440, y: 240 }, radius: 44, fill: '#34D399' }); kit.execute({ label: 'add circle', execute: () => after, undo: () => before }); redraw() }
app.querySelector<HTMLButtonElement>('#text')!.onclick = () => { const before = kit.getScene(); const after = addText(before, { id: crypto.randomUUID(), position: { x: 200, y: 360 }, text: 'Editable text', fontSize: 20, fill: '#F4F6F8' }); kit.execute({ label: 'add text', execute: () => after, undo: () => before }); redraw() }
app.querySelector<HTMLButtonElement>('#connect')!.onclick = () => {
  const ids = kit.selection.get()
  if (ids.length === 2) {
    kit.createConnector({
      id: nextConnectorId(), sourceNodeId: ids[0]!, sourcePortId: 'east', targetNodeId: ids[1]!, targetPortId: 'west', routing: 'orthogonal',
    })
    redraw()
  }
}
