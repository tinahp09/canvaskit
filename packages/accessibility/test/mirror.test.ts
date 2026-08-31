// @vitest-environment jsdom
import { expect, it } from 'vitest'
import { CanvasAccessibilityMirror } from '../src/index.js'

it('renders an ordered labelled ARIA list and disposes only its own container', () => {
  const host = document.createElement('div')
  const unrelated = document.createElement('p')
  host.append(unrelated)
  const mirror = new CanvasAccessibilityMirror(host, { label: 'Canvas content' })
  mirror.update({ items: [{ id: 'card', role: 'listitem', label: 'Rectangle: card', selected: true }] })
  const list = host.querySelector('[role="list"]')!
  expect(list.getAttribute('aria-label')).toBe('Canvas content')
  expect(list.textContent).toContain('Rectangle: card')
  expect(list.querySelector('[aria-selected="true"]')).not.toBeNull()
  mirror.destroy()
  expect(host.querySelector('[data-canvaskit-a11y]')).toBeNull()
  expect(host.contains(unrelated)).toBe(true)
})
