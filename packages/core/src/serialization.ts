import { SCENE_VERSION, type CanvasNode, type CanvasScene, type RectangleNode } from './model.js'
import { InvalidSceneError, migrateScene, UnsupportedSceneVersionError } from './migrations.js'

export { InvalidSceneError, UnsupportedSceneVersionError } from './migrations.js'

export function exportScene(scene: CanvasScene): string {
  return JSON.stringify(scene)
}

export function importScene(json: string): CanvasScene {
  let value: unknown
  try {
    value = JSON.parse(json)
  } catch {
    throw new InvalidSceneError('Scene JSON is invalid.')
  }
  return parseCanonicalScene(migrateScene(value))
}

export const serializeScene = exportScene
export const loadScene = importScene

function parseCanonicalScene(value: unknown): CanvasScene {
  if (!isRecord(value)) throw new InvalidSceneError('Scene must be an object.')
  if (value.version !== SCENE_VERSION) throw new UnsupportedSceneVersionError(value.version)
  if (!Array.isArray(value.nodes)) throw new InvalidSceneError('Scene nodes must be an array.')
  if (!Array.isArray(value.edges) || !Array.isArray(value.groups)) throw new InvalidSceneError('Scene graph state is invalid.')
  if (!isTransform(value.viewport)) throw new InvalidSceneError('Scene viewport is invalid.')
  if (!isRecord(value.metadata)) throw new InvalidSceneError('Scene metadata must be an object.')

  const scene = {
    version: SCENE_VERSION,
    nodes: value.nodes.map(parseNode),
    edges: value.edges.map(parseEdge),
    groups: value.groups.map(parseGroup),
    viewport: value.viewport,
    metadata: value.metadata,
  }
  assertCanonicalReferences(scene)
  return scene
}
function parseEdge(value: unknown) { if (!isRecord(value) || typeof value.id !== 'string' || !['line', 'arrow', 'bezier'].includes(String(value.type)) || typeof value.sourceId !== 'string' || typeof value.targetId !== 'string') throw new InvalidSceneError('Scene contains an invalid edge.'); return { id: value.id, type: value.type as 'line' | 'arrow' | 'bezier', sourceId: value.sourceId, targetId: value.targetId } }
function parseGroup(value: unknown) { if (!isRecord(value) || typeof value.id !== 'string' || !Array.isArray(value.nodeIds) || !value.nodeIds.every((id) => typeof id === 'string')) throw new InvalidSceneError('Scene contains an invalid group.'); return { id: value.id, nodeIds: value.nodeIds as string[] } }
function parseNode(value: unknown): CanvasNode {
  if (isRecord(value) && value.type === 'circle' && typeof value.id === 'string' && isPoint(value.position) && typeof value.radius === 'number' && typeof value.fill === 'string') return { id: value.id, type: 'circle', position: value.position, radius: value.radius, fill: value.fill }
  if (isRecord(value) && value.type === 'text' && typeof value.id === 'string' && isPoint(value.position) && typeof value.text === 'string' && typeof value.fill === 'string' && typeof value.fontSize === 'number') return { id: value.id, type: 'text', position: value.position, text: value.text, fill: value.fill, fontSize: value.fontSize }
  return parseRectangle(value)
}

function parseRectangle(value: unknown): RectangleNode {
  if (!isRecord(value) || value.type !== 'rectangle' || typeof value.id !== 'string'
    || !isPoint(value.position) || !isSize(value.size) || typeof value.fill !== 'string') {
    throw new InvalidSceneError('Scene contains an invalid rectangle node.')
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

function assertCanonicalReferences(scene: CanvasScene): void {
  const nodeIds = uniqueIds(scene.nodes, 'node')
  uniqueIds(scene.edges, 'edge')
  uniqueIds(scene.groups, 'group')

  for (const edge of scene.edges) {
    if (!nodeIds.has(edge.sourceId) || !nodeIds.has(edge.targetId)) {
      throw new InvalidSceneError('Scene edge endpoints must reference existing nodes.')
    }
  }

  for (const group of scene.groups) {
    if (new Set(group.nodeIds).size !== group.nodeIds.length || group.nodeIds.some((id) => !nodeIds.has(id))) {
      throw new InvalidSceneError('Scene group members must reference existing nodes uniquely.')
    }
  }
}

function uniqueIds(records: readonly { id: string }[], recordType: string): Set<string> {
  const ids = new Set<string>()
  for (const record of records) {
    if (ids.has(record.id)) throw new InvalidSceneError(`Scene contains duplicate ${recordType} ids.`)
    ids.add(record.id)
  }
  return ids
}
