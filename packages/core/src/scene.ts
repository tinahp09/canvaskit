import { SCENE_VERSION, type CanvasNode, type CanvasScene, type CreateCircleInput, type CreateEdgeInput, type CreateGroupInput, type CreateRectangleInput, type CreateTextInput } from './model.js'

export function createScene(): CanvasScene {
  return {
    version: SCENE_VERSION,
    nodes: [],
    edges: [],
    groups: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    metadata: {},
  }
}

export function addRectangle(scene: CanvasScene, input: CreateRectangleInput): CanvasScene {
  if (scene.nodes.some((node) => node.id === input.id)) {
    throw new Error(`A node with id "${input.id}" already exists.`)
  }

  return {
    ...scene,
    nodes: [...scene.nodes, { ...input, type: 'rectangle' }],
  }
}
function addNode(scene: CanvasScene, node: CanvasNode): CanvasScene {
  if (scene.nodes.some((item) => item.id === node.id)) throw new Error(`A node with id "${node.id}" already exists.`)
  return { ...scene, nodes: [...scene.nodes, node] }
}
export function addCircle(scene: CanvasScene, input: CreateCircleInput): CanvasScene { return addNode(scene, { ...input, type: 'circle' }) }
export function addText(scene: CanvasScene, input: CreateTextInput): CanvasScene { return addNode(scene, { ...input, type: 'text' }) }
export function addEdge(scene: CanvasScene, input: CreateEdgeInput): CanvasScene {
  if (scene.edges.some((edge) => edge.id === input.id)) throw new Error(`An edge with id "${input.id}" already exists.`)
  if (!scene.nodes.some((node) => node.id === input.sourceId) || !scene.nodes.some((node) => node.id === input.targetId)) throw new Error('Edge endpoints must exist.')
  return { ...scene, edges: [...scene.edges, { ...input }] }
}
export function removeEdge(scene: CanvasScene, edgeId: string): CanvasScene {
  return { ...scene, edges: scene.edges.filter((edge) => edge.id !== edgeId) }
}
export function addGroup(scene: CanvasScene, input: CreateGroupInput): CanvasScene {
  if (scene.groups.some((group) => group.id === input.id)) throw new Error(`A group with id "${input.id}" already exists.`)
  if (input.nodeIds.some((id) => !scene.nodes.some((node) => node.id === id))) throw new Error('Group nodes must exist.')
  return { ...scene, groups: [...scene.groups, { ...input, nodeIds: [...input.nodeIds] }] }
}
export function connectNodes(scene: CanvasScene, sourceId: string, targetId: string, type: CreateEdgeInput['type'] = 'arrow'): CanvasScene {
  const id = `edge-${scene.edges.length + 1}`
  return addEdge(scene, { id, sourceId, targetId, type })
}
