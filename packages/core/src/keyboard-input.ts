import type { CanvasKit } from './canvas-kit.js'

function isEditableTarget(target: EventTarget | null): boolean {
  const element = target as (HTMLElement & { closest?: (selector: string) => Element | null }) | null
  if (!element) return false
  const tagName = element.tagName?.toLowerCase()
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select'
    || element.isContentEditable === true
    || Boolean(element.closest?.('[contenteditable=""], [contenteditable="true"]'))
}

export function attachKeyboardInput(element: HTMLElement, canvas: CanvasKit): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    if (isEditableTarget(event.target)) return

    const primaryModifier = event.metaKey || event.ctrlKey
    const key = event.key.toLowerCase()
    const command = primaryModifier
      ? ({ a: 'select-all', c: 'copy', x: 'cut', v: 'paste', d: 'duplicate' } as const)[key]
      : event.key === 'Delete' || event.key === 'Backspace'
        ? 'delete-selection'
        : event.key === 'Escape'
          ? 'clear-selection'
          : undefined

    if (!command) return
    event.preventDefault()
    canvas.executeCommand(command)
  }
  element.addEventListener('keydown', onKeyDown)
  return () => element.removeEventListener('keydown', onKeyDown)
}
