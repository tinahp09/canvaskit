import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { CanvasKit, addRectangle, createScene } from '@canvaskit/core'
import { CanvasKitCanvas, CanvasKitProvider, useCanvasScene } from '@canvaskit/react'
import { exportPNG } from '@canvaskit/renderer-canvas'
import { renderSVG } from '@canvaskit/renderer-svg'
import './style.css'

const defaultScene = addRectangle(createScene(), {
  id: 'welcome',
  position: { x: 260, y: 180 },
  size: { width: 260, height: 120 },
  fill: '#7c7ff2',
})

function CanvasExample() {
  const scene = useCanvasScene()
  const host = useRef<HTMLElement>(null)
  const [exportPreview, setExportPreview] = useState('')

  const exportPng = () => {
    const element = host.current?.querySelector('canvas')
    if (element) setExportPreview(exportPNG(element))
  }

  return (
    <main ref={host}>
      <header>
        <strong>CanvasKit React</strong>
        <p role="status" aria-live="polite">Nodes: {scene.nodes.length}</p>
        <div className="toolbar" aria-label="Export controls">
          <button type="button" onClick={() => setExportPreview(renderSVG(scene))}>Export SVG</button>
          <button type="button" onClick={exportPng}>Export PNG</button>
        </div>
      </header>
      <CanvasKitCanvas width={960} height={540} />
      <label className="preview-label">
        Export preview
        <textarea value={exportPreview} readOnly onChange={() => undefined} />
      </label>
    </main>
  )
}

function App() {
  const [canvas] = useState(() => new CanvasKit({ scene: defaultScene }))

  useEffect(() => () => canvas.dispose(), [canvas])

  return <CanvasKitProvider canvas={canvas}><CanvasExample /></CanvasKitProvider>
}

createRoot(document.querySelector<HTMLDivElement>('#app')!).render(<App />)
