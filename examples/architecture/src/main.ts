import { CanvasKit, addRectangle, attachKeyboardInput, connectNodes, createScene, exportScene, hitTestNode, importScene, moveNodes, type CanvasScene } from '@canvaskit/core'
import { CanvasRenderer } from '@canvaskit/renderer-canvas'
import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `<main><header><div><h1>Service architecture</h1><p>Model service dependencies. Press Control/Command+A on the canvas to select services.</p></div><div class="toolbar" aria-label="Architecture actions"><button id="service">Add service</button><button id="dependency">Connect selected services</button><button id="export">Export architecture</button><button id="import">Import architecture</button></div></header><canvas role="application" aria-label="Architecture canvas" aria-keyshortcuts="Control+A Meta+A Delete Backspace" tabindex="0"></canvas><section class="data" aria-label="Architecture data"><label>Architecture JSON<textarea id="json" aria-label="Architecture JSON"></textarea></label><p id="status" role="status" aria-live="polite"></p></section></main>`

const canvas = app.querySelector<HTMLCanvasElement>('canvas')!
canvas.width = 1_160; canvas.height = 560
const initialScene = connectNodes(connectNodes(connectNodes(
  addRectangle(addRectangle(addRectangle(addRectangle(createScene(), { id: 'gateway', position: { x: 110, y: 210 }, size: { width: 170, height: 92 }, fill: '#0284c7' }), { id: 'catalog', position: { x: 410, y: 105 }, size: { width: 170, height: 92 }, fill: '#4f46e5' }), { id: 'orders', position: { x: 410, y: 315 }, size: { width: 170, height: 92 }, fill: '#ea580c' }), { id: 'database', position: { x: 760, y: 315 }, size: { width: 170, height: 92 }, fill: '#0f766e' }),
  'gateway', 'catalog'), 'gateway', 'orders'), 'orders', 'database')
const kit = new CanvasKit({ scene: initialScene })
const renderer = new CanvasRenderer(canvas)
const json = app.querySelector<HTMLTextAreaElement>('#json')!
const status = app.querySelector<HTMLParagraphElement>('#status')!
const redraw = () => renderer.render(kit.getScene(), kit.selection.get())
attachKeyboardInput(canvas, kit)

let dragStart: { x: number; y: number } | undefined
const worldPoint = (event: PointerEvent) => { const rect = canvas.getBoundingClientRect(); return kit.createPointerEvent({ x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height }, event.type as 'pointerdown' | 'pointermove' | 'pointerup').world }
canvas.addEventListener('pointerdown', (event) => { if (event.button !== 0) return; const point = worldPoint(event); const node = hitTestNode(kit.getScene(), point); if (node) { kit.selection.select(node.id); dragStart = point } else kit.selection.clear(); redraw() })
canvas.addEventListener('pointermove', (event) => { if (!dragStart || event.buttons !== 1) return; const point = worldPoint(event); const before = kit.getScene(); const after = moveNodes(before, kit.selection.get(), { x: point.x - dragStart.x, y: point.y - dragStart.y }); kit.execute({ label: 'move service', execute: () => after, undo: () => before }); dragStart = point; redraw() })
canvas.addEventListener('pointerup', () => { dragStart = undefined })

const apply = (label: string, after: CanvasScene) => { const before = kit.getScene(); kit.execute({ label, execute: () => after, undo: () => before }); redraw() }
app.querySelector<HTMLButtonElement>('#service')!.onclick = () => {
  const current = kit.getScene()
  if (current.nodes.some((node) => node.id === 'notifications')) { status.textContent = 'Notifications service is already on this architecture.'; return }
  apply('add notifications service', addRectangle(current, { id: 'notifications', position: { x: 760, y: 105 }, size: { width: 170, height: 92 }, fill: '#9333ea' })); status.textContent = 'Notifications service added.'
}
app.querySelector<HTMLButtonElement>('#dependency')!.onclick = () => {
  const selected = kit.selection.get()
  if (selected.length !== 2) { status.textContent = 'Select exactly two services to connect.'; return }
  apply('connect services', connectNodes(kit.getScene(), selected[0]!, selected[1]!)); status.textContent = 'Service dependency added.'
}
app.querySelector<HTMLButtonElement>('#export')!.onclick = () => { json.value = exportScene(kit.getScene()); status.textContent = 'Architecture exported.' }
app.querySelector<HTMLButtonElement>('#import')!.onclick = () => { try { kit.setScene(importScene(json.value)); kit.selection.clear(); redraw(); status.textContent = 'Architecture imported.' } catch (error) { status.textContent = `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}` } }
redraw()
