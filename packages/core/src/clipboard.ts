import type { Point } from '@canvaskit/geometry'
import type { CanvasConnector, CanvasEdge, CanvasGroup, CanvasNode, CanvasScene } from './model.js'
import { translateNode } from './scene.js'
import { implicitLayerId } from './document.js'

export interface SceneClipboard {
  nodes: CanvasNode[]
  connectors?: CanvasConnector[]
  /** @deprecated Legacy clipboard edge adapter. V4 scenes store connectors. */
  edges: CanvasEdge[]
  groups: CanvasGroup[]
}

export interface PasteSelectionResult {
  scene: CanvasScene
  ids: string[]
}

export function cloneClipboard(clipboard: SceneClipboard): SceneClipboard {
  return {
    nodes: clipboard.nodes.map(cloneNode),
    connectors: connectorClipboard(clipboard).map((connector) => ({ ...connector })),
    edges: clipboard.edges.map((edge) => ({ ...edge })),
    groups: clipboard.groups.map((group) => ({ ...group, nodeIds: [...group.nodeIds] })),
  }
}

export function removeSelection(scene: CanvasScene, ids: readonly string[]): CanvasScene {
  const removedIds = new Set(ids)
  if (removedIds.size === 0) return scene

  const nodes = scene.nodes.filter((node) => !removedIds.has(node.id))
  const remainingIds = new Set(nodes.map((node) => node.id))

  return {
    ...scene,
    nodes,
    connectors: scene.connectors.filter((connector) => remainingIds.has(connector.sourceNodeId) && remainingIds.has(connector.targetNodeId)),
    groups: scene.groups
      .map((group) => ({ ...group, nodeIds: group.nodeIds.filter((id) => remainingIds.has(id)) }))
      .filter((group) => group.nodeIds.length > 0),
  }
}

export function copySelection(scene: CanvasScene, ids: readonly string[]): SceneClipboard {
  const selected = new Set(ids)
  const nodes = scene.nodes.filter((node) => selected.has(node.id)).map(cloneNode)
  const nodeIds = new Set(nodes.map((node) => node.id))

  return {
    nodes,
    connectors: scene.connectors.filter((connector) => nodeIds.has(connector.sourceNodeId) && nodeIds.has(connector.targetNodeId)).map((connector) => ({ ...connector })),
    edges: [],
    groups: scene.groups.filter((group) => group.nodeIds.every((id) => nodeIds.has(id))).map((group) => ({ ...group, nodeIds: [...group.nodeIds] })),
  }
}

export function pasteSelection(scene: CanvasScene, clipboard: SceneClipboard, offset: Point): PasteSelectionResult {
  if (clipboard.nodes.length === 0) return { scene, ids: [] }

  const destinationLayerIds = new Set(scene.layers.map((layer) => layer.id))
  const fallbackLayerId = implicitLayerId(scene)
  const nodeIds = new Set(scene.nodes.map((node) => node.id))
  const connectorIds = new Set(scene.connectors.map((connector) => connector.id))
  const groupIds = new Set(scene.groups.map((group) => group.id))
  const remappedIds = new Map<string, string>()
  const nodes = clipboard.nodes.map((node) => {
    const id = uniqueCopyId(node.id, nodeIds)
    remappedIds.set(node.id, id)
    const translated = translateNode(node, id, offset)
    return destinationLayerIds.has(translated.layerId) ? translated : { ...translated, layerId: fallbackLayerId }
  })
  const connectors = connectorClipboard(clipboard).filter((connector) => remappedIds.has(connector.sourceNodeId) && remappedIds.has(connector.targetNodeId)).map((connector) => ({
    ...connector,
    id: uniqueCopyId(connector.id, connectorIds),
    sourceNodeId: remappedIds.get(connector.sourceNodeId)!,
    targetNodeId: remappedIds.get(connector.targetNodeId)!,
  }))
  const groups = clipboard.groups.filter((group) => new Set(group.nodeIds).size === group.nodeIds.length && group.nodeIds.every((id) => remappedIds.has(id))).map((group) => ({
    ...group,
    id: uniqueCopyId(group.id, groupIds),
    nodeIds: group.nodeIds.map((id) => remappedIds.get(id)!),
  }))

  return {
    scene: { ...scene, nodes: [...scene.nodes, ...nodes], connectors: [...scene.connectors, ...connectors], groups: [...scene.groups, ...groups] },
    ids: nodes.map((node) => node.id),
  }
}

function cloneNode(node: CanvasNode): CanvasNode {
  if (node.type === 'rectangle') {
    return { ...node, position: { ...node.position }, size: { ...node.size } }
  }
  return { ...node, position: { ...node.position } }
}

function uniqueCopyId(id: string, used: Set<string>): string {
  let suffix = 1
  let candidate = `${id}-copy`
  while (used.has(candidate)) candidate = `${id}-copy-${++suffix}`
  used.add(candidate)
  return candidate
}

function connectorClipboard(clipboard: SceneClipboard): CanvasConnector[] {
  if (clipboard.connectors !== undefined) return clipboard.connectors
  return clipboard.edges.map((edge) => ({
    id: edge.id,
    sourceNodeId: edge.sourceId,
    sourcePortId: 'center',
    targetNodeId: edge.targetId,
    targetPortId: 'center',
    routing: 'straight',
  }))
}
