import { CanvasKit, addRectangle, createScene, attachPointerInput } from '@canvaskit/core'
import { CanvasRenderer } from '@canvaskit/renderer-canvas'
import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `<header><strong>CanvasKit Phase 1</strong><button id="save">Save scene</button><button id="load">Load scene</button></header><canvas aria-label="CanvasKit example"></canvas><textarea data-testid="scene-json" aria-label="Scene JSON"></textarea>`
const canvasElement = app.querySelector('canvas')!
canvasElement.width = 1200
canvasElement.height = 720
const kit = new CanvasKit({ scene: addRectangle(createScene(), { id: 'welcome', position: { x: 200, y: 160 }, size: { width: 260, height: 120 }, fill: '#7C7FF2' }) })
const renderer = new CanvasRenderer(canvasElement)
const redraw = () => renderer.render(kit.getScene())
attachPointerInput(canvasElement, kit)
kit.onPointer(redraw)
redraw()
const json = app.querySelector<HTMLTextAreaElement>('[data-testid="scene-json"]')!
app.querySelector<HTMLButtonElement>('#save')!.onclick = () => { json.value = kit.toJSON() }
app.querySelector<HTMLButtonElement>('#load')!.onclick = () => { kit.load(json.value); redraw() }
