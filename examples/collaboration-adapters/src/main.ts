import { addRectangle, CanvasKit } from '@canvaskit/core'
import { BroadcastChannelTransport } from '@canvaskit/collaboration-adapters'
import './style.css'

const unavailable = new URLSearchParams(location.search).get('transport') === 'unavailable'
const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `<main><header><span class="mark">◇</span><div><b>CanvasKit</b><small>V5 · Production Collaboration Adapters</small></div></header><section><p class="eyebrow">BROADCASTCHANNEL REFERENCE</p><h1>Two peers. A real browser transport.</h1><p>Operations and presence travel through a versioned, room-scoped adapter without adding a server to Core.</p><button>Ada: add rectangle</button><p role="status">Connecting adapters…</p></section><section class="peers"><article><h2>Ada <em id="ada-status">idle</em></h2><ul aria-label="Ada canvas content"></ul></article><article><h2>Bea <em id="bea-status">idle</em></h2><ul aria-label="Bea canvas content"></ul></article></section><aside><h2>Active collaborators</h2><ul aria-label="Active collaborators"></ul></aside></main>`

const ada = new CanvasKit({ collaboration: { actorId: 'ada' } })
const bea = new CanvasKit({ collaboration: { actorId: 'bea' } })
const channelFactory = unavailable ? null : undefined
const adaTransport = new BroadcastChannelTransport({ roomId: 'v5-demo', senderId: 'ada', channelFactory })
const beaTransport = new BroadcastChannelTransport({ roomId: 'v5-demo', senderId: 'bea', channelFactory })
ada.connectCollaboration(adaTransport); bea.connectCollaboration(beaTransport)
const status = app.querySelector<HTMLElement>('[role=status]')!
function render(message?: string) {
  for (const [name, kit, transport] of [['Ada', ada, adaTransport], ['Bea', bea, beaTransport]] as const) {
    app.querySelector(`#${name.toLowerCase()}-status`)!.textContent = transport.status.state
    const list = app.querySelector<HTMLUListElement>(`[aria-label="${name} canvas content"]`)!
    list.replaceChildren(...kit.getScene().nodes.map((node) => Object.assign(document.createElement('li'), { textContent: `Rectangle: ${node.id}` })))
  }
  const presence = app.querySelector<HTMLUListElement>('[aria-label="Active collaborators"]')!
  presence.replaceChildren(...(ada.collaboration?.getPresence() ?? []).map((item) => Object.assign(document.createElement('li'), { textContent: item.actorId === 'ada' ? 'Ada' : 'Bea' })))
  if (message) status.textContent = message
}
ada.subscribe(() => render()); bea.subscribe(() => render())
adaTransport.subscribeStatus(() => render()); beaTransport.subscribeStatus(() => render())
adaTransport.connect(); beaTransport.connect()
if (unavailable) render('BroadcastChannel is unavailable.')
else {
  const adaPresence = { actorId: 'ada', updatedAt: Date.now(), selection: [] }
  const beaPresence = { actorId: 'bea', updatedAt: Date.now(), selection: [] }
  ada.collaboration?.setPresence(adaPresence)
  bea.collaboration?.setPresence(beaPresence)
  adaTransport.publishPresence(adaPresence)
  beaTransport.publishPresence(beaPresence)
  adaTransport.subscribePresence((event) => { if ('updatedAt' in event) ada.collaboration?.setPresence(event); render() })
  beaTransport.subscribePresence((event) => { if ('updatedAt' in event) bea.collaboration?.setPresence(event); render() })
  render('Both adapters are connected through BroadcastChannel.')
}
app.querySelector('button')!.onclick = () => { ada.execute({ label: 'Ada adds rectangle', execute: (scene) => addRectangle(scene, { id: 'ada-rectangle', position: { x: 80, y: 80 }, size: { width: 220, height: 100 }, fill: '#7c6cff' }), undo: (scene) => scene }); render('Ada operation delivered through BroadcastChannel.') }
