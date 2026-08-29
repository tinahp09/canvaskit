import { CanvasKit, addCircle, addRectangle, addText, attachKeyboardInput, attachPointerInput, connectNodes, createScene, exportScene, hitTestNode, importScene, moveNodes, type MarqueeMode, type SelectionMode, type TransformHandle } from '@canvaskit/core'
import { CanvasRenderer, exportPNG } from '@canvaskit/renderer-canvas'
import { renderSVG } from '@canvaskit/renderer-svg'
import { createGridPlugin, createSnapPlugin } from '@canvaskit/plugins'
import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `<header><strong>CanvasKit Phase 5 — Extensible export</strong><div class="toolbar" aria-label="Editor controls"><button id="circle">Add circle</button><button id="text">Add text</button><button id="connect">Connect selected</button><button id="undo">Undo</button><button id="redo">Redo</button><button id="copy">Copy</button><button id="cut">Cut</button><button id="paste">Paste</button><button id="duplicate">Duplicate</button><span class="toolbar-divider" aria-hidden="true"></span><button id="align-left">Align left</button><button id="align-center">Align center</button><button id="distribute-horizontal">Distribute horizontal</button><button id="export">Export scene</button><button id="import">Import scene</button><button id="export-svg">Export SVG</button><button id="export-png">Export PNG</button></div><span class="workflow-hint">Shift-click adds; Cmd/Ctrl-click toggles; drag empty space to marquee. Drag selection handles to resize.</span><fieldset class="plugin-controls"><legend>Plugins</legend><label><input id="show-grid" type="checkbox" checked> Show grid</label><label><input id="snap-to-grid" type="checkbox" checked> Snap to grid</label></fieldset></header><canvas role="application" aria-label="CanvasKit example" aria-keyshortcuts="Control+A Meta+A Control+C Meta+C Control+X Meta+X Control+V Meta+V Control+D Meta+D Delete Backspace Escape" tabindex="0"></canvas><section class="data-panels" aria-label="Scene and export data"><textarea data-testid="scene-json" aria-label="Scene JSON"></textarea><textarea data-testid="export-preview" aria-label="Export preview" readonly></textarea></section><p id="scene-status" role="status" aria-live="polite"></p>`
const canvasElement = app.querySelector('canvas')!
canvasElement.width = 1200
canvasElement.height = 720
const workflow = addRectangle(addRectangle(addRectangle(createScene(), { id: 'webhook', position: { x: 120, y: 180 }, size: { width: 150, height: 70 }, fill: '#7C7FF2' }), { id: 'request', position: { x: 400, y: 180 }, size: { width: 150, height: 70 }, fill: '#60A5FA' }), { id: 'database', position: { x: 680, y: 180 }, size: { width: 150, height: 70 }, fill: '#34D399' })
const kit = new CanvasKit({ scene: connectNodes(connectNodes(workflow, 'webhook', 'request'), 'request', 'database') })
const gridPlugin = createGridPlugin({ size: 20, style: 'dots', color: '#3A414D' })
const snapPlugin = createSnapPlugin({ gridSize: 20 })
kit.use(gridPlugin)
kit.use(snapPlugin)
const renderer = new CanvasRenderer(canvasElement)
const redraw = () => {
  const scene = kit.getScene()
  renderer.render(scene, kit.selection.get(), kit.transform.getOverlay(scene, kit.selection.get()))
}
attachPointerInput(canvasElement, kit)
attachKeyboardInput(canvasElement, kit)
kit.subscribe(redraw)
const showGrid = app.querySelector<HTMLInputElement>('#show-grid')!
const snapToGrid = app.querySelector<HTMLInputElement>('#snap-to-grid')!
const updateGrid = () => {
  canvasElement.style.backgroundImage = showGrid.checked
    ? `radial-gradient(${gridPlugin.config.color} 1px, transparent 1px)`
    : 'none'
  canvasElement.style.backgroundSize = `${gridPlugin.config.size}px ${gridPlugin.config.size}px`
}
showGrid.addEventListener('change', updateGrid)
updateGrid()
let dragStart: { x: number; y: number } | undefined
let marquee: { start: { x: number; y: number }; mode: MarqueeMode; selection: SelectionMode } | undefined
let connectionSource: string | undefined
let resizeHandle: Exclude<TransformHandle, 'rotate'> | undefined
let resizePreservesAspect = false
let resizeTransactionActive = false
const status = app.querySelector<HTMLParagraphElement>('#scene-status')!
const CONNECTION_HANDLE_OFFSET = 16
const TRANSFORM_HANDLE_HIT_RADIUS = 8
const connectionSourceAt = (screen: { x: number; y: number }) => kit.selection.get().map((id) => kit.getScene().nodes.find((node) => node.id === id)).find((node) => {
  if (!node) return false
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
      status.textContent = 'Persistent rotation is deferred in V2.0; the rotation handle is preview-only.'
      redraw()
      return
    }
    if (transformHandle) {
      resizeHandle = transformHandle
      resizePreservesAspect = Boolean(event.modifiers?.shiftKey)
      kit.beginTransaction('resize selection')
      resizeTransactionActive = true
      return
    }
    const source = connectionSourceAt(event.screen)
    if (source) { connectionSource = source.id; redraw(); return }
    const node = hitTestNode(kit.getScene(), event.world)
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
  } else if (event.type === 'pointermove' && resizeHandle && (event.buttons === undefined || (event.buttons & 1) !== 0)) {
    kit.resizeSelection(resizeHandle, event.world, { preserveAspectRatio: resizePreservesAspect })
  } else if (event.type === 'pointermove' && dragStart && (event.buttons === undefined || (event.buttons & 1) !== 0)) {
    const snapped = snapToGrid.checked ? snapPlugin.snap(event.world) : event.world
    const before = kit.getScene()
    const after = moveNodes(before, kit.selection.get(), { x: snapped.x - dragStart.x, y: snapped.y - dragStart.y })
    kit.execute({ label: 'move selection', execute: () => after, undo: () => before })
    dragStart = snapped
  } else if (event.type === 'pointerup') {
    if (event.button !== undefined && event.button !== 0) return
    if (resizeTransactionActive) {
      kit.commitTransaction()
      resizeTransactionActive = false
    }
    resizeHandle = undefined
    resizePreservesAspect = false
    if (connectionSource) {
      const target = hitTestNode(kit.getScene(), event.world)
      if (target && target.id !== connectionSource) {
        const before = kit.getScene()
        const after = connectNodes(before, connectionSource, target.id)
        kit.execute({ label: 'connect nodes', execute: () => after, undo: () => before })
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
    exportPreview.value = renderSVG(kit.getScene())
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
app.querySelector<HTMLButtonElement>('#connect')!.onclick = () => { const ids = kit.selection.get(); if (ids.length === 2) { const before = kit.getScene(); const after = connectNodes(before, ids[0]!, ids[1]!); kit.execute({ label: 'connect nodes', execute: () => after, undo: () => before }); redraw() } }
