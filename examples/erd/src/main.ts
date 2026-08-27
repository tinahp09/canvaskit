import { CanvasKit, addRectangle, addText, attachKeyboardInput, connectNodes, createScene, exportScene, hitTestNode, importScene, moveNodes, type CanvasScene } from '@canvaskit/core'
import { CanvasRenderer } from '@canvaskit/renderer-canvas'
import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `<main><header><div><h1>ERD editor</h1><p>Rectangle entities, text attributes, and directed relationship edges. Press Control/Command+A to select entities.</p></div><div class="toolbar" aria-label="ERD actions"><button id="entity">Add entity</button><button id="relationship">Connect selected entities</button><button id="export">Export ERD</button><button id="import">Import ERD</button></div></header><canvas role="img" aria-label="ERD canvas" tabindex="0"></canvas><section class="data" aria-label="ERD data"><label>ERD JSON<textarea id="json" aria-label="ERD JSON"></textarea></label><p id="status" role="status" aria-live="polite"></p></section></main>`

const canvas = app.querySelector<HTMLCanvasElement>('canvas')!
canvas.width = 1_160; canvas.height = 560
const initialScene = connectNodes(connectNodes(
  addText(addText(addText(addRectangle(addRectangle(addRectangle(createScene(), { id: 'customers', position: { x: 120, y: 150 }, size: { width: 190, height: 120 }, fill: '#2563eb' }), { id: 'orders', position: { x: 470, y: 150 }, size: { width: 190, height: 120 }, fill: '#7c3aed' }), { id: 'order-items', position: { x: 820, y: 150 }, size: { width: 190, height: 120 }, fill: '#0f766e' }), { id: 'customers-label', position: { x: 145, y: 195 }, text: 'customers', fontSize: 22, fill: '#f8fafc' }), { id: 'orders-label', position: { x: 500, y: 195 }, text: 'orders', fontSize: 22, fill: '#f8fafc' }), { id: 'order-items-label', position: { x: 845, y: 195 }, text: 'order_items', fontSize: 22, fill: '#f8fafc' }),
  'customers', 'orders'), 'orders', 'order-items')
const kit = new CanvasKit({ scene: initialScene })
const renderer = new CanvasRenderer(canvas)
const json = app.querySelector<HTMLTextAreaElement>('#json')!
const status = app.querySelector<HTMLParagraphElement>('#status')!
const redraw = () => renderer.render(kit.getScene(), kit.selection.get())
attachKeyboardInput(canvas, kit)

let dragStart: { x: number; y: number } | undefined
const worldPoint = (event: PointerEvent) => { const rect = canvas.getBoundingClientRect(); return kit.createPointerEvent({ x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height }, event.type as 'pointerdown' | 'pointermove' | 'pointerup').world }
canvas.addEventListener('pointerdown', (event) => { if (event.button !== 0) return; const point = worldPoint(event); const node = hitTestNode(kit.getScene(), point); if (node) { kit.selection.select(node.id); dragStart = point } else kit.selection.clear(); redraw() })
canvas.addEventListener('pointermove', (event) => { if (!dragStart || event.buttons !== 1) return; const point = worldPoint(event); const before = kit.getScene(); const after = moveNodes(before, kit.selection.get(), { x: point.x - dragStart.x, y: point.y - dragStart.y }); kit.execute({ label: 'move entity', execute: () => after, undo: () => before }); dragStart = point; redraw() })
canvas.addEventListener('pointerup', () => { dragStart = undefined })

const apply = (label: string, after: CanvasScene) => { const before = kit.getScene(); kit.execute({ label, execute: () => after, undo: () => before }); redraw() }
app.querySelector<HTMLButtonElement>('#entity')!.onclick = () => {
  const current = kit.getScene(); const id = 'payments'; const label = 'payments-label'
  if (current.nodes.some((node) => node.id === id)) { status.textContent = 'The payments entity is already on this ERD.'; return }
  apply('add payments entity', addText(addRectangle(current, { id, position: { x: 470, y: 360 }, size: { width: 190, height: 100 }, fill: '#be123c' }), { id: label, position: { x: 500, y: 405 }, text: 'payments', fontSize: 22, fill: '#f8fafc' }))
  status.textContent = 'Payments entity added.'
}
app.querySelector<HTMLButtonElement>('#relationship')!.onclick = () => {
  const selected = kit.selection.get().filter((id) => kit.getScene().nodes.find((node) => node.id === id)?.type === 'rectangle')
  if (selected.length !== 2) { status.textContent = 'Select exactly two entity rectangles to connect.'; return }
  apply('connect entities', connectNodes(kit.getScene(), selected[0]!, selected[1]!)); status.textContent = 'Relationship edge added.'
}
app.querySelector<HTMLButtonElement>('#export')!.onclick = () => { json.value = exportScene(kit.getScene()); status.textContent = 'ERD exported.' }
app.querySelector<HTMLButtonElement>('#import')!.onclick = () => { try { kit.setScene(importScene(json.value)); kit.selection.clear(); redraw(); status.textContent = 'ERD imported.' } catch (error) { status.textContent = `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}` } }
redraw()
