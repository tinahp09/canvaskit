import { CanvasKit, attachPointerInput } from '@canvaskit/core'
import { CanvasRenderer } from '@canvaskit/renderer-canvas'
import { createSpatialIndexFixture } from '../../../benchmarks/spatial-index-fixture.js'
import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `
  <main>
    <header>
      <div>
        <h1>CanvasKit 10,000-node canvas</h1>
        <p>CanvasRenderer uses viewport culling while you pan and zoom.</p>
      </div>
      <div class="metrics" aria-live="polite">
        <span>Loaded: <strong data-testid="loaded-node-count">10,000</strong></span>
        <span>Visible: <strong data-testid="visible-node-count">0</strong></span>
        <span>Renderer draw set: <strong data-testid="rendered-visible-node-count">0</strong></span>
      </div>
    </header>
    <div class="controls" aria-label="Canvas controls">
      <button id="pan-left">Pan left</button>
      <button id="pan-right">Pan right</button>
      <button id="zoom-in">Zoom in</button>
      <button id="zoom-out">Zoom out</button>
      <button id="reset">Reset view</button>
    </div>
    <canvas aria-label="10,000 node canvas" tabindex="0"></canvas>
    <p role="status">Drag with the middle mouse button, use the wheel to zoom, or use the controls.</p>
  </main>
`

const canvas = app.querySelector<HTMLCanvasElement>('canvas')!
canvas.width = 1_200
canvas.height = 720
const kit = new CanvasKit({ scene: createSpatialIndexFixture(10_000) })
const renderer = new CanvasRenderer(canvas)
const visibleNodeCount = app.querySelector<HTMLElement>('[data-testid="visible-node-count"]')!
const renderedVisibleNodeCount = app.querySelector<HTMLElement>('[data-testid="rendered-visible-node-count"]')!

function redraw(): void {
  const scene = kit.getScene()
  const result = renderer.render(scene)
  visibleNodeCount.textContent = String(result.visibleNodeCount)
  renderedVisibleNodeCount.textContent = String(result.visibleNodeCount)
}

attachPointerInput(canvas, kit)
kit.onPointer(redraw)
app.querySelector<HTMLButtonElement>('#pan-left')!.onclick = () => { kit.viewport.panBy({ x: 800, y: 0 }); redraw() }
app.querySelector<HTMLButtonElement>('#pan-right')!.onclick = () => { kit.viewport.panBy({ x: -800, y: 0 }); redraw() }
app.querySelector<HTMLButtonElement>('#zoom-in')!.onclick = () => { kit.viewport.zoomAt({ x: canvas.width / 2, y: canvas.height / 2 }, 1.25); redraw() }
app.querySelector<HTMLButtonElement>('#zoom-out')!.onclick = () => { kit.viewport.zoomAt({ x: canvas.width / 2, y: canvas.height / 2 }, 0.8); redraw() }
app.querySelector<HTMLButtonElement>('#reset')!.onclick = () => { kit.viewport.reset(); redraw() }
redraw()
