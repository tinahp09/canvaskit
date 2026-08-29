import { DEFAULT_LAYER_ID, SCENE_VERSION, type CanvasNode, type CanvasScene, type CreateCircleInput, type CreateEdgeInput, type CreateGroupInput, type CreateRectangleInput, type CreateTextInput } from './model.js'
import type { Point } from '@canvaskit/geometry'
import { groupNodes } from './document.js'

export function createScene(): CanvasScene {
  return {
    version: SCENE_VERSION,
    nodes: [],
    edges: [],
    groups: [],
    layers: [{ id: DEFAULT_LAYER_ID, name: 'Default', visible: true, locked: false }],
    viewport: { x: 0, y: 0, zoom: 1 },
    metadata: {},
  }
}

export function addRectangle(scene: CanvasScene, input: CreateRectangleInput): CanvasScene {
  if (scene.nodes.some((node) => node.id === input.id)) {
    throw new Error(`A node with id "${input.id}" already exists.`)
  }

  const layerId = input.layerId ?? DEFAULT_LAYER_ID
  assertNodeLayer(scene, layerId)
  return {
    ...scene,
    nodes: [...scene.nodes, { ...input, layerId, type: 'rectangle' }],
  }
}
function addNode(scene: CanvasScene, node: CanvasNode): CanvasScene {
  if (scene.nodes.some((item) => item.id === node.id)) throw new Error(`A node with id "${node.id}" already exists.`)
  assertNodeLayer(scene, node.layerId)
  return { ...scene, nodes: [...scene.nodes, node] }
}
export function addCircle(scene: CanvasScene, input: CreateCircleInput): CanvasScene { return addNode(scene, { ...input, layerId: input.layerId ?? DEFAULT_LAYER_ID, type: 'circle' }) }
export function addText(scene: CanvasScene, input: CreateTextInput): CanvasScene { return addNode(scene, { ...input, layerId: input.layerId ?? DEFAULT_LAYER_ID, type: 'text' }) }
export function addEdge(scene: CanvasScene, input: CreateEdgeInput): CanvasScene {
  if (scene.edges.some((edge) => edge.id === input.id)) throw new Error(`An edge with id "${input.id}" already exists.`)
  if (!scene.nodes.some((node) => node.id === input.sourceId) || !scene.nodes.some((node) => node.id === input.targetId)) throw new Error('Edge endpoints must exist.')
  return { ...scene, edges: [...scene.edges, { ...input }] }
}
export function removeEdge(scene: CanvasScene, edgeId: string): CanvasScene {
  return { ...scene, edges: scene.edges.filter((edge) => edge.id !== edgeId) }
}
export function addGroup(scene: CanvasScene, input: CreateGroupInput): CanvasScene {
  return groupNodes(scene, input)
}
export function connectNodes(scene: CanvasScene, sourceId: string, targetId: string, type: CreateEdgeInput['type'] = 'arrow'): CanvasScene {
  const id = `edge-${scene.edges.length + 1}`
  return addEdge(scene, { id, sourceId, targetId, type })
}

export function translateNode(node: CanvasNode, id: string, offset: Point): CanvasNode {
  return {
    ...node,
    id,
    position: { x: node.position.x + offset.x, y: node.position.y + offset.y },
  }
}

function assertNodeLayer(scene: CanvasScene, layerId: string): void {
  if (!scene.layers.some((layer) => layer.id === layerId)) throw new Error(`Unknown layer id: ${layerId}.`)
}
