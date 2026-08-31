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
