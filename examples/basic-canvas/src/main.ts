import { CanvasKit, addCircle, addRectangle, addText, attachKeyboardInput, attachPointerInput, connectNodes, createScene, exportScene, hitTestNode, importScene, moveNodes, nodesInRect } from '@canvaskit/core'
import { CanvasRenderer, exportPNG } from '@canvaskit/renderer-canvas'
import { renderSVG } from '@canvaskit/renderer-svg'
import { createGridPlugin, createSnapPlugin } from '@canvaskit/plugins'
import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `<header><strong>CanvasKit Phase 5 — Extensible export</strong><div class="toolbar" aria-label="Editor controls"><button id="circle">Add circle</button><button id="text">Add text</button><button id="connect">Connect selected</button><button id="undo">Undo</button><button id="redo">Redo</button><button id="copy">Copy</button><button id="paste">Paste</button><button id="duplicate">Duplicate</button><button id="export">Export scene</button><button id="import">Import scene</button><button id="export-svg">Export SVG</button><button id="export-png">Export PNG</button></div><fieldset class="plugin-controls"><legend>Plugins</legend><label><input id="show-grid" type="checkbox" checked> Show grid</label><label><input id="snap-to-grid" type="checkbox" checked> Snap to grid</label></fieldset></header><canvas role="application" aria-label="CanvasKit example" aria-keyshortcuts="Control+A Meta+A Delete Backspace" tabindex="0"></canvas><section class="data-panels" aria-label="Scene and export data"><textarea data-testid="scene-json" aria-label="Scene JSON"></textarea><textarea data-testid="export-preview" aria-label="Export preview" readonly></textarea></section><p id="scene-status" role="status" aria-live="polite"></p>`
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
const redraw = () => renderer.render(kit.getScene(), kit.selection.get())
attachPointerInput(canvasElement, kit)
attachKeyboardInput(canvasElement, kit)
kit.onPointer(redraw)
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
let marqueeStart: { x: number; y: number } | undefined
let connectionSource: string | undefined
const worldPoint = (event: PointerEvent) => {
  const rect = canvasElement.getBoundingClientRect()
  return kit.createPointerEvent({ x: (event.clientX - rect.left) * canvasElement.width / rect.width, y: (event.clientY - rect.top) * canvasElement.height / rect.height }, event.type as 'pointerdown' | 'pointermove' | 'pointerup').world
}
const connectionSourceAt = (point: { x: number; y: number }) => kit.selection.get().map((id) => kit.getScene().nodes.find((node) => node.id === id)).find((node) => {
  if (!node) return false
  const handle = node.type === 'rectangle'
    ? { x: node.position.x + node.size.width, y: node.position.y + node.size.height / 2 }
    : node.type === 'circle'
      ? { x: node.position.x + node.radius, y: node.position.y }
      : { x: node.position.x + node.text.length * node.fontSize, y: node.position.y - node.fontSize / 2 }
  return Math.hypot(point.x - handle.x, point.y - handle.y) <= 8
})
canvasElement.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return
  const point = worldPoint(event)
  const source = connectionSourceAt(point)
  if (source) { connectionSource = source.id; redraw(); return }
  const node = hitTestNode(kit.getScene(), point)
  if (node) { kit.selection.select(node.id); dragStart = point } else { kit.selection.clear(); marqueeStart = point }
  redraw()
})
canvasElement.addEventListener('pointermove', (event) => {
  if (!dragStart || event.buttons !== 1) return
  const point = worldPoint(event)
  const snapped = snapToGrid.checked ? snapPlugin.snap(point) : point
  const before = kit.getScene()
  const after = moveNodes(before, kit.selection.get(), { x: snapped.x - dragStart.x, y: snapped.y - dragStart.y })
  kit.execute({ label: 'move selection', execute: () => after, undo: () => before })
  dragStart = snapped
  redraw()
})
canvasElement.addEventListener('pointerup', (event) => {
  const point = worldPoint(event)
  if (connectionSource) {
    const target = hitTestNode(kit.getScene(), point)
    if (target && target.id !== connectionSource) {
      const before = kit.getScene()
      const after = connectNodes(before, connectionSource, target.id)
      kit.execute({ label: 'connect nodes', execute: () => after, undo: () => before })
    }
    connectionSource = undefined
  }
  if (marqueeStart) {
    const end = point
    const x = Math.min(marqueeStart.x, end.x); const y = Math.min(marqueeStart.y, end.y)
    kit.selection.selectMultiple(nodesInRect(kit.getScene(), { x, y, width: Math.abs(end.x - marqueeStart.x), height: Math.abs(end.y - marqueeStart.y) }))
  }
  dragStart = undefined; marqueeStart = undefined; redraw()
})
redraw()
const json = app.querySelector<HTMLTextAreaElement>('[data-testid="scene-json"]')!
const exportPreview = app.querySelector<HTMLTextAreaElement>('[data-testid="export-preview"]')!
const status = app.querySelector<HTMLParagraphElement>('#scene-status')!
app.querySelector<HTMLButtonElement>('#undo')!.onclick = () => { kit.undo(); redraw() }
app.querySelector<HTMLButtonElement>('#redo')!.onclick = () => { kit.redo(); redraw() }
app.querySelector<HTMLButtonElement>('#copy')!.onclick = () => { kit.copy() }
app.querySelector<HTMLButtonElement>('#paste')!.onclick = () => { kit.paste(); redraw() }
app.querySelector<HTMLButtonElement>('#duplicate')!.onclick = () => { kit.duplicate(); redraw() }
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
