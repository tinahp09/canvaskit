import { expect, it } from 'vitest'
import { SvgRenderer, renderSVG } from '../src/index.js'
import type { CanvasScene, Renderer } from '@canvaskit/core'

const scene: CanvasScene = {
  version: 2,
  nodes: [
    { id: 'rect', type: 'rectangle', position: { x: 10, y: 20 }, size: { width: 30, height: 40 }, fill: '#abc' },
    { id: 'circle', type: 'circle', position: { x: 50, y: 60 }, radius: 7, fill: 'red' },
    { id: 'text', type: 'text', position: { x: 70, y: 80 }, text: `<script>&\"'`, fontSize: 12, fill: 'blue' },
  ],
  edges: [
    { id: 'line', type: 'line', sourceId: 'rect', targetId: 'circle' },
    { id: 'arrow', type: 'arrow', sourceId: 'circle', targetId: 'text' },
    { id: 'bezier', type: 'bezier', sourceId: 'rect', targetId: 'text' },
  ],
  groups: [],
  viewport: { x: 5, y: 6, zoom: 2 },
  metadata: {},
}

it('serializes transformed primitives and all edge types into fixed logical SVG', () => {
  const svg = renderSVG(scene)

  expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720" width="1200" height="720">')
  expect(svg).toContain('<rect id="rect" x="25" y="46" width="60" height="80" fill="#abc"/>')
  expect(svg).toContain('<circle id="circle" cx="105" cy="126" r="14" fill="red"/>')
  expect(svg).toContain('<text id="text" x="145" y="166" fill="blue" font-size="24">&lt;script&gt;&amp;&quot;&apos;</text>')
  expect(svg).toContain('<line id="line" x1="55" y1="86" x2="105" y2="126" stroke="#737B88" stroke-width="1.5"/>')
  expect(svg).toContain('<line id="arrow" x1="105" y1="126" x2="277" y2="154" stroke="#737B88" stroke-width="1.5" marker-end="url(#arrowhead)"/>')
  expect(svg).toContain('<path id="bezier" d="M 55 86 C 166 86, 166 154, 277 154" fill="none" stroke="#737B88" stroke-width="1.5"/>')
  expect(svg).toContain('<marker id="arrowhead" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto" markerUnits="userSpaceOnUse">')
})

it('escapes every XML special character in node ids and attributes', () => {
  const svg = renderSVG({
    ...scene,
    nodes: [{ id: `a&<>\"'`, type: 'rectangle', position: { x: 0, y: 0 }, size: { width: 1, height: 1 }, fill: `a&<>\"'` }],
    edges: [],
  })

  expect(svg).toContain('id="a&amp;&lt;&gt;&quot;&apos;"')
  expect(svg).toContain('fill="a&amp;&lt;&gt;&quot;&apos;"')
})

it('exports only the visible document projection in layer paint order', () => {
  const svg = renderSVG({
    version: 3,
    layers: [
      { id: 'lower', name: 'Lower', visible: true, locked: false },
      { id: 'hidden', name: 'Hidden', visible: false, locked: false },
      { id: 'upper', name: 'Upper', visible: true, locked: false },
    ],
    // Deliberately the reverse of paint order: the renderer must not serialize
    // this raw node-array order for a Scene V3 document.
    nodes: [
      { id: 'upper-node', layerId: 'upper', type: 'rectangle', position: { x: 20, y: 0 }, size: { width: 10, height: 10 }, fill: '#00f' },
      { id: 'hidden-node', layerId: 'hidden', type: 'rectangle', position: { x: 10, y: 0 }, size: { width: 10, height: 10 }, fill: '#f00' },
      { id: 'lower-node', layerId: 'lower', type: 'rectangle', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#0f0' },
    ],
    edges: [
      { id: 'visible-edge', type: 'line', sourceId: 'lower-node', targetId: 'upper-node' },
      { id: 'hidden-edge', type: 'line', sourceId: 'lower-node', targetId: 'hidden-node' },
    ],
    groups: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    metadata: {},
  })

  expect(svg).toContain('id="visible-edge"')
  expect(svg).not.toContain('id="hidden-edge"')
  expect(svg).not.toContain('id="hidden-node"')
  expect(svg.indexOf('id="lower-node"')).toBeLessThan(svg.indexOf('id="upper-node"'))
})

it('implements the public renderer contract and retains its rendered SVG', () => {
  const renderer: Renderer = new SvgRenderer()

  renderer.render(scene)

  expect((renderer as SvgRenderer).svg).toBe(renderSVG(scene))
})
