import { expect, it } from 'vitest'
import { addRectangle, createScene, exportScene, importScene, InvalidSceneError, loadScene, serializeScene, UnsupportedSceneVersionError } from '../src/index.js'

it('restores a serialized rectangle scene', () => {
  const scene = addRectangle(createScene(), {
    id: 'welcome', position: { x: -20, y: 40 }, size: { width: 180, height: 80 }, fill: '#7C7FF2',
  })

  expect(loadScene(serializeScene(scene))).toEqual(scene)
})

it('migrates a version 1 scene into version 5', () => {
  expect(importScene('{"version":1,"nodes":[],"viewport":{"x":0,"y":0,"zoom":1},"metadata":{}}'))
    .toMatchObject({ version: 5, connectors: [], groups: [], guides: [], layers: [{ id: 'layer-default', name: 'Default', visible: true, locked: false }] })
})

it('adapts version 1 graph records into version 5 connectors', () => {
  const version1 = '{"version":1,"nodes":[{"id":"a","type":"rectangle","position":{"x":0,"y":0},"size":{"width":10,"height":10},"fill":"#fff"},{"id":"b","type":"rectangle","position":{"x":20,"y":0},"size":{"width":10,"height":10},"fill":"#000"}],"edges":[{"id":"link","type":"arrow","sourceId":"a","targetId":"b"}],"groups":[{"id":"pair","nodeIds":["a","b"]}],"viewport":{"x":0,"y":0,"zoom":1},"metadata":{}}'

  expect(importScene(version1)).toMatchObject({
    version: 5,
    guides: [],
    connectors: [{ id: 'link', sourceNodeId: 'a', sourcePortId: 'center', targetNodeId: 'b', targetPortId: 'center', routing: 'straight' }],
    groups: [{ id: 'pair', nodeIds: ['a', 'b'] }],
  })
})

it('exports and imports canonical version 4 scenes', () => {
  const scene = addRectangle(createScene(), {
    id: 'welcome', position: { x: -20, y: 40 }, size: { width: 180, height: 80 }, fill: '#7C7FF2',
  })

  expect(importScene(exportScene(scene))).toEqual(scene)
})

it('migrates canonical version 4 scenes to version 5 with empty guides', () => {
  const version4 = JSON.stringify({
    version: 4,
    nodes: [], connectors: [], groups: [],
    layers: [{ id: 'layer-default', name: 'Default', visible: true, locked: false }],
    viewport: { x: 0, y: 0, zoom: 1 }, metadata: {},
  })

  expect(importScene(version4)).toMatchObject({ version: 5, guides: [] })
})

it('rejects duplicate and non-finite canonical guide records', () => {
  const base = {
    version: 5,
    nodes: [], connectors: [], groups: [],
    layers: [{ id: 'layer-default', name: 'Default', visible: true, locked: false }],
    viewport: { x: 0, y: 0, zoom: 1 }, metadata: {},
  }

  expect(() => importScene(JSON.stringify({ ...base, guides: [
    { id: 'guide-x', axis: 'vertical', position: 100 },
    { id: 'guide-x', axis: 'horizontal', position: 80 },
  ] }))).toThrow(InvalidSceneError)
  expect(() => importScene(JSON.stringify({ ...base, guides: [
    { id: 'guide-y', axis: 'horizontal', position: 'not-finite' },
  ] }))).toThrow(InvalidSceneError)
})

it('rejects malformed imported JSON with a typed error', () => {
  expect(() => importScene('{"version":2,"nodes":"bad"}')).toThrow(InvalidSceneError)
})

it('rejects invalid JSON syntax with a typed error', () => {
  expect(() => importScene('{')).toThrow(InvalidSceneError)
})

it('rejects unsupported scene versions with the unsupported-version subtype', () => {
  expect(() => importScene('{"version":6,"nodes":[],"connectors":[],"groups":[],"layers":[],"guides":[],"viewport":{"x":0,"y":0,"zoom":1},"metadata":{}}'))
    .toThrow(UnsupportedSceneVersionError)
})

it.each(['edges', 'groups'])('rejects a version 1 scene with an explicit null %s field', (field) => {
  expect(() => importScene(`{"version":1,"nodes":[],"${field}":null,"viewport":{"x":0,"y":0,"zoom":1},"metadata":{}}`))
    .toThrow(InvalidSceneError)
})

it.each([
  '{"version":2,"nodes":[{"id":"node","type":"circle","position":{"x":0,"y":0},"radius":"bad","fill":"#fff"}],"edges":[],"groups":[],"viewport":{"x":0,"y":0,"zoom":1},"metadata":{}}',
  '{"version":2,"nodes":[],"edges":[{"id":"edge","type":"bad","sourceId":"a","targetId":"b"}],"groups":[],"viewport":{"x":0,"y":0,"zoom":1},"metadata":{}}',
  '{"version":2,"nodes":[],"edges":[],"groups":[{"id":"group","nodeIds":[1]}],"viewport":{"x":0,"y":0,"zoom":1},"metadata":{}}',
  '{"version":2,"nodes":[],"edges":[],"groups":[],"viewport":{"x":0,"y":0,"zoom":"bad"},"metadata":{}}',
  '{"version":2,"nodes":[],"edges":[],"groups":[],"viewport":{"x":0,"y":0,"zoom":1},"metadata":[]}',
])('rejects invalid canonical scene fields with a typed error', (json) => {
  expect(() => importScene(json)).toThrow(InvalidSceneError)
})

it.each([
  '{"version":2,"nodes":[{"id":"a","type":"rectangle","position":{"x":0,"y":0},"size":{"width":10,"height":10},"fill":"#fff"},{"id":"a","type":"rectangle","position":{"x":20,"y":0},"size":{"width":10,"height":10},"fill":"#000"}],"edges":[],"groups":[],"viewport":{"x":0,"y":0,"zoom":1},"metadata":{}}',
  '{"version":2,"nodes":[{"id":"a","type":"rectangle","position":{"x":0,"y":0},"size":{"width":10,"height":10},"fill":"#fff"}],"edges":[{"id":"link","type":"line","sourceId":"a","targetId":"missing"}],"groups":[],"viewport":{"x":0,"y":0,"zoom":1},"metadata":{}}',
  '{"version":2,"nodes":[{"id":"a","type":"rectangle","position":{"x":0,"y":0},"size":{"width":10,"height":10},"fill":"#fff"}],"edges":[{"id":"link","type":"line","sourceId":"a","targetId":"a"},{"id":"link","type":"line","sourceId":"a","targetId":"a"}],"groups":[],"viewport":{"x":0,"y":0,"zoom":1},"metadata":{}}',
  '{"version":2,"nodes":[{"id":"a","type":"rectangle","position":{"x":0,"y":0},"size":{"width":10,"height":10},"fill":"#fff"}],"edges":[],"groups":[{"id":"group","nodeIds":["missing"]}],"viewport":{"x":0,"y":0,"zoom":1},"metadata":{}}',
  '{"version":2,"nodes":[{"id":"a","type":"rectangle","position":{"x":0,"y":0},"size":{"width":10,"height":10},"fill":"#fff"}],"edges":[],"groups":[{"id":"group","nodeIds":["a"]},{"id":"group","nodeIds":["a"]}],"viewport":{"x":0,"y":0,"zoom":1},"metadata":{}}',
])('rejects duplicate or dangling graph records', (json) => {
  expect(() => importScene(json)).toThrow(InvalidSceneError)
})
