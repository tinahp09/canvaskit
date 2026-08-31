import type { AccessibilitySnapshot } from './snapshot.js'

export interface CanvasAccessibilityMirrorOptions { label?: string }

export class CanvasAccessibilityMirror {
  private readonly container: HTMLDivElement
  private readonly list: HTMLUListElement
  private readonly status: HTMLParagraphElement

  constructor(host: HTMLElement, options: CanvasAccessibilityMirrorOptions = {}) {
    this.container = host.ownerDocument.createElement('div')
    this.container.dataset.canvaskitA11y = ''
    this.container.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;'
    this.list = host.ownerDocument.createElement('ul')
    this.list.setAttribute('role', 'list')
    this.list.setAttribute('aria-label', options.label ?? 'Canvas content')
    this.status = host.ownerDocument.createElement('p')
    this.status.setAttribute('role', 'status')
    this.status.setAttribute('aria-live', 'polite')
    this.container.append(this.list, this.status)
    host.append(this.container)
  }

  update(snapshot: AccessibilitySnapshot): void {
    this.list.replaceChildren(...snapshot.items.map((item) => {
      const entry = this.list.ownerDocument.createElement('li')
      entry.setAttribute('role', item.role)
      entry.setAttribute('aria-label', item.label)
      entry.setAttribute('aria-selected', String(item.selected))
      entry.textContent = item.label
      return entry
    }))
    this.status.textContent = `${snapshot.items.length} canvas items available.`
  }

  destroy(): void { this.container.remove() }
}
