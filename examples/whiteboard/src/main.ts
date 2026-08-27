import { CanvasKit, addCircle, addGroup, addRectangle, addText, attachKeyboardInput, createScene, exportScene, hitTestNode, importScene, moveNodes, nodesInRect, type CanvasScene } from '@canvaskit/core'
import { CanvasRenderer } from '@canvaskit/renderer-canvas'
import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `<main><header><div><h1>Whiteboard</h1><p>Add, move, and group freeform ideas. Press Control/Command+A on the canvas to select all.</p></div><div class="toolbar" aria-label="Whiteboard actions"><button id="rectangle">Add rectangle</button><button id="circle">Add circle</button><button id="text">Add text</button><button id="group">Group selected shapes</button><button id="export">Export whiteboard</button><button id="import">Import whiteboard</button></div></header><canvas role="application" aria-label="Whiteboard canvas" aria-keyshortcuts="Control+A Meta+A Delete Backspace" tabindex="0"></canvas><section class="data" aria-label="Whiteboard data"><label>Whiteboard JSON<textarea id="json" aria-label="Whiteboard JSON"></textarea></label><p id="status" role="status" aria-live="polite"></p></section></main>`

const canvas = app.querySelector<HTMLCanvasElement>('canvas')!
canvas.width = 1_160
canvas.height = 560
const kit = new CanvasKit({ scene: addText(addCircle(addRectangle(createScene(), { id: 'note', position: { x: 170, y: 170 }, size: { width: 200, height: 120 }, fill: '#fbbf24' }), { id: 'circle', position: { x: 520, y: 230 }, radius: 64, fill: '#67e8f9' }), { id: 'caption', position: { x: 210, y: 215 }, text: 'Explore ideas', fontSize: 24, fill: '#17192a' }) })
const renderer = new CanvasRenderer(canvas)
const json = app.querySelector<HTMLTextAreaElement>('#json')!
const status = app.querySelector<HTMLParagraphElement>('#status')!
const redraw = () => renderer.render(kit.getScene(), kit.selection.get())

attachKeyboardInput(canvas, kit)
let dragStart: { x: number; y: number } | undefined
let marqueeStart: { x: number; y: number } | undefined
const worldPoint = (event: PointerEvent) => {
  const rect = canvas.getBoundingClientRect()
  return kit.createPointerEvent({ x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height }, event.type as 'pointerdown' | 'pointermove' | 'pointerup').world
}
canvas.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return
  const point = worldPoint(event)
  const node = hitTestNode(kit.getScene(), point)
  if (node) { kit.selection.select(node.id); dragStart = point } else { kit.selection.clear(); marqueeStart = point }
  redraw()
})
canvas.addEventListener('pointermove', (event) => {
  if (!dragStart || event.buttons !== 1) return
  const point = worldPoint(event); const before = kit.getScene(); const after = moveNodes(before, kit.selection.get(), { x: point.x - dragStart.x, y: point.y - dragStart.y })
  kit.execute({ label: 'move shapes', execute: () => after, undo: () => before }); dragStart = point; redraw()
})
canvas.addEventListener('pointerup', (event) => {
  if (marqueeStart) {
    const end = worldPoint(event); const x = Math.min(marqueeStart.x, end.x); const y = Math.min(marqueeStart.y, end.y)
    kit.selection.selectMultiple(nodesInRect(kit.getScene(), { x, y, width: Math.abs(end.x - marqueeStart.x), height: Math.abs(end.y - marqueeStart.y) }))
  }
  dragStart = undefined; marqueeStart = undefined; redraw()
})

const apply = (label: string, after: CanvasScene) => { const before = kit.getScene(); kit.execute({ label, execute: () => after, undo: () => before }); redraw() }
app.querySelector<HTMLButtonElement>('#rectangle')!.onclick = () => apply('add rectangle', addRectangle(kit.getScene(), { id: `rectangle-${kit.getScene().nodes.length + 1}`, position: { x: 720, y: 160 }, size: { width: 180, height: 110 }, fill: '#c4b5fd' }))
app.querySelector<HTMLButtonElement>('#circle')!.onclick = () => apply('add circle', addCircle(kit.getScene(), { id: `circle-${kit.getScene().nodes.length + 1}`, position: { x: 770, y: 350 }, radius: 52, fill: '#f9a8d4' }))
app.querySelector<HTMLButtonElement>('#text')!.onclick = () => apply('add text', addText(kit.getScene(), { id: `text-${kit.getScene().nodes.length + 1}`, position: { x: 760, y: 320 }, text: 'New thought', fontSize: 20, fill: '#f9fafb' }))
app.querySelector<HTMLButtonElement>('#group')!.onclick = () => {
  const selected = kit.selection.get()
  if (selected.length < 2) { status.textContent = 'Select at least two shapes before grouping.'; return }
  if (kit.getScene().groups.some((group) => group.id === 'idea-group')) { status.textContent = 'Selected shapes are already grouped.'; return }
  apply('group shapes', addGroup(kit.getScene(), { id: 'idea-group', nodeIds: selected })); status.textContent = 'Selected shapes grouped.'
}
app.querySelector<HTMLButtonElement>('#export')!.onclick = () => { json.value = exportScene(kit.getScene()); status.textContent = 'Whiteboard exported.' }
app.querySelector<HTMLButtonElement>('#import')!.onclick = () => {
  try { kit.setScene(importScene(json.value)); kit.selection.clear(); redraw(); status.textContent = 'Whiteboard imported.' } catch (error) { status.textContent = `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}` }
}
redraw()
