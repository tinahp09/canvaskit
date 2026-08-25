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

it('duplicates an internal edge when both endpoints are copied', () => {
  const graph = addEdge(addRectangle(addRectangle(createScene(), rectangle), {
    ...rectangle, id: 'b', position: { x: 30, y: 0 },
  }), { id: 'link', sourceId: 'a', targetId: 'b', type: 'arrow' })

  const result = pasteSelection(graph, copySelection(graph, ['a', 'b']), { x: 10, y: 0 })

  expect(result.scene.edges).toHaveLength(2)
  expect(result.scene.edges[1]).toEqual({ id: 'link-copy', sourceId: 'a-copy', targetId: 'b-copy', type: 'arrow' })
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
    groups: [{ id: 'invalid-group', nodeIds: ['a', 'missing'] }],
  }

  const result = pasteSelection(createScene(), clipboard, { x: 0, y: 0 })

  expect(result.scene.nodes.map((node) => node.id)).toEqual(['a-copy'])
  expect(result.scene.edges).toEqual([])
  expect(result.scene.groups).toEqual([])
})

it('preserves node subtype fields and remaps copied group members', () => {
  let scene = addRectangle(createScene(), rectangle)
  scene = addCircle(scene, { id: 'b', type: 'circle', position: { x: 30, y: 0 }, radius: 12, fill: '#123' })
  scene = addGroup(scene, { id: 'pair', nodeIds: ['a', 'b'] })

  const result = pasteSelection(scene, copySelection(scene, ['a', 'b']), { x: 5, y: 8 })

  expect(result.scene.nodes[3]).toEqual({ id: 'b-copy', type: 'circle', position: { x: 35, y: 8 }, radius: 12, fill: '#123' })
  expect(result.scene.groups[1]).toEqual({ id: 'pair-copy', nodeIds: ['a-copy', 'b-copy'] })
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
  expect(result.scene.edges.at(-1)).toEqual({ id: 'link-copy-2', sourceId: 'a-copy-2', targetId: 'b-copy-2', type: 'line' })
  expect(result.scene.groups.at(-1)).toEqual({ id: 'pair-copy-2', nodeIds: ['a-copy-2', 'b-copy-2'] })
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

it('duplicates the selection at a twenty-pixel offset', () => {
  const kit = new CanvasKit({ scene: addRectangle(createScene(), rectangle) })
  kit.selection.select('a')

  const ids = kit.duplicate()

  expect(ids).toEqual(['a-copy'])
  expect(kit.getScene().nodes[1]?.position).toEqual({ x: 20, y: 20 })
})
