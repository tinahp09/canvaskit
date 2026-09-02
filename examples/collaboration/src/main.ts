import { addRectangle, CanvasKit, type CollaborationOperation, type CollaborationTransport, type PresenceSnapshot } from '@canvaskit/core'
import { CanvasRenderer } from '@canvaskit/renderer-canvas'
import './style.css'

type Recipient = 'ada' | 'bea'

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `<main class="shell">
  <header class="topbar">
    <a class="brand" href="https://github.com/tinahp09/canvaskit" aria-label="CanvasKit home"><span class="brand-mark">◇</span><span><b>CanvasKit</b><small>Collaboration Foundation</small></span></a>
    <div class="protocol"><span class="pulse"></span> In-memory transport · Lamport ordering</div>
  </header>
  <section class="intro">
    <p class="eyebrow">REFERENCE IMPLEMENTATION</p>
    <h1>Two editors. One convergent scene.</h1>
    <p>Local scene changes travel through a host-owned transport. Disconnected clients queue snapshots, then safely converge after reconnecting.</p>
  </section>
  <section class="control-bar" aria-label="Collaboration controls">
    <div><button id="add-rectangle" class="primary">Ada: add rectangle</button><button id="recolor">Ada: recolor rectangle</button></div>
    <div><button id="disconnect">Disconnect Bea</button><button id="reconnect" disabled>Reconnect Bea</button><button id="newest-first" disabled>Deliver newest first</button></div>
  </section>
  <p id="status" class="status" role="status" aria-live="polite">Both editors are connected.</p>
  <section class="editors" aria-label="Collaborative editor clients">
    <article class="editor-card">
      <header><div><span class="avatar ada">A</span><div><h2>Ada</h2><p>Local author</p></div></div><span class="connection" id="ada-connection">Connected</span></header>
      <div class="canvas-frame"><canvas aria-label="Ada collaboration canvas"></canvas></div>
      <footer><span class="dot ada-dot"></span> <span id="ada-count">0 objects</span><ul aria-label="Ada canvas content" class="scene-content"></ul></footer>
    </article>
    <article class="editor-card">
      <header><div><span class="avatar bea">B</span><div><h2>Bea</h2><p>Remote collaborator</p></div></div><span class="connection" id="bea-connection">Connected</span></header>
      <div class="canvas-frame"><canvas aria-label="Bea collaboration canvas"></canvas></div>
      <footer><span class="dot bea-dot"></span> <span id="bea-count">0 objects</span><ul aria-label="Bea canvas content" class="scene-content"></ul></footer>
    </article>
  </section>
  <aside class="presence-card"><div><p class="eyebrow">EPHEMERAL PRESENCE</p><h2>Active collaborators</h2></div><ul aria-label="Active collaborators" id="presence"></ul></aside>
</main>`

const ada = new CanvasKit({ collaboration: { actorId: 'ada' } })
const bea = new CanvasKit({ collaboration: { actorId: 'bea' } })
const receivers = new Map<Recipient, Set<(operation: CollaborationOperation) => void>>([
  ['ada', new Set()],
  ['bea', new Set()],
])
let beaConnected = true
let queuedForBea: CollaborationOperation[] = []
let rectangleAdded = false
let rectangleBlue = false

const emit = (recipient: Recipient, operation: CollaborationOperation) => {
  receivers.get(recipient)!.forEach((listener) => listener(operation))
}

const createTransport = (author: Recipient, recipient: Recipient): CollaborationTransport => ({
  publish(operation) {
    if (recipient === 'bea' && !beaConnected) {
      queuedForBea.push(operation)
      render('Ada operation queued for Bea.')
      return
    }
    emit(recipient, operation)
    render(`${author === 'ada' ? 'Ada' : 'Bea'} operation delivered to ${recipient === 'bea' ? 'Bea' : 'Ada'}.`)
  },
  subscribe(listener) {
    receivers.get(author)!.add(listener)
    return () => receivers.get(author)!.delete(listener)
  },
})

ada.connectCollaboration(createTransport('ada', 'bea'))
bea.connectCollaboration(createTransport('bea', 'ada'))

const canvases = app.querySelectorAll<HTMLCanvasElement>('canvas')
const [adaCanvas, beaCanvas] = [...canvases]
for (const canvas of [adaCanvas, beaCanvas]) { canvas.width = 560; canvas.height = 310 }
const adaRenderer = new CanvasRenderer(adaCanvas)
const beaRenderer = new CanvasRenderer(beaCanvas)

const status = app.querySelector<HTMLParagraphElement>('#status')!
const presence = app.querySelector<HTMLUListElement>('#presence')!
const addButton = app.querySelector<HTMLButtonElement>('#add-rectangle')!
const recolorButton = app.querySelector<HTMLButtonElement>('#recolor')!
const disconnectButton = app.querySelector<HTMLButtonElement>('#disconnect')!
const reconnectButton = app.querySelector<HTMLButtonElement>('#reconnect')!
const newestFirstButton = app.querySelector<HTMLButtonElement>('#newest-first')!

function syncPresence(): void {
  const snapshots: PresenceSnapshot[] = [
    { actorId: 'ada', updatedAt: 1, selection: rectangleAdded ? ['ada-rectangle'] : [], metadata: { role: 'author' } },
    { actorId: 'bea', updatedAt: 1, selection: [], metadata: { role: beaConnected ? 'connected' : 'offline' } },
  ]
  for (const runtime of [ada.collaboration, bea.collaboration]) snapshots.forEach((snapshot) => runtime?.setPresence(snapshot))
}

function drawEditor(kit: CanvasKit, renderer: CanvasRenderer, actor: Recipient): void {
  const scene = kit.getScene()
  renderer.render(scene, kit.selection.get(), kit.transform.getOverlay(scene, kit.selection.get()))
  const items = app.querySelector<HTMLUListElement>(`[aria-label="${actor === 'ada' ? 'Ada' : 'Bea'} canvas content"]`)!
  items.replaceChildren(...scene.nodes.map((node) => {
    const item = document.createElement('li')
    item.textContent = `${node.type === 'rectangle' ? 'Rectangle' : node.type}: ${node.id}`
    if (node.type === 'rectangle') item.dataset.fill = node.fill
    return item
  }))
  app.querySelector<HTMLElement>(`#${actor}-count`)!.textContent = `${scene.nodes.length} ${scene.nodes.length === 1 ? 'object' : 'objects'}`
}

function render(nextStatus?: string): void {
  adaRenderer.render(ada.getScene(), ada.selection.get(), ada.transform.getOverlay(ada.getScene(), ada.selection.get()))
  drawEditor(bea, beaRenderer, 'bea')
  drawEditor(ada, adaRenderer, 'ada')
  syncPresence()
  presence.replaceChildren(...(ada.collaboration?.getPresence() ?? []).map((snapshot) => {
    const item = document.createElement('li')
    item.innerHTML = `<span class="avatar ${snapshot.actorId}">${snapshot.actorId.slice(0, 1).toUpperCase()}</span><span><b>${snapshot.actorId === 'ada' ? 'Ada' : 'Bea'}</b><small>${snapshot.metadata?.role === 'offline' ? 'Offline · queueing changes' : snapshot.metadata?.role === 'author' ? 'Editing rectangle' : 'Connected'}</small></span>`
    return item
  }))
  app.querySelector<HTMLElement>('#bea-connection')!.textContent = beaConnected ? 'Connected' : `Offline · ${queuedForBea.length} queued`
  app.querySelector<HTMLElement>('#bea-connection')!.classList.toggle('offline', !beaConnected)
  disconnectButton.disabled = !beaConnected
  reconnectButton.disabled = beaConnected
  newestFirstButton.disabled = beaConnected || queuedForBea.length < 2
  recolorButton.disabled = !rectangleAdded
  addButton.disabled = rectangleAdded
  if (nextStatus) status.textContent = nextStatus
}

function deliverQueued(newestFirst: boolean): void {
  const operations = newestFirst ? [...queuedForBea].reverse() : queuedForBea
  queuedForBea = []
  operations.forEach((operation) => emit('bea', operation))
  beaConnected = true
  render(newestFirst ? 'Newest queued operation delivered to Bea; stale snapshots were ignored.' : 'Queued operations delivered to Bea.')
}

ada.subscribe(() => render())
bea.subscribe(() => render())
addButton.onclick = () => {
  rectangleAdded = true
  ada.execute({
    label: 'Ada adds rectangle',
    execute: (scene) => addRectangle(scene, { id: 'ada-rectangle', position: { x: 155, y: 95 }, size: { width: 255, height: 122 }, fill: '#6d5dfc', stroke: '#c6c0ff', strokeWidth: 2 }),
    undo: (scene) => ({ ...scene, nodes: scene.nodes.filter((node) => node.id !== 'ada-rectangle') }),
  })
}
recolorButton.onclick = () => {
  rectangleBlue = !rectangleBlue
  ada.execute({
    label: 'Ada recolors rectangle',
    execute: (scene) => ({ ...scene, nodes: scene.nodes.map((node) => node.id === 'ada-rectangle' ? { ...node, fill: rectangleBlue ? '#1976f3' : '#6d5dfc' } : node) }),
    undo: (scene) => scene,
  })
}
disconnectButton.onclick = () => { beaConnected = false; render('Bea is disconnected. New Ada operations will queue.') }
reconnectButton.onclick = () => deliverQueued(false)
newestFirstButton.onclick = () => deliverQueued(true)

render()
