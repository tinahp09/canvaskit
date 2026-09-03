import { addRectangle, CanvasKit, EditorSession } from '@canvaskit/core'
import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `
  <main class="editor-shell">
    <header class="topbar glass">
      <div class="brand"><span class="brand-mark">C</span><div><strong>CanvasKit</strong><small>V6 · Editor Session</small></div></div>
      <div class="topbar-actions"><button id="save" class="secondary">Save active</button><button id="palette-open" class="primary">Open command palette <kbd>⌘ K</kbd></button></div>
    </header>
    <section class="workspace glass">
      <div class="workspace-head"><div><p class="eyebrow">MULTI-DOCUMENT WORKSPACE</p><h1>Keep focused work in context.</h1></div><p id="live-status" role="status" aria-live="polite">Ready</p></div>
      <div class="tabs" role="tablist" aria-label="Open documents"></div>
      <section class="stage" role="tabpanel" aria-live="polite">
        <div class="stage-grid"><div class="canvas-content"></div></div>
        <div class="stage-footer"><span class="document-summary"></span><span class="selection-summary"></span><button id="add-rectangle" class="add-button">Add rectangle</button></div>
      </section>
    </section>
    <aside class="inspector glass"><p class="eyebrow">SESSION INSPECTOR</p><h2>Document-aware commands</h2><p>Scenes, selection, dirty baselines, and command availability stay scoped to the active tab.</p><dl><div><dt>Storage</dt><dd>Host-owned</dd></div><div><dt>Commands</dt><dd>Context-aware</dd></div><div><dt>Baseline</dt><dd>Canonical scene</dd></div></dl></aside>
  </main>
  <div id="palette-dialog" class="dialog-backdrop" role="dialog" aria-modal="true" aria-label="Command palette" hidden><section class="command-dialog glass"><div class="dialog-heading"><div><p class="eyebrow">ACTIVE DOCUMENT</p><h2>Command palette</h2></div><button id="palette-close" class="icon-button" aria-label="Close command palette">Close</button></div><div id="commands" class="command-list"></div></section></div>
`

const session = new EditorSession()
for (const document of [
  { id: 'brief', title: 'Creative brief' },
  { id: 'poster', title: 'Poster' },
]) session.openDocument({ ...document, kit: new CanvasKit() })

const tabs = app.querySelector<HTMLDivElement>('.tabs')!
const content = app.querySelector<HTMLDivElement>('.canvas-content')!
const stage = app.querySelector<HTMLElement>('.stage')!
const documentSummary = app.querySelector<HTMLElement>('.document-summary')!
const selectionSummary = app.querySelector<HTMLElement>('.selection-summary')!
const liveStatus = app.querySelector<HTMLElement>('#live-status')!
const dialog = app.querySelector<HTMLDivElement>('#palette-dialog')!
const commands = app.querySelector<HTMLDivElement>('#commands')!

function render() {
  const snapshot = session.getSnapshot()
  const active = snapshot.documents.find((document) => document.id === snapshot.activeDocumentId)
  const activeKit = session.getActiveDocument()
  tabs.replaceChildren(...snapshot.documents.map((item) => {
    const button = document.createElement('button')
    button.type = 'button'; button.role = 'tab'; button.textContent = item.title
    button.setAttribute('aria-selected', String(item.id === snapshot.activeDocumentId))
    button.setAttribute('aria-label', item.title)
    button.className = item.id === snapshot.activeDocumentId ? 'tab active' : 'tab'
    const status = document.createElement('small')
    status.setAttribute('aria-label', `${item.title} status`)
    status.textContent = item.isDirty ? 'Unsaved' : 'Saved'
    button.append(status)
    button.onclick = () => { session.activateDocument(item.id); liveStatus.textContent = `${item.title} is active.` }
    return button
  }))
  if (!active || !activeKit) return
  const nodes = activeKit.getScene().nodes
  const selected = activeKit.selection.get()
  stage.setAttribute('aria-label', `${active.title} canvas`)
  content.replaceChildren(...nodes.map((node) => {
    const shape = document.createElement('button')
    shape.className = selected.includes(node.id) ? 'shape selected' : 'shape'
    shape.textContent = node.id.replace(`${active.id}-`, 'Rectangle ')
    shape.style.setProperty('--x', `${node.position.x}px`)
    shape.style.setProperty('--y', `${node.position.y}px`)
    shape.onclick = () => activeKit.selection.select(node.id)
    return shape
  }))
  documentSummary.textContent = `${nodes.length} rectangle${nodes.length === 1 ? '' : 's'}`
  documentSummary.setAttribute('aria-label', `${active.title} summary`)
  selectionSummary.textContent = `${selected.length} selected`
  selectionSummary.setAttribute('aria-label', `${active.title} selection`)
}

function addActiveRectangle() {
  const active = session.getSnapshot().activeDocumentId
  const kit = session.getActiveDocument()
  if (!active || !kit) return
  const before = kit.getScene()
  const count = before.nodes.length + 1
  kit.execute({
    label: 'add rectangle',
    execute: (scene) => addRectangle(scene, {
      id: `${active}-rectangle-${count}`,
      position: { x: 54 + (count - 1) * 94, y: 72 + (count - 1) * 38 },
      size: { width: 180, height: 100 },
      fill: count % 2 ? '#8b7cff' : '#38bdf8',
    }),
    undo: () => before,
  })
  liveStatus.textContent = 'Rectangle added to the active document.'
}

function closePalette() { dialog.hidden = true }
function openPalette() {
  commands.replaceChildren(...session.commands.getSnapshot().map((command) => {
    const button = document.createElement('button')
    button.textContent = command.title
    button.className = 'command-item'
    if (command.shortcut) button.append(Object.assign(document.createElement('kbd'), { textContent: command.shortcut }))
    button.onclick = () => {
      session.commands.execute(command.id)
      liveStatus.textContent = `${command.title} executed.`
      closePalette()
    }
    return button
  }))
  dialog.hidden = false
}

app.querySelector<HTMLButtonElement>('#add-rectangle')!.onclick = addActiveRectangle
app.querySelector<HTMLButtonElement>('#save')!.onclick = () => { session.saveDocument(); liveStatus.textContent = 'Saved active document baseline.' }
app.querySelector<HTMLButtonElement>('#palette-open')!.onclick = openPalette
app.querySelector<HTMLButtonElement>('#palette-close')!.onclick = closePalette
window.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openPalette() }
  if (event.key === 'Escape') closePalette()
})
session.subscribe(render)
render()
