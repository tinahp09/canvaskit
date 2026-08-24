import { CanvasKit, addCircle, addRectangle, addText, attachKeyboardInput, attachPointerInput, connectNodes, createScene, hitTestNode, moveNodes, nodesInRect, snapPointToGrid } from '@canvaskit/core'
import { CanvasRenderer } from '@canvaskit/renderer-canvas'
import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `<header><strong>CanvasKit Phase 3 — Workflow</strong><button id="circle">Add circle</button><button id="text">Add text</button><button id="connect">Connect selected</button><button id="save">Save scene</button><button id="load">Load scene</button></header><canvas aria-label="CanvasKit example" tabindex="0"></canvas><textarea data-testid="scene-json" aria-label="Scene JSON"></textarea>`
const canvasElement = app.querySelector('canvas')!
canvasElement.width = 1200
canvasElement.height = 720
const workflow = addRectangle(addRectangle(addRectangle(createScene(), { id: 'webhook', position: { x: 120, y: 180 }, size: { width: 150, height: 70 }, fill: '#7C7FF2' }), { id: 'request', position: { x: 400, y: 180 }, size: { width: 150, height: 70 }, fill: '#60A5FA' }), { id: 'database', position: { x: 680, y: 180 }, size: { width: 150, height: 70 }, fill: '#34D399' })
const kit = new CanvasKit({ scene: connectNodes(connectNodes(workflow, 'webhook', 'request'), 'request', 'database') })
const renderer = new CanvasRenderer(canvasElement)
const redraw = () => renderer.render(kit.getScene(), kit.selection.get())
attachPointerInput(canvasElement, kit)
attachKeyboardInput(canvasElement, kit)
kit.onPointer(redraw)
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
  const snapped = snapPointToGrid(point, 20)
  kit.setScene(moveNodes(kit.getScene(), kit.selection.get(), { x: snapped.x - dragStart.x, y: snapped.y - dragStart.y }))
  dragStart = snapped
  redraw()
})
canvasElement.addEventListener('pointerup', (event) => {
  const point = worldPoint(event)
  if (connectionSource) {
    const target = hitTestNode(kit.getScene(), point)
    if (target && target.id !== connectionSource) kit.setScene(connectNodes(kit.getScene(), connectionSource, target.id))
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
app.querySelector<HTMLButtonElement>('#save')!.onclick = () => { json.value = kit.toJSON() }
app.querySelector<HTMLButtonElement>('#load')!.onclick = () => { kit.load(json.value); redraw() }
app.querySelector<HTMLButtonElement>('#circle')!.onclick = () => { kit.setScene(addCircle(kit.getScene(), { id: crypto.randomUUID(), position: { x: 440, y: 240 }, radius: 44, fill: '#34D399' })); redraw() }
app.querySelector<HTMLButtonElement>('#text')!.onclick = () => { kit.setScene(addText(kit.getScene(), { id: crypto.randomUUID(), position: { x: 200, y: 360 }, text: 'Editable text', fontSize: 20, fill: '#F4F6F8' })); redraw() }
app.querySelector<HTMLButtonElement>('#connect')!.onclick = () => { const ids = kit.selection.get(); if (ids.length === 2) { kit.setScene(connectNodes(kit.getScene(), ids[0]!, ids[1]!)); redraw() } }
