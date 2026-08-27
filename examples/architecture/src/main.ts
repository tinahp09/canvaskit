import { CanvasKit, addRectangle, addText, attachKeyboardInput, connectNodes, createScene, exportScene, hitTestNode, importScene, moveNodes, type CanvasScene } from '@canvaskit/core'
import { CanvasRenderer } from '@canvaskit/renderer-canvas'
import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `<main><header><div><h1>Service architecture</h1><p>Model service dependencies. Press Control/Command+A on the canvas to select services.</p></div><div class="toolbar" aria-label="Architecture actions"><button id="service">Add service</button><button id="dependency">Connect selected services</button><button id="export">Export architecture</button><button id="import">Import architecture</button></div></header><canvas role="application" aria-label="Architecture canvas" aria-describedby="architecture-services" aria-keyshortcuts="Control+A Meta+A Delete Backspace" tabindex="0"></canvas><ul id="architecture-services" class="visually-hidden" aria-label="Services on architecture canvas"></ul><section class="data" aria-label="Architecture data"><label>Architecture JSON<textarea id="json" aria-label="Architecture JSON"></textarea></label><p id="status" role="status" aria-live="polite"></p></section></main>`

const canvas = app.querySelector<HTMLCanvasElement>('canvas')!
canvas.width = 1_160; canvas.height = 560
const initialScene = (() => {
  let scene = createScene()
  scene = addRectangle(scene, { id: 'gateway', position: { x: 110, y: 210 }, size: { width: 170, height: 92 }, fill: '#0284c7' })
  scene = addRectangle(scene, { id: 'catalog', position: { x: 410, y: 105 }, size: { width: 170, height: 92 }, fill: '#4f46e5' })
  scene = addRectangle(scene, { id: 'orders', position: { x: 410, y: 315 }, size: { width: 170, height: 92 }, fill: '#ea580c' })
  scene = addRectangle(scene, { id: 'database', position: { x: 760, y: 315 }, size: { width: 170, height: 92 }, fill: '#0f766e' })
  scene = addText(scene, { id: 'gateway-label', position: { x: 138, y: 264 }, text: 'Gateway', fontSize: 22, fill: '#ecfeff' })
  scene = addText(scene, { id: 'catalog-label', position: { x: 438, y: 159 }, text: 'Catalog', fontSize: 22, fill: '#ecfeff' })
  scene = addText(scene, { id: 'orders-label', position: { x: 438, y: 369 }, text: 'Orders', fontSize: 22, fill: '#ecfeff' })
  scene = addText(scene, { id: 'database-label', position: { x: 788, y: 369 }, text: 'Database', fontSize: 22, fill: '#ecfeff' })
  return connectNodes(connectNodes(connectNodes(scene, 'gateway', 'catalog'), 'gateway', 'orders'), 'orders', 'database')
})()
const kit = new CanvasKit({ scene: initialScene })
const renderer = new CanvasRenderer(canvas)
const json = app.querySelector<HTMLTextAreaElement>('#json')!
const status = app.querySelector<HTMLParagraphElement>('#status')!
const services = app.querySelector<HTMLUListElement>('#architecture-services')!
const describeService = (name: string) => { const item = document.createElement('li'); item.textContent = name; services.append(item) }
for (const service of ['Gateway', 'Catalog', 'Orders', 'Database']) describeService(service)
const redraw = () => renderer.render(kit.getScene(), kit.selection.get())
attachKeyboardInput(canvas, kit)

let dragStart: { x: number; y: number } | undefined
const worldPoint = (event: PointerEvent) => { const rect = canvas.getBoundingClientRect(); return kit.createPointerEvent({ x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height }, event.type as 'pointerdown' | 'pointermove' | 'pointerup').world }
canvas.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return
  const point = worldPoint(event)
  const node = hitTestNode(kit.getScene(), point)
  const id = node?.type === 'text' ? node.id.replace(/-label$/, '') : node?.id
  if (id && kit.getScene().nodes.some((candidate) => candidate.id === id)) {
    if (event.shiftKey || event.metaKey || event.ctrlKey) kit.selection.selectMultiple([id])
    else kit.selection.select(id)
    dragStart = point
  } else kit.selection.clear()
  redraw()
})
canvas.addEventListener('pointermove', (event) => { if (!dragStart || event.buttons !== 1) return; const point = worldPoint(event); const before = kit.getScene(); const after = moveNodes(before, kit.selection.get(), { x: point.x - dragStart.x, y: point.y - dragStart.y }); kit.execute({ label: 'move service', execute: () => after, undo: () => before }); dragStart = point; redraw() })
canvas.addEventListener('pointerup', () => { dragStart = undefined })

const apply = (label: string, after: CanvasScene) => { const before = kit.getScene(); kit.execute({ label, execute: () => after, undo: () => before }); redraw() }
app.querySelector<HTMLButtonElement>('#service')!.onclick = () => {
  const current = kit.getScene()
  if (current.nodes.some((node) => node.id === 'notifications')) { status.textContent = 'Notifications service is already on this architecture.'; return }
  apply('add notifications service', addText(addRectangle(current, { id: 'notifications', position: { x: 760, y: 105 }, size: { width: 170, height: 92 }, fill: '#9333ea' }), { id: 'notifications-label', position: { x: 788, y: 159 }, text: 'Notifications', fontSize: 22, fill: '#ecfeff' }))
  describeService('Notifications')
  status.textContent = 'Notifications service added.'
}
app.querySelector<HTMLButtonElement>('#dependency')!.onclick = () => {
  const selected = kit.selection.get()
  if (selected.length !== 2) { status.textContent = 'Select exactly two services to connect.'; return }
  apply('connect services', connectNodes(kit.getScene(), selected[0]!, selected[1]!)); status.textContent = 'Service dependency added.'
}
app.querySelector<HTMLButtonElement>('#export')!.onclick = () => { json.value = exportScene(kit.getScene()); status.textContent = 'Architecture exported.' }
app.querySelector<HTMLButtonElement>('#import')!.onclick = () => { try { kit.setScene(importScene(json.value)); kit.selection.clear(); redraw(); status.textContent = 'Architecture imported.' } catch (error) { status.textContent = `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}` } }
redraw()
