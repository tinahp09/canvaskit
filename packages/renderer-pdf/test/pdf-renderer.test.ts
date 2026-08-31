import { expect, it } from 'vitest'
import { exportPDFDataURL, renderPDF } from '../src/index.js'

const scene = {
  version: 6 as const, nodes: [], connectors: [], groups: [], guides: [], assets: [],
  layers: [{ id: 'layer-default', name: 'Default', visible: true, locked: false }],
  viewport: { x: 0, y: 0, zoom: 1 }, metadata: {},
}

it('writes deterministic PDF bytes and a browser data URL', () => {
  const first = renderPDF(scene)
  const text = new TextDecoder().decode(first)
  expect(text).toMatch(/^%PDF-1\.4/)
  expect(text).toContain('xref')
  expect(text).toContain('%%EOF')
  expect(renderPDF(scene)).toEqual(first)
  expect(exportPDFDataURL(scene)).toMatch(/^data:application\/pdf;base64,/)
})

it('renders visible primitives, routes connectors, and labels image placeholders', () => {
  const content = new TextDecoder().decode(renderPDF({
    ...scene,
    layers: [
      { id: 'layer-default', name: 'Default', visible: true, locked: false },
      { id: 'hidden', name: 'Hidden', visible: false, locked: false },
    ],
    nodes: [
      { id: 'card', layerId: 'layer-default', type: 'rectangle', position: { x: 20, y: 30 }, size: { width: 100, height: 40 }, fill: '#FF0000' },
      { id: 'title', layerId: 'layer-default', type: 'text', position: { x: 40, y: 90 }, text: 'Launch (safe)', runs: [{ text: 'Launch (safe)' }], fontSize: 18, fill: '#000000' },
      { id: 'logo', layerId: 'layer-default', type: 'image', position: { x: 140, y: 30 }, size: { width: 80, height: 40 }, assetId: 'asset-logo', fit: 'contain', crop: { x: 0, y: 0, width: 1, height: 1 } },
      { id: 'hidden-node', layerId: 'hidden', type: 'rectangle', position: { x: 0, y: 0 }, size: { width: 1, height: 1 }, fill: '#000' },
    ],
    assets: [{ id: 'asset-logo', kind: 'image', source: 'https://cdn.test/logo.png', mimeType: 'image/png', width: 80, height: 40 }],
    connectors: [{ id: 'card-logo', sourceNodeId: 'card', sourcePortId: 'east', targetNodeId: 'logo', targetPortId: 'west', routing: 'straight', label: 'links' }],
  }))
  expect(content).toContain('20 650 100 40 re')
  expect(content).toContain('(Launch \\(safe\\)) Tj')
  expect(content).toContain('(Image: asset-logo) Tj')
  expect(content).toContain(' m\n')
  expect(content).not.toContain('hidden-node')
})
