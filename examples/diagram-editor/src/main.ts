import { addConnector, addRectangle, CanvasKit, createScene, DiagramRuntime, InspectorRuntime } from '@canvaskit/core'
import { CanvasRenderer } from '@canvaskit/renderer-canvas'
import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `<main class="shell"><aside><div class="brand"><span class="mark">◇</span><div><strong>CanvasKit</strong><small>Diagram Editor Runtime</small></div></div><nav aria-label="Editor tools"><button data-tool="select" class="active">⌁ Select</button><button data-tool="pan">◌ Pan</button><button data-tool="rectangle">▭ Rectangle</button><button data-tool="text">T Text</button><button data-tool="connector">↗ Connector</button></nav><div class="layers"><span>LAYERS</span><button id="group">⊞ Group selection</button><button id="snap">⌘ Smart snap</button></div></aside><section class="workspace"><header><div><span class="crumb">Projects / Platform architecture</span><h1>Order processing flow</h1></div><div class="actions"><button id="undo">↶</button><button id="redo">↷</button><button id="command">⌘K Commands</button><button class="share">Share</button></div></header><div class="canvas-wrap"><canvas role="application" aria-label="Professional diagram canvas" tabindex="0"></canvas><div class="canvas-note">Use tools, select nodes, then inspect and connect.</div></div></section><aside class="inspector"><p class="eyebrow">INSPECTOR</p><h2 id="selection-name">Nothing selected</h2><label>Fill <input id="fill" type="color" value="#7c7ff2"></label><button id="apply-fill">Apply fill</button><hr><p class="eyebrow">COMMANDS</p><div id="palette"></div><p id="status" role="status" aria-live="polite"></p></aside></main>`

let scene = createScene()
scene = addRectangle(scene, { id: 'trigger', position: { x: 110, y: 220 }, size: { width: 170, height: 78 }, fill: '#7c7ff2' })
scene = addRectangle(scene, { id: 'orders', position: { x: 385, y: 220 }, size: { width: 170, height: 78 }, fill: '#38bdf8' })
scene = addRectangle(scene, { id: 'ledger', position: { x: 660, y: 220 }, size: { width: 170, height: 78 }, fill: '#34d399' })
scene = addConnector(addConnector(scene, { id: 'trigger-orders', sourceNodeId: 'trigger', sourcePortId: 'east', targetNodeId: 'orders', targetPortId: 'west', routing: 'orthogonal', label: 'create' }), { id: 'orders-ledger', sourceNodeId: 'orders', sourcePortId: 'east', targetNodeId: 'ledger', targetPortId: 'west', routing: 'orthogonal', label: 'persist' })
const kit = new CanvasKit({ scene })
const diagram = new DiagramRuntime([{ id: 'flow', source: { nodeTypes: ['rectangle'], ports: ['east'] }, target: { nodeTypes: ['rectangle'], ports: ['west'] } }])
const inspector = new InspectorRuntime([{ id: 'fill', label: 'Fill', nodeTypes: ['rectangle'], read: (node) => node.fill, write: (node, value: string) => ({ ...node, fill: value }) }])
const canvas = app.querySelector<HTMLCanvasElement>('canvas')!
canvas.width = 960; canvas.height = 620
const renderer = new CanvasRenderer(canvas)
const status = app.querySelector<HTMLParagraphElement>('#status')!
const selectionName = app.querySelector<HTMLHeadingElement>('#selection-name')!
const fill = app.querySelector<HTMLInputElement>('#fill')!
const redraw = () => { renderer.render(kit.getScene(), kit.selection.get(), kit.transform.getOverlay(kit.getScene(), kit.selection.get())); const selected = kit.selection.get(); selectionName.textContent = selected.length ? selected.join(', ') : 'Nothing selected'; const value = inspector.read<string>(kit.getScene(), selected, 'fill'); if (value?.kind === 'value') fill.value = value.value }
kit.subscribe(redraw)
for (const button of app.querySelectorAll<HTMLButtonElement>('[data-tool]')) button.onclick = () => { kit.setTool(button.dataset.tool as 'select' | 'pan' | 'rectangle' | 'text' | 'connector'); app.querySelectorAll('[data-tool]').forEach((item) => item.classList.toggle('active', item === button)); status.textContent = `${button.dataset.tool} tool active.` }
canvas.addEventListener('pointerdown', (event) => { const rect = canvas.getBoundingClientRect(); const point = kit.createPointerEvent({ x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height }, 'pointerdown').world; const node = kit.getScene().nodes.find((item) => point.x >= item.position.x && point.x <= item.position.x + (item.type === 'circle' ? item.radius * 2 : item.type === 'text' ? item.text.length * item.fontSize : item.size.width) && point.y >= item.position.y - (item.type === 'text' ? item.fontSize : 0) && point.y <= item.position.y + (item.type === 'circle' ? item.radius * 2 : item.type === 'text' ? 0 : item.size.height)); if (node && (event.shiftKey || event.metaKey || event.ctrlKey)) kit.selection.toggle([node.id]); else if (node) kit.selection.select(node.id); else kit.selection.clear(); redraw() })
app.querySelector<HTMLButtonElement>('#apply-fill')!.onclick = () => { const before = kit.getScene(); const after = inspector.apply(before, kit.selection.get(), 'fill', fill.value); if (JSON.stringify(before) !== JSON.stringify(after)) kit.execute({ label: 'apply fill', execute: () => after, undo: () => before }); status.textContent = 'Fill applied.' }
app.querySelector<HTMLButtonElement>('#group')!.onclick = () => { status.textContent = kit.groupSelection() ? 'Selection grouped.' : 'Select nodes to group.' }
app.querySelector<HTMLButtonElement>('#snap')!.onclick = () => { const result = kit.snapSelection({ x: 8, y: 0 }); status.textContent = result.activeGuides.length ? 'Smart snap preview active.' : 'No snap target nearby.' }
app.querySelector<HTMLButtonElement>('#undo')!.onclick = () => { kit.undo(); status.textContent = 'Undone.' }
app.querySelector<HTMLButtonElement>('#redo')!.onclick = () => { kit.redo(); status.textContent = 'Redone.' }
kit.registerCommand({ id: 'connect-flow', label: 'Connect selected flow', shortcut: 'Meta+Enter', isAvailable: (editor) => editor.selection.get().length === 2, run: (editor) => { const [sourceNodeId, targetNodeId] = editor.selection.get(); const input = { id: `flow-${editor.getScene().connectors.length + 1}`, sourceNodeId: sourceNodeId!, sourcePortId: 'east', targetNodeId: targetNodeId!, targetPortId: 'west', routing: 'orthogonal' as const }; if (diagram.canConnect(editor.getScene(), input)) editor.createConnector(input) } })
const palette = app.querySelector<HTMLDivElement>('#palette')!
const refreshPalette = () => { palette.replaceChildren(...kit.getCommandPalette().map((command) => { const button = document.createElement('button'); button.textContent = `${command.label}${command.shortcut ? ` · ${command.shortcut}` : ''}`; button.onclick = () => kit.executeRegisteredCommand(command.id); return button })) }
app.querySelector<HTMLButtonElement>('#command')!.onclick = refreshPalette
redraw(); refreshPalette()
