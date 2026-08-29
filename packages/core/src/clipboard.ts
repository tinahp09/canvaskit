import type { Point } from '@canvaskit/geometry'
import type { CanvasEdge, CanvasGroup, CanvasNode, CanvasScene } from './model.js'
import { translateNode } from './scene.js'

export interface SceneClipboard {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  groups: CanvasGroup[]
}

export interface PasteSelectionResult {
  scene: CanvasScene
  ids: string[]
}

export function cloneClipboard(clipboard: SceneClipboard): SceneClipboard {
  return {
    nodes: clipboard.nodes.map((node) => ({ ...node, position: { ...node.position } })),
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
    edges: scene.edges.filter((edge) => remainingIds.has(edge.sourceId) && remainingIds.has(edge.targetId)),
    groups: scene.groups
      .map((group) => ({ ...group, nodeIds: group.nodeIds.filter((id) => remainingIds.has(id)) }))
      .filter((group) => group.nodeIds.length > 0),
  }
}

export function copySelection(scene: CanvasScene, ids: readonly string[]): SceneClipboard {
  const selected = new Set(ids)
  const nodes = scene.nodes.filter((node) => selected.has(node.id)).map((node) => ({
    ...node,
    position: { ...node.position },
  }))
  const nodeIds = new Set(nodes.map((node) => node.id))

  return {
    nodes,
    edges: scene.edges.filter((edge) => nodeIds.has(edge.sourceId) && nodeIds.has(edge.targetId)).map((edge) => ({ ...edge })),
    groups: scene.groups.filter((group) => group.nodeIds.every((id) => nodeIds.has(id))).map((group) => ({ ...group, nodeIds: [...group.nodeIds] })),
  }
}

export function pasteSelection(scene: CanvasScene, clipboard: SceneClipboard, offset: Point): PasteSelectionResult {
  if (clipboard.nodes.length === 0) return { scene, ids: [] }

  const nodeIds = new Set(scene.nodes.map((node) => node.id))
  const edgeIds = new Set(scene.edges.map((edge) => edge.id))
  const groupIds = new Set(scene.groups.map((group) => group.id))
  const remappedIds = new Map<string, string>()
  const nodes = clipboard.nodes.map((node) => {
    const id = uniqueCopyId(node.id, nodeIds)
    remappedIds.set(node.id, id)
    return translateNode(node, id, offset)
  })
  const edges = clipboard.edges.filter((edge) => remappedIds.has(edge.sourceId) && remappedIds.has(edge.targetId)).map((edge) => ({
    ...edge,
    id: uniqueCopyId(edge.id, edgeIds),
    sourceId: remappedIds.get(edge.sourceId)!,
    targetId: remappedIds.get(edge.targetId)!,
  }))
  const groups = clipboard.groups.filter((group) => group.nodeIds.every((id) => remappedIds.has(id))).map((group) => ({
    ...group,
    id: uniqueCopyId(group.id, groupIds),
    nodeIds: group.nodeIds.map((id) => remappedIds.get(id)!),
  }))

  return {
    scene: { ...scene, nodes: [...scene.nodes, ...nodes], edges: [...scene.edges, ...edges], groups: [...scene.groups, ...groups] },
    ids: nodes.map((node) => node.id),
  }
}

function uniqueCopyId(id: string, used: Set<string>): string {
  let suffix = 1
  let candidate = `${id}-copy`
  while (used.has(candidate)) candidate = `${id}-copy-${++suffix}`
  used.add(candidate)
  return candidate
}
