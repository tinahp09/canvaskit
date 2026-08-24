import type { CanvasNode, CanvasScene, RectangleNode } from './model.js'

export class UnsupportedSceneVersionError extends Error {
  constructor(version: unknown) {
    super(`Unsupported scene version: ${String(version)}.`)
    this.name = 'UnsupportedSceneVersionError'
  }
}

export function serializeScene(scene: CanvasScene): string {
  return JSON.stringify(scene)
}

export function loadScene(json: string): CanvasScene {
  const value: unknown = JSON.parse(json)
  if (!isRecord(value)) throw new Error('Scene must be an object.')
  if (value.version !== 1) throw new UnsupportedSceneVersionError(value.version)
  if (!Array.isArray(value.nodes)) throw new Error('Scene nodes must be an array.')
  const edges = value.edges === undefined ? [] : value.edges
  const groups = value.groups === undefined ? [] : value.groups
  if (!Array.isArray(edges) || !Array.isArray(groups)) throw new Error('Scene graph state is invalid.')
  if (!isTransform(value.viewport)) throw new Error('Scene viewport is invalid.')
  if (!isRecord(value.metadata)) throw new Error('Scene metadata must be an object.')

  return {
    version: 1,
    nodes: value.nodes.map(parseNode),
    edges: edges.map(parseEdge),
    groups: groups.map(parseGroup),
    viewport: value.viewport,
    metadata: value.metadata,
  }
}
function parseEdge(value: unknown) { if (!isRecord(value) || typeof value.id !== 'string' || !['line', 'arrow', 'bezier'].includes(String(value.type)) || typeof value.sourceId !== 'string' || typeof value.targetId !== 'string') throw new Error('Scene contains an invalid edge.'); return { id: value.id, type: value.type as 'line' | 'arrow' | 'bezier', sourceId: value.sourceId, targetId: value.targetId } }
function parseGroup(value: unknown) { if (!isRecord(value) || typeof value.id !== 'string' || !Array.isArray(value.nodeIds) || !value.nodeIds.every((id) => typeof id === 'string')) throw new Error('Scene contains an invalid group.'); return { id: value.id, nodeIds: value.nodeIds as string[] } }
function parseNode(value: unknown): CanvasNode {
  if (isRecord(value) && value.type === 'circle' && typeof value.id === 'string' && isPoint(value.position) && typeof value.radius === 'number' && typeof value.fill === 'string') return { id: value.id, type: 'circle', position: value.position, radius: value.radius, fill: value.fill }
  if (isRecord(value) && value.type === 'text' && typeof value.id === 'string' && isPoint(value.position) && typeof value.text === 'string' && typeof value.fill === 'string' && typeof value.fontSize === 'number') return { id: value.id, type: 'text', position: value.position, text: value.text, fill: value.fill, fontSize: value.fontSize }
  return parseRectangle(value)
}

function parseRectangle(value: unknown): RectangleNode {
  if (!isRecord(value) || value.type !== 'rectangle' || typeof value.id !== 'string'
    || !isPoint(value.position) || !isSize(value.size) || typeof value.fill !== 'string') {
    throw new Error('Scene contains an invalid rectangle node.')
  }

  return { id: value.id, type: 'rectangle', position: value.position, size: value.size, fill: value.fill }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPoint(value: unknown): value is { x: number; y: number } {
  return isRecord(value) && typeof value.x === 'number' && typeof value.y === 'number'
}

function isSize(value: unknown): value is { width: number; height: number } {
  return isRecord(value) && typeof value.width === 'number' && typeof value.height === 'number'
}

function isTransform(value: unknown): value is { x: number; y: number; zoom: number } {
  return isRecord(value)
    && typeof value.x === 'number'
    && typeof value.y === 'number'
    && typeof value.zoom === 'number'
}
