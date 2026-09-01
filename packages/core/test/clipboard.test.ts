import { expect, it } from 'vitest'
import {
  addCircle,
  addEdge,
  addGroup,
  addRectangle,
  CanvasKit,
  copySelection,
  createScene,
  pasteSelection,
  removeSelection,
  setGroupParent,
  type SceneClipboard,
} from '../src/index.js'

const rectangle = {
  id: 'a', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff',
}

it('pastes copied nodes with fresh ids and an offset', () => {
  const scene = addRectangle(createScene(), rectangle)

  const result = pasteSelection(scene, copySelection(scene, ['a']), { x: 20, y: 20 })

  expect(result.scene.nodes).toHaveLength(2)
  expect(result.ids).toEqual(['a-copy'])
  expect(result.scene.nodes[1]).toMatchObject({
    id: 'a-copy', position: { x: 20, y: 20 }, type: 'rectangle', size: { width: 10, height: 10 }, fill: '#fff',
  })
})

it('copies rectangle size into an independent lower-level clipboard snapshot', () => {
  const scene = addRectangle(createScene(), rectangle)
  const clipboard = copySelection(scene, ['a'])
  const copiedNode = clipboard.nodes[0]!
  if (copiedNode.type !== 'rectangle') throw new Error('Expected copied rectangle.')

  copiedNode.size.width = 999

  expect(scene.nodes[0]).toMatchObject({ id: 'a', size: { width: 10, height: 10 } })
})

it('duplicates an internal connector when both endpoints are copied', () => {
  const graph = addEdge(addRectangle(addRectangle(createScene(), rectangle), {
    ...rectangle, id: 'b', position: { x: 30, y: 0 },
  }), { id: 'link', sourceId: 'a', targetId: 'b', type: 'arrow' })

  const result = pasteSelection(graph, copySelection(graph, ['a', 'b']), { x: 10, y: 0 })

  expect(result.scene.connectors).toHaveLength(2)
  expect(result.scene.connectors[1]).toEqual({ id: 'link-copy', sourceNodeId: 'a-copy', sourcePortId: 'center', targetNodeId: 'b-copy', targetPortId: 'center', routing: 'straight' })
})

it('copies only edges and groups whose nodes are all selected', () => {
  let scene = addRectangle(createScene(), rectangle)
  scene = addRectangle(scene, { ...rectangle, id: 'b', position: { x: 30, y: 0 } })
  scene = addEdge(scene, { id: 'link', sourceId: 'a', targetId: 'b', type: 'line' })
  scene = addGroup(scene, { id: 'pair', nodeIds: ['a', 'b'] })

  const copied = copySelection(scene, ['a'])

  expect(copied.edges).toEqual([])
  expect(copied.groups).toEqual([])
})

it('filters clipboard relations that reference nodes outside the clipboard', () => {
  const source = addRectangle(createScene(), rectangle)
  const clipboard: SceneClipboard = {
    nodes: copySelection(source, ['a']).nodes,
    edges: [{ id: 'invalid-edge', sourceId: 'a', targetId: 'missing', type: 'arrow' }],
    groups: [{ id: 'invalid-group', nodeIds: ['a', 'missing'], visible: true, locked: false }],
  }

  const result = pasteSelection(createScene(), clipboard, { x: 0, y: 0 })

  expect(result.scene.nodes.map((node) => node.id)).toEqual(['a-copy'])
  expect(result.scene.connectors).toEqual([])
  expect(result.scene.groups).toEqual([])
})

it('preserves node subtype fields and remaps copied group members', () => {
  let scene = addRectangle(createScene(), rectangle)
  scene = addCircle(scene, { id: 'b', type: 'circle', position: { x: 30, y: 0 }, radius: 12, fill: '#123' })
  scene = addGroup(scene, { id: 'pair', nodeIds: ['a', 'b'] })

  const result = pasteSelection(scene, copySelection(scene, ['a', 'b']), { x: 5, y: 8 })

  expect(result.scene.nodes[3]).toEqual({ id: 'b-copy', layerId: 'layer-default', type: 'circle', position: { x: 35, y: 8 }, radius: 12, fill: '#123' })
  expect(result.scene.groups[1]).toEqual({ id: 'pair-copy', nodeIds: ['a-copy', 'b-copy'], visible: true, locked: false })
})

it('uses collision-free deterministic ids for pasted records', () => {
  let scene = addRectangle(createScene(), rectangle)
  scene = addRectangle(scene, { ...rectangle, id: 'a-copy' })
  scene = addRectangle(scene, { ...rectangle, id: 'b' })
  scene = addRectangle(scene, { ...rectangle, id: 'b-copy' })
  scene = addEdge(scene, { id: 'link', sourceId: 'a', targetId: 'b', type: 'line' })
  scene = addEdge(scene, { id: 'link-copy', sourceId: 'a-copy', targetId: 'b-copy', type: 'line' })
  scene = addGroup(scene, { id: 'pair', nodeIds: ['a', 'b'] })
  scene = addGroup(scene, { id: 'pair-copy', nodeIds: ['a-copy', 'b-copy'] })

  const result = pasteSelection(scene, copySelection(scene, ['a', 'b']), { x: 0, y: 0 })

  expect(result.ids).toEqual(['a-copy-2', 'b-copy-2'])
  expect(result.scene.connectors.at(-1)).toEqual({ id: 'link-copy-2', sourceNodeId: 'a-copy-2', sourcePortId: 'center', targetNodeId: 'b-copy-2', targetPortId: 'center', routing: 'straight' })
  expect(result.scene.groups.at(-1)).toEqual({ id: 'pair-copy-2', nodeIds: ['a-copy-2', 'b-copy-2'], visible: true, locked: false })
})

it('remaps nested group parent references when pasting a complete hierarchy', () => {
  let scene = addRectangle(createScene(), rectangle)
  scene = addRectangle(scene, { ...rectangle, id: 'b', position: { x: 30, y: 0 } })
  scene = addGroup(scene, { id: 'child', nodeIds: ['b'] })
  scene = addGroup(scene, { id: 'parent', nodeIds: ['a'] })
  scene = setGroupParent(scene, 'child', 'parent')

  const result = pasteSelection(scene, copySelection(scene, ['a', 'b']), { x: 0, y: 0 })

  expect(result.scene.groups.at(-2)).toMatchObject({ id: 'child-copy', parentId: 'parent-copy', nodeIds: ['b-copy'] })
  expect(result.scene.groups.at(-1)).toMatchObject({ id: 'parent-copy', nodeIds: ['a-copy'] })
})

it('promotes child groups when removing their parent group leaf nodes', () => {
  let scene = addRectangle(createScene(), rectangle)
  scene = addRectangle(scene, { ...rectangle, id: 'b', position: { x: 30, y: 0 } })
  scene = addGroup(scene, { id: 'child', nodeIds: ['b'] })
  scene = addGroup(scene, { id: 'parent', nodeIds: ['a'] })
  scene = setGroupParent(scene, 'child', 'parent')

  const removed = removeSelection(scene, ['a'])

  expect(removed.groups).toEqual([{ id: 'child', nodeIds: ['b'], visible: true, locked: false }])
})

it('returns the original scene without inserted ids for an empty clipboard', () => {
  const scene = addRectangle(createScene(), rectangle)

  const result = pasteSelection(scene, copySelection(scene, []), { x: 20, y: 20 })

  expect(result).toEqual({ scene, ids: [] })
  expect(result.scene).toBe(scene)
})

it('pastes through CanvasKit as one undoable command and selects inserted nodes', () => {
  const kit = new CanvasKit({ scene: addRectangle(createScene(), rectangle) })
  kit.selection.select('a')
  kit.copy()

  const ids = kit.paste({ x: 20, y: 20 })

  expect(ids).toEqual(['a-copy'])
  expect(kit.selection.get()).toEqual(['a-copy'])
  expect(kit.undo().nodes.map((node) => node.id)).toEqual(['a'])
})

it('keeps the selection consistent with the scene after paste undo and redo', () => {
  const kit = new CanvasKit({ scene: addRectangle(createScene(), rectangle) })
  kit.selection.select('a')
  kit.copy()
  kit.paste({ x: 20, y: 20 })

  kit.undo()
  expect(kit.selection.get().every((id) => kit.getScene().nodes.some((node) => node.id === id))).toBe(true)

  kit.redo()
  expect(kit.selection.get().every((id) => kit.getScene().nodes.some((node) => node.id === id))).toBe(true)
})

it('duplicates the selection at a twenty-pixel offset', () => {
  const kit = new CanvasKit({ scene: addRectangle(createScene(), rectangle) })
  kit.selection.select('a')

  const ids = kit.duplicate()

  expect(ids).toEqual(['a-copy'])
  expect(kit.getScene().nodes[1]?.position).toEqual({ x: 20, y: 20 })
})

it('keeps the internal clipboard unchanged when a returned copy snapshot is mutated', () => {
  const kit = new CanvasKit({ scene: addRectangle(createScene(), rectangle) })
  kit.selection.select('a')

  const returnedClipboard = kit.copy()
  const returnedNode = returnedClipboard.nodes[0]!
  if (returnedNode.type !== 'rectangle') throw new Error('Expected copied rectangle.')
  returnedNode.id = 'caller-modified'
  returnedNode.position.x = 999
  returnedNode.size.width = 999

  expect(kit.paste()).toEqual(['a-copy'])
  expect(kit.getScene().nodes.at(-1)).toMatchObject({ id: 'a-copy', position: { x: 20, y: 20 }, size: { width: 10, height: 10 } })
})

it('keeps the internal clipboard unchanged when a returned cut snapshot is mutated', () => {
  const kit = new CanvasKit({ scene: addRectangle(createScene(), rectangle) })
  kit.selection.select('a')

  const returnedClipboard = kit.cut()
  const returnedNode = returnedClipboard.nodes[0]!
  if (returnedNode.type !== 'rectangle') throw new Error('Expected cut rectangle.')
  returnedNode.id = 'caller-modified'
  returnedNode.size.width = 999

  expect(kit.paste()).toEqual(['a-copy'])
  expect(kit.getScene().nodes).toMatchObject([{ id: 'a-copy', size: { width: 10, height: 10 } }])
})

it('cuts selected nodes, cleans dangling relations, and restores the whole scene with one undo', () => {
  let scene = addRectangle(createScene(), rectangle)
  scene = addRectangle(scene, { ...rectangle, id: 'b', position: { x: 30, y: 0 } })
  scene = addRectangle(scene, { ...rectangle, id: 'c', position: { x: 60, y: 0 } })
  scene = addEdge(scene, { id: 'ab', sourceId: 'a', targetId: 'b', type: 'line' })
  scene = addEdge(scene, { id: 'bc', sourceId: 'b', targetId: 'c', type: 'arrow' })
  scene = addGroup(scene, { id: 'all', nodeIds: ['a', 'b', 'c'] })
  const kit = new CanvasKit({ scene })
  kit.selection.set(['b'])

  const clipboard = kit.cut()

  expect(clipboard.nodes.map((node) => node.id)).toEqual(['b'])
  expect(kit.getScene().nodes.map((node) => node.id)).toEqual(['a', 'c'])
  expect(kit.getScene().connectors).toEqual([])
  expect(kit.getScene().groups).toEqual([{ id: 'all', nodeIds: ['a', 'c'], visible: true, locked: false }])
  expect(kit.selection.get()).toEqual([])
  expect(kit.undo()).toEqual(scene)
})
