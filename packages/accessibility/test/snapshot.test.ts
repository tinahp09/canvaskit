import { expect, it } from 'vitest'
import { createAccessibilitySnapshot } from '../src/index.js'

it('describes visible content in document order and marks selection', () => {
  const snapshot = createAccessibilitySnapshot({
    version: 6, assets: [], groups: [], guides: [], connectors: [],
    layers: [{ id: 'visible', name: 'Visible', visible: true, locked: false }, { id: 'hidden', name: 'Hidden', visible: false, locked: false }],
    nodes: [
      { id: 'title', layerId: 'visible', type: 'text', position: { x: 0, y: 0 }, text: 'Launch', runs: [{ text: 'Launch' }], fontSize: 16, fill: '#000' },
      { id: 'secret', layerId: 'hidden', type: 'rectangle', position: { x: 0, y: 0 }, size: { width: 1, height: 1 }, fill: '#000' },
    ], viewport: { x: 0, y: 0, zoom: 1 }, metadata: {},
  }, ['title'])
  expect(snapshot.items).toEqual([{ id: 'title', role: 'listitem', label: 'Text: Launch', selected: true }])
})
