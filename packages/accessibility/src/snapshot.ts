import { projectVisibleDocument, type CanvasNode, type CanvasScene } from '@canvaskit/core'

export interface AccessibilityItem { id: string; role: 'listitem'; label: string; selected: boolean }
export interface AccessibilitySnapshot { items: AccessibilityItem[] }

export function createAccessibilitySnapshot(scene: CanvasScene, selectedIds: readonly string[] = []): AccessibilitySnapshot {
  const selected = new Set(selectedIds)
  const { nodes, connectors } = projectVisibleDocument(scene)
  return { items: [
    ...nodes.map((node) => ({ id: node.id, role: 'listitem' as const, label: nodeLabel(node), selected: selected.has(node.id) })),
    ...connectors.map((connector) => ({ id: connector.id, role: 'listitem' as const, label: `Connector: ${connector.label ?? connector.id}`, selected: selected.has(connector.id) })),
  ] }
}

function nodeLabel(node: CanvasNode): string {
  if (node.type === 'text') return `Text: ${node.text}`
  if (node.type === 'image') return `Image: ${node.assetId}`
  return `${node.type === 'circle' ? 'Circle' : 'Rectangle'}: ${node.id}`
}
