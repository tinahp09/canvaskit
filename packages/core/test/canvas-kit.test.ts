import { expect, it } from 'vitest'
import { addEdge, addGroup, addLayer, addRectangle, CanvasKit, ConnectorController, createScene, importScene, setLayerLocked, setLayerVisibility, type CanvasLayer, type CanvasScene, type CreateConnectorInput } from '../src/index.js'

type DocumentCommands = {
  createLayer(layer: CanvasLayer): boolean
  moveSelectionToLayer(layerId: string): boolean
  setLayerVisible(layerId: string, visible: boolean): boolean
  setLayerVisibility(layerId: string, visible: boolean): boolean
  setLayerLocked(layerId: string, locked: boolean): boolean
  reorderSelection(targetIndex: number): boolean
  reorderLayer(layerId: string, targetIndex: number): boolean
}

const connectorInput: CreateConnectorInput = {
  id: 'relation',
  sourceNodeId: 'source',
  sourcePortId: 'east',
  targetNodeId: 'target',
  targetPortId: 'west',
  routing: 'orthogonal',
}

function diagramScene(): CanvasScene {
  let scene = addRectangle(createScene(), {
    id: 'source', position: { x: 0, y: 0 }, size: { width: 20, height: 20 }, fill: '#fff',
  })
  scene = addRectangle(scene, {
    id: 'target', position: { x: 100, y: 0 }, size: { width: 20, height: 20 }, fill: '#000',
  })
  return addRectangle(scene, {
    id: 'replacement', position: { x: 200, y: 40 }, size: { width: 20, height: 20 }, fill: '#123',
  })
}

it('creates, reconnects, removes, and restores one connector for each history command', () => {
  const scene = diagramScene()
  const kit = new CanvasKit({ scene })

  expect(kit.createConnector(connectorInput)).toBe(true)
  expect(kit.getScene().connectors).toEqual([connectorInput])
  expect(kit.undo()).toEqual(scene)
  expect(kit.redo().connectors).toEqual([connectorInput])

  expect(kit.reconnectConnector('relation', 'target', 'replacement', 'north')).toBe(true)
  expect(kit.getScene().connectors[0]).toMatchObject({ targetNodeId: 'replacement', targetPortId: 'north' })
  expect(kit.undo().connectors).toEqual([connectorInput])
  expect(kit.redo().connectors[0]).toMatchObject({ targetNodeId: 'replacement', targetPortId: 'north' })

  expect(kit.removeConnector('relation')).toBe(true)
  expect(kit.getScene().connectors).toEqual([])
  expect(kit.undo().connectors[0]).toMatchObject({ targetNodeId: 'replacement', targetPortId: 'north' })
  expect(kit.redo().connectors).toEqual([])
})

it('does not create connector history for invalid, noninteractive, unknown, or no-op connector commands', () => {
  const scene = diagramScene()
  const kit = new CanvasKit({ scene: setLayerLocked(scene, 'layer-default', true) })

  expect(kit.createConnector(connectorInput)).toBe(false)
  expect(kit.getScene().connectors).toEqual([])
  expect(kit.undo()).toEqual(kit.getScene())

  const unlocked = new CanvasKit({ scene })
  expect(() => unlocked.createConnector({ ...connectorInput, targetPortId: 'missing' })).toThrow('Connector target port "missing" does not exist on node "target".')
  expect(unlocked.getScene()).toEqual(scene)
  expect(unlocked.undo()).toEqual(scene)
  expect(unlocked.removeConnector('missing')).toBe(false)
  expect(unlocked.getScene()).toEqual(scene)

  expect(unlocked.createConnector(connectorInput)).toBe(true)
  expect(unlocked.reconnectConnector('relation', 'target', 'target', 'west')).toBe(false)
  expect(unlocked.undo()).toEqual(scene)
})

it('rejects reconnecting to hidden or locked nodes without mutating connector history', () => {
  let scene = new ConnectorController().create(diagramScene(), connectorInput)
  scene = addLayer(scene, { id: 'restricted', name: 'Restricted', visible: true, locked: false })
  scene = {
    ...scene,
    nodes: scene.nodes.map((node) => node.id === 'replacement' ? { ...node, layerId: 'restricted' } : node),
  }
  const kit = new CanvasKit({ scene: setLayerVisibility(scene, 'restricted', false) })

  expect(kit.reconnectConnector('relation', 'target', 'replacement', 'north')).toBe(false)
  expect(kit.getScene().connectors).toEqual([connectorInput])
  expect(kit.undo()).toEqual(kit.getScene())

  kit.setScene(setLayerLocked(scene, 'restricted', true))
  expect(kit.reconnectConnector('relation', 'target', 'replacement', 'north')).toBe(false)
  expect(kit.getScene().connectors).toEqual([connectorInput])
})

it('deletes a selected connector through the selection command and keeps node deletion relation-safe', () => {
  const scene = new ConnectorController().create(diagramScene(), connectorInput)
  const kit = new CanvasKit({ scene })

  expect(kit.selectConnector('relation')).toBe(true)
  expect(kit.getSelectedConnector()).toBe('relation')
  expect(kit.executeCommand('delete-selection')).toBe(true)
  expect(kit.getScene().connectors).toEqual([])
  expect(kit.getSelectedConnector()).toBeUndefined()
  expect(kit.undo()).toEqual(scene)

  kit.selection.select('source')
  expect(kit.executeCommand('delete-selection')).toBe(true)
  expect(kit.getScene().nodes.map((node) => node.id)).toEqual(['target', 'replacement'])
  expect(kit.getScene().connectors).toEqual([])
  expect(kit.undo()).toEqual(scene)
})

it('recalculates an orthogonal connector route after a history-backed transform', () => {
  const routedInput = { ...connectorInput, targetPortId: 'east' }
  const scene = new ConnectorController().create(diagramScene(), routedInput)
  const kit = new CanvasKit({ scene })
  const controller = new ConnectorController()
  const before = controller.route(kit.getScene(), 'relation')

  kit.selection.select('target')
  expect(kit.resizeSelection('east', { x: 180, y: 10 })).toBe(true)
  const after = controller.route(kit.getScene(), 'relation')

  expect(after).not.toEqual(before)
  expect(kit.getScene().connectors[0]).not.toHaveProperty('points')
  expect(kit.undo()).toEqual(scene)
  expect(controller.route(kit.getScene(), 'relation')).toEqual(before)
})

it('reports pointer coordinates in screen and world space', () => {
  const canvas = new CanvasKit()
  canvas.viewport.panBy({ x: 10, y: 20 })

  expect(canvas.createPointerEvent({ x: 30, y: 50 }, 'pointermove')).toEqual({
    type: 'pointermove', screen: { x: 30, y: 50 }, world: { x: 20, y: 30 },
  })
})

it('records guide and selection-layout mutations in history while keeping snap feedback transient', () => {
  const scene = addRectangle(addRectangle(createScene(), {
    id: 'a', position: { x: 80, y: 120 }, size: { width: 20, height: 20 }, fill: '#fff',
  }), {
    id: 'b', position: { x: 180, y: 220 }, size: { width: 20, height: 20 }, fill: '#fff',
  })
  const kit = new CanvasKit({ scene })

  expect(kit.createGuide({ id: 'guide-x', axis: 'vertical', position: 100 })).toBe(true)
  expect(kit.getScene().guides).toEqual([{ id: 'guide-x', axis: 'vertical', position: 100 }])
  expect(kit.undo()).toEqual(scene)
  expect(kit.redo().guides).toHaveLength(1)

  kit.selection.set(['a', 'b'])
  expect(kit.layoutSelection({ direction: 'horizontal', origin: { x: 10, y: 20 }, gap: { x: 5, y: 5 } })).toBe(true)
  expect(kit.getScene().nodes.map((node) => node.position)).toEqual([{ x: 10, y: 20 }, { x: 35, y: 20 }])
  expect(kit.undo().nodes.map((node) => node.position)).toEqual(scene.nodes.map((node) => node.position))

  expect(kit.snapSelection({ x: 9, y: 0 }, { tolerance: 12 }).activeGuides).toEqual([{ id: 'guide-x', axis: 'vertical', position: 100 }])
  expect(kit.getActiveLayoutGuides()).toEqual([{ id: 'guide-x', axis: 'vertical', position: 100 }])
  expect(kit.toJSON()).not.toContain('activeGuides')
})

it('applies marquee results with explicit selection semantics', () => {
  const scene = addRectangle(addRectangle(createScene(), {
    id: 'a', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff',
  }), {
    id: 'b', position: { x: 20, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff',
  })
  const canvas = new CanvasKit({ scene })

  expect(canvas.selectInRect({ x: 0, y: 0, width: 10, height: 10 })).toEqual(['a'])
  expect(canvas.selectInRect({ x: 25, y: 0, width: 10, height: 10 }, { mode: 'intersect', selection: 'add' })).toEqual(['b'])
  expect(canvas.selection.get()).toEqual(['a', 'b'])
})

it('deletes through the command without leaving dangling graph records and restores one scene on undo', () => {
  let scene = addRectangle(createScene(), { id: 'a', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff' })
  scene = addRectangle(scene, { id: 'b', position: { x: 20, y: 0 }, size: { width: 10, height: 10 }, fill: '#000' })
  scene = addRectangle(scene, { id: 'c', position: { x: 40, y: 0 }, size: { width: 10, height: 10 }, fill: '#123' })
  scene = addEdge(scene, { id: 'ab', sourceId: 'a', targetId: 'b', type: 'line' })
  scene = addEdge(scene, { id: 'bc', sourceId: 'b', targetId: 'c', type: 'arrow' })
  scene = addGroup(scene, { id: 'pair', nodeIds: ['a', 'b'] })
  scene = addGroup(scene, { id: 'only-a', nodeIds: ['a'] })
  const kit = new CanvasKit({ scene })
  kit.selection.set(['a'])

  expect(kit.executeCommand('delete-selection')).toBe(true)
  expect(kit.getScene().nodes.map((node) => node.id)).toEqual(['b', 'c'])
  expect(kit.getScene().connectors).toEqual([{ id: 'bc', sourceNodeId: 'b', sourcePortId: 'center', targetNodeId: 'c', targetPortId: 'center', routing: 'straight' }])
  expect(kit.getScene().groups).toEqual([{ id: 'pair', nodeIds: ['b'] }])
  expect(importScene(kit.toJSON())).toEqual(kit.getScene())
  expect(kit.undo()).toEqual(scene)
})

it('creates layers and moves the selection in separately undoable document commands', () => {
  let scene = addRectangle(createScene(), { id: 'a', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff' })
  scene = addRectangle(scene, { id: 'b', position: { x: 20, y: 0 }, size: { width: 10, height: 10 }, fill: '#000' })
  const kit = new CanvasKit({ scene })
  const document = kit as unknown as DocumentCommands

  expect(typeof document.createLayer).toBe('function')
  expect(document.createLayer({ id: 'foreground', name: 'Foreground', visible: true, locked: false })).toBe(true)
  kit.selection.set(['a', 'b'])
  expect(document.moveSelectionToLayer('foreground')).toBe(true)
  expect(kit.getScene().nodes.map((node) => [node.id, node.layerId])).toEqual([
    ['a', 'foreground'],
    ['b', 'foreground'],
  ])
  expect(kit.selection.get()).toEqual(['a', 'b'])
  expect(kit.undo().nodes.map((node) => node.layerId)).toEqual(['layer-default', 'layer-default'])
  expect(kit.undo()).toEqual(scene)
})

it('retains selection only while its layer is visible and unlocked', () => {
  const scene = addRectangle(createScene(), { id: 'a', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff' })
  const kit = new CanvasKit({ scene })
  const document = kit as unknown as DocumentCommands
  kit.selection.select('a')

  expect(typeof document.setLayerVisibility).toBe('function')
  expect(document.setLayerVisibility('layer-default', false)).toBe(true)
  expect(kit.selection.get()).toEqual([])
  expect(document.setLayerVisible('layer-default', true)).toBe(true)
  kit.selection.select('a')
  expect(document.setLayerLocked('layer-default', true)).toBe(true)
  expect(kit.selection.get()).toEqual([])
  expect(kit.resizeSelection('east', { x: 20, y: 5 })).toBe(false)
})

it('reorders the selected node and layers as individual undoable document commands', () => {
  let scene = addRectangle(createScene(), { id: 'a', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff' })
  scene = addRectangle(scene, { id: 'b', position: { x: 20, y: 0 }, size: { width: 10, height: 10 }, fill: '#000' })
  const kit = new CanvasKit({ scene })
  const document = kit as unknown as DocumentCommands
  kit.selection.select('b')

  expect(typeof document.reorderSelection).toBe('function')
  expect(document.reorderSelection(0)).toBe(true)
  expect(kit.getScene().nodes.map((node) => node.id)).toEqual(['b', 'a'])
  expect(kit.undo()).toEqual(scene)
  expect(document.createLayer({ id: 'foreground', name: 'Foreground', visible: true, locked: false })).toBe(true)
  expect(document.reorderLayer('foreground', 0)).toBe(true)
  expect(kit.getScene().layers.map((layer) => layer.id)).toEqual(['foreground', 'layer-default'])
  expect(kit.undo().layers.map((layer) => layer.id)).toEqual(['layer-default', 'foreground'])
})

it('reorders a same-layer multi-selection as a stable stack', () => {
  let scene = addRectangle(createScene(), { id: 'a', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff' })
  scene = addRectangle(scene, { id: 'b', position: { x: 20, y: 0 }, size: { width: 10, height: 10 }, fill: '#000' })
  scene = addRectangle(scene, { id: 'c', position: { x: 40, y: 0 }, size: { width: 10, height: 10 }, fill: '#123' })
  scene = addRectangle(scene, { id: 'd', position: { x: 60, y: 0 }, size: { width: 10, height: 10 }, fill: '#456' })
  const kit = new CanvasKit({ scene })
  const document = kit as unknown as DocumentCommands
  kit.selection.set(['b', 'c'])

  expect(document.reorderSelection(0)).toBe(true)
  expect(kit.getScene().nodes.map((node) => node.id)).toEqual(['b', 'c', 'a', 'd'])
  expect(kit.selection.get()).toEqual(['b', 'c'])
  expect(kit.undo()).toEqual(scene)
})

it('loads serialized scene data', () => {
  const canvas = new CanvasKit()
  canvas.load('{"version":1,"nodes":[],"viewport":{"x":4,"y":5,"zoom":2},"metadata":{}}')
  expect(canvas.getScene().viewport).toEqual({ x: 4, y: 5, zoom: 2 })
})

it('reflects viewport navigation in the scene snapshot', () => {
  const canvas = new CanvasKit()
  canvas.viewport.panBy({ x: 10, y: 20 })
  expect(canvas.getScene().viewport).toEqual({ x: 10, y: 20, zoom: 1 })
})

it('undoes then redoes an executed scene command', () => {
  const kit = new CanvasKit()
  const before = kit.getScene()

  kit.execute({
    label: 'add',
    execute: (scene) => addRectangle(scene, {
      id: 'a', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff',
    }),
    undo: () => before,
  })

  expect(kit.undo().nodes).toEqual([])
  expect(kit.redo().nodes).toHaveLength(1)
})

it('clears redo history when a direct scene replacement creates a newer state', () => {
  const kit = new CanvasKit()
  const before = kit.getScene()
  kit.execute({
    label: 'add a',
    execute: (scene) => addRectangle(scene, { id: 'a', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff' }),
    undo: () => before,
  })
  kit.undo()
  kit.setScene(addRectangle(kit.getScene(), { id: 'newer', position: { x: 10, y: 0 }, size: { width: 10, height: 10 }, fill: '#000' }))

  expect(kit.redo().nodes.map((node) => node.id)).toEqual(['newer'])
})

it('clears redo history when panning after undo without recording navigation', () => {
  const kit = new CanvasKit()
  const before = kit.getScene()
  kit.execute({
    label: 'add a',
    execute: (scene) => addRectangle(scene, { id: 'a', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff' }),
    undo: () => before,
  })
  kit.undo()
  kit.viewport.panBy({ x: 12, y: 24 })

  expect(kit.undo().nodes).toEqual([])
  expect(kit.getScene().viewport).toEqual({ x: 12, y: 24, zoom: 1 })

  expect(kit.redo().nodes).toEqual([])
  expect(kit.getScene().viewport).toEqual({ x: 12, y: 24, zoom: 1 })
})

it('clears redo history when zooming after undo without recording navigation', () => {
  const kit = new CanvasKit()
  const before = kit.getScene()
  kit.execute({
    label: 'add a',
    execute: (scene) => addRectangle(scene, { id: 'a', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff' }),
    undo: () => before,
  })
  kit.undo()
  kit.viewport.zoomAt({ x: 100, y: 50 }, 2)

  expect(kit.undo().nodes).toEqual([])
  expect(kit.getScene().viewport).toEqual({ x: -100, y: -50, zoom: 2 })

  expect(kit.redo().nodes).toEqual([])
  expect(kit.getScene().viewport).toEqual({ x: -100, y: -50, zoom: 2 })
})

it('rejects setScene during an active transaction without replacing the scene or history', () => {
  const kit = new CanvasKit()
  const initial = kit.getScene()
  kit.execute({
    label: 'add a',
    execute: (scene) => addRectangle(scene, { id: 'a', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff' }),
    undo: () => initial,
  })
  const beforeReplacement = kit.getScene()
  kit.beginTransaction('active')

  expect(() => kit.setScene(addRectangle(beforeReplacement, { id: 'b', position: { x: 10, y: 0 }, size: { width: 10, height: 10 }, fill: '#000' }))).toThrow('Cannot clear history for while a history transaction is active.')
  expect(kit.getScene()).toEqual(beforeReplacement)

  kit.commitTransaction()
  expect(kit.undo()).toEqual(initial)
})

it('clears undo and redo history after importing a scene', () => {
  const kit = new CanvasKit()
  const before = kit.getScene()

  kit.execute({
    label: 'add',
    execute: (scene) => addRectangle(scene, {
      id: 'a', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff',
    }),
    undo: () => before,
  })
  kit.clearHistory()

  expect(kit.undo()).toEqual(kit.getScene())

  kit.execute({
    label: 'add again',
    execute: (scene) => addRectangle(scene, {
      id: 'b', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff',
    }),
    undo: () => before,
  })
  kit.undo()
  kit.clearHistory()

  expect(kit.redo()).toEqual(kit.getScene())
})

it('undoes a transaction as one history entry', () => {
  const kit = new CanvasKit()
  const before = kit.getScene()
  const add = (id: string) => ({
    label: `add ${id}`,
    execute: (scene: CanvasScene) => addRectangle(scene, {
      id, position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff',
    }),
    undo: () => before,
  })

  kit.beginTransaction('build workflow')
  kit.execute(add('a'))
  kit.execute(add('b'))
  kit.commitTransaction()

  expect(kit.undo().nodes).toEqual([])
})

it('resizes the current selection as one undoable history command', () => {
  const scene = addRectangle(createScene(), {
    id: 'rectangle', position: { x: 10, y: 20 }, size: { width: 30, height: 40 }, fill: '#fff',
  })
  const kit = new CanvasKit({ scene })
  kit.selection.select('rectangle')

  expect(kit.resizeSelection('east', { x: 70, y: 40 })).toBe(true)
  expect(kit.getScene().nodes[0]).toMatchObject({ position: { x: 10, y: 20 }, size: { width: 60, height: 40 } })
  expect(kit.undo()).toEqual(scene)
  expect(kit.redo().nodes[0]).toMatchObject({ position: { x: 10, y: 20 }, size: { width: 60, height: 40 } })
  expect(kit.undo()).toEqual(scene)
  expect(kit.undo()).toEqual(scene)
})

it('returns false when resize selection cannot alter the scene', () => {
  const scene = addRectangle(createScene(), {
    id: 'rectangle', position: { x: 10, y: 20 }, size: { width: 30, height: 40 }, fill: '#fff',
  })
  const kit = new CanvasKit({ scene })

  expect(kit.resizeSelection('east', { x: 40, y: 40 })).toBe(false)
  kit.selection.select('rectangle')
  expect(kit.resizeSelection('east', { x: 40, y: 40 })).toBe(false)
  expect(kit.undo()).toEqual(scene)
})

it('rotates the selected nodes with undo and redo history', () => {
  const scene = addRectangle(createScene(), {
    id: 'rectangle', position: { x: 10, y: 20 }, size: { width: 30, height: 40 }, fill: '#fff',
  })
  const kit = new CanvasKit({ scene })
  kit.selection.select('rectangle')

  expect(kit.rotateSelection(Math.PI / 2)).toBe(true)
  expect(kit.getScene().nodes[0]).toMatchObject({ rotation: Math.PI / 2 })
  expect(kit.undo()).toEqual(scene)
  expect(kit.redo().nodes[0]).toMatchObject({ rotation: Math.PI / 2 })
})

it('treats empty rotation selection as a no-op', () => {
  const scene = addRectangle(createScene(), {
    id: 'rectangle', position: { x: 10, y: 20 }, size: { width: 30, height: 40 }, fill: '#fff',
  })
  const kit = new CanvasKit({ scene })

  expect(kit.rotateSelection(Math.PI / 2)).toBe(false)
  expect(kit.getScene()).toEqual(scene)
  expect(kit.undo()).toEqual(scene)
})

it('aligns the current selection without disturbing graph and group relationships', () => {
  let scene = addRectangle(createScene(), {
    id: 'left', position: { x: 0, y: 10 }, size: { width: 10, height: 10 }, fill: '#fff',
  })
  scene = addRectangle(scene, {
    id: 'right', position: { x: 30, y: 20 }, size: { width: 20, height: 10 }, fill: '#000',
  })
  scene = addEdge(scene, { id: 'edge', sourceId: 'left', targetId: 'right', type: 'line' })
  scene = addGroup(scene, { id: 'pair', nodeIds: ['left', 'right'] })
  const kit = new CanvasKit({ scene })
  kit.selection.set(['left', 'right'])

  expect(kit.alignSelection('left')).toBe(true)
  expect(kit.getScene().nodes.map((node) => node.position)).toEqual([{ x: 0, y: 10 }, { x: 0, y: 20 }])
  expect(kit.getScene().edges).toEqual(scene.edges)
  expect(kit.getScene().groups).toEqual(scene.groups)
  expect(kit.undo()).toEqual(scene)
  expect(kit.redo().nodes.map((node) => node.position)).toEqual([{ x: 0, y: 10 }, { x: 0, y: 20 }])
  expect(kit.undo()).toEqual(scene)
  expect(kit.undo()).toEqual(scene)
})

it('does not record history for an already aligned multi-selection', () => {
  let scene = addRectangle(createScene(), {
    id: 'first', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff',
  })
  scene = addRectangle(scene, {
    id: 'second', position: { x: 0, y: 20 }, size: { width: 10, height: 10 }, fill: '#000',
  })
  const kit = new CanvasKit({ scene })
  kit.selection.selectAll()

  expect(kit.alignSelection('left')).toBe(false)
  expect(kit.undo()).toEqual(scene)
})

it('distributes the current selection and treats insufficient or unchanged selections as no-ops', () => {
  let scene = addRectangle(createScene(), {
    id: 'first', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff',
  })
  scene = addRectangle(scene, {
    id: 'middle', position: { x: 30, y: 0 }, size: { width: 10, height: 10 }, fill: '#000',
  })
  scene = addRectangle(scene, {
    id: 'last', position: { x: 80, y: 0 }, size: { width: 10, height: 10 }, fill: '#123',
  })
  const kit = new CanvasKit({ scene })

  expect(kit.distributeSelection('horizontal')).toBe(false)
  kit.selection.select('first')
  expect(kit.distributeSelection('horizontal')).toBe(false)
  kit.selection.set(['first', 'middle', 'last'])
  expect(kit.distributeSelection('horizontal')).toBe(true)
  expect(kit.getScene().nodes.map((node) => node.position)).toEqual([{ x: 0, y: 0 }, { x: 40, y: 0 }, { x: 80, y: 0 }])
  expect(kit.undo()).toEqual(scene)
  expect(kit.redo().nodes.map((node) => node.position)).toEqual([{ x: 0, y: 0 }, { x: 40, y: 0 }, { x: 80, y: 0 }])
  expect(kit.undo()).toEqual(scene)
  expect(kit.undo()).toEqual(scene)
})

it('does not record history for an already distributed multi-selection', () => {
  let scene = addRectangle(createScene(), {
    id: 'first', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff',
  })
  scene = addRectangle(scene, {
    id: 'second', position: { x: 40, y: 0 }, size: { width: 10, height: 10 }, fill: '#000',
  })
  scene = addRectangle(scene, {
    id: 'third', position: { x: 80, y: 0 }, size: { width: 10, height: 10 }, fill: '#123',
  })
  const kit = new CanvasKit({ scene })
  kit.selection.selectAll()

  expect(kit.distributeSelection('horizontal')).toBe(false)
  expect(kit.undo()).toEqual(scene)
})
