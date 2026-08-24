import { CanvasKit, addCircle, addRectangle, addText, attachKeyboardInput, attachPointerInput, createScene, hitTestNode, moveNodes, nodesInRect, snapPointToGrid } from '@canvaskit/core'
import { CanvasRenderer } from '@canvaskit/renderer-canvas'
import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `<header><strong>CanvasKit Phase 2</strong><button id="circle">Add circle</button><button id="text">Add text</button><button id="save">Save scene</button><button id="load">Load scene</button></header><canvas aria-label="CanvasKit example" tabindex="0"></canvas><textarea data-testid="scene-json" aria-label="Scene JSON"></textarea>`
const canvasElement = app.querySelector('canvas')!
canvasElement.width = 1200
canvasElement.height = 720
const kit = new CanvasKit({ scene: addRectangle(createScene(), { id: 'welcome', position: { x: 200, y: 160 }, size: { width: 260, height: 120 }, fill: '#7C7FF2' }) })
const renderer = new CanvasRenderer(canvasElement)
const redraw = () => renderer.render(kit.getScene())
attachPointerInput(canvasElement, kit)
attachKeyboardInput(canvasElement, kit)
kit.onPointer(redraw)
let dragStart: { x: number; y: number } | undefined
let marqueeStart: { x: number; y: number } | undefined
canvasElement.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return
  const rect = canvasElement.getBoundingClientRect()
  const point = kit.createPointerEvent({ x: event.clientX - rect.left, y: event.clientY - rect.top }, 'pointerdown').world
  const node = hitTestNode(kit.getScene(), point)
  if (node) { kit.selection.select(node.id); dragStart = point } else { kit.selection.clear(); marqueeStart = point }
  redraw()
})
canvasElement.addEventListener('pointermove', (event) => {
  if (!dragStart || event.buttons !== 1) return
  const rect = canvasElement.getBoundingClientRect()
  const point = kit.createPointerEvent({ x: event.clientX - rect.left, y: event.clientY - rect.top }, 'pointermove').world
  const snapped = snapPointToGrid(point, 20)
  kit.setScene(moveNodes(kit.getScene(), kit.selection.get(), { x: snapped.x - dragStart.x, y: snapped.y - dragStart.y }))
  dragStart = snapped
  redraw()
})
canvasElement.addEventListener('pointerup', (event) => {
  if (marqueeStart) {
    const rect = canvasElement.getBoundingClientRect()
    const end = kit.createPointerEvent({ x: event.clientX - rect.left, y: event.clientY - rect.top }, 'pointerup').world
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
