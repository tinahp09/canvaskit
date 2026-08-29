import { DEFAULT_LAYER_ID, type CanvasLayer, type CanvasScene, type CreateGroupInput } from './model.js'

export function addLayer(scene: CanvasScene, layer: CanvasLayer): CanvasScene {
  if (scene.layers.some((item) => item.id === layer.id)) throw new Error(`A layer with id "${layer.id}" already exists.`)
  return { ...scene, layers: [...scene.layers, { ...layer }] }
}

export function removeLayer(scene: CanvasScene, layerId: string): CanvasScene {
  assertLayer(scene, layerId)
  if (scene.nodes.some((node) => node.layerId === layerId)) throw new Error('Cannot remove a nonempty layer.')
  if (layerId === DEFAULT_LAYER_ID) throw new Error('Cannot remove the default layer.')
  if (scene.layers.length === 1) throw new Error('Cannot remove the final layer.')
  return { ...scene, layers: scene.layers.filter((layer) => layer.id !== layerId) }
}

export function implicitLayerId(scene: CanvasScene): string {
  if (scene.layers.some((layer) => layer.id === DEFAULT_LAYER_ID)) return DEFAULT_LAYER_ID
  const fallbackLayer = scene.layers[0]
  if (!fallbackLayer) throw new Error('Scene must contain at least one layer.')
  return fallbackLayer.id
}

export function reorderLayer(scene: CanvasScene, layerId: string, targetIndex: number): CanvasScene {
  const sourceIndex = layerIndex(scene, layerId)
  if (sourceIndex < 0) throw new Error(`Unknown layer id: ${layerId}.`)
  assertTargetIndex(targetIndex, scene.layers.length)
  if (sourceIndex === targetIndex) return scene
  const layers = [...scene.layers]
  const [layer] = layers.splice(sourceIndex, 1)
  layers.splice(targetIndex, 0, layer!)
  return { ...scene, layers }
}

export function moveNodesToLayer(scene: CanvasScene, nodeIds: readonly string[], layerId: string): CanvasScene {
  assertLayer(scene, layerId)
  assertNodeIds(scene, nodeIds)
  const moving = new Set(nodeIds)
  return { ...scene, nodes: scene.nodes.map((node) => moving.has(node.id) ? { ...node, layerId } : node) }
}

export function setLayerVisibility(scene: CanvasScene, layerId: string, visible: boolean): CanvasScene {
  assertLayer(scene, layerId)
  return { ...scene, layers: scene.layers.map((layer) => layer.id === layerId ? { ...layer, visible } : layer) }
}

export function setLayerLocked(scene: CanvasScene, layerId: string, locked: boolean): CanvasScene {
  assertLayer(scene, layerId)
  return { ...scene, layers: scene.layers.map((layer) => layer.id === layerId ? { ...layer, locked } : layer) }
}

export function groupNodes(scene: CanvasScene, input: CreateGroupInput): CanvasScene {
  if (scene.groups.some((group) => group.id === input.id)) throw new Error(`A group with id "${input.id}" already exists.`)
  assertNodeIds(scene, input.nodeIds, 'Group nodes must exist.')
  return { ...scene, groups: [...scene.groups, { id: input.id, nodeIds: [...input.nodeIds] }] }
}

export function ungroupNodes(scene: CanvasScene, groupId: string): CanvasScene {
  if (!scene.groups.some((group) => group.id === groupId)) throw new Error(`Unknown group id: ${groupId}.`)
  return { ...scene, groups: scene.groups.filter((group) => group.id !== groupId) }
}

export function reorderNodeInLayer(scene: CanvasScene, nodeId: string, targetIndex: number): CanvasScene {
  const sourceIndex = scene.nodes.findIndex((node) => node.id === nodeId)
  if (sourceIndex < 0) throw new Error(`Unknown node id: ${nodeId}.`)
  const node = scene.nodes[sourceIndex]!
  const siblingIndexes = scene.nodes.flatMap((candidate, index) => candidate.layerId === node.layerId ? [index] : [])
  const localSourceIndex = siblingIndexes.indexOf(sourceIndex)
  assertTargetIndex(targetIndex, siblingIndexes.length)
  if (localSourceIndex === targetIndex) return scene

  const nodes = [...scene.nodes]
  nodes.splice(sourceIndex, 1)
  const targetGlobalIndex = siblingIndexes[targetIndex]!
  nodes.splice(targetGlobalIndex, 0, node)
  return { ...scene, nodes }
}

function assertLayer(scene: CanvasScene, layerId: string): void {
  if (layerIndex(scene, layerId) < 0) throw new Error(`Unknown layer id: ${layerId}.`)
}

function layerIndex(scene: CanvasScene, layerId: string): number {
  return scene.layers.findIndex((layer) => layer.id === layerId)
}

function assertNodeIds(scene: CanvasScene, ids: readonly string[], unknownMessage?: string): void {
  if (new Set(ids).size !== ids.length) throw new Error('Node ids must be unique.')
  const existingIds = new Set(scene.nodes.map((node) => node.id))
  for (const id of ids) {
    if (!existingIds.has(id)) throw new Error(unknownMessage ?? `Unknown node id: ${id}.`)
  }
}

function assertTargetIndex(targetIndex: number, length: number): void {
  if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= length) throw new RangeError('Target index is out of bounds.')
}
