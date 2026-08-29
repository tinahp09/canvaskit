import { SCENE_VERSION, type CanvasConnector, type CanvasLayer, type CanvasNode, type CanvasScene, type RectangleNode } from './model.js'
import { InvalidSceneError, migrateScene, UnsupportedSceneVersionError } from './migrations.js'
import { findNodePort } from './ports.js'

export { InvalidSceneError, UnsupportedSceneVersionError } from './migrations.js'

export function exportScene(scene: CanvasScene): string {
  return JSON.stringify(parseCanonicalScene(scene))
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
  if (Object.hasOwn(value, 'edges')) throw new InvalidSceneError('Version 4 scenes must use connectors instead of edges.')
  if (!Array.isArray(value.nodes)) throw new InvalidSceneError('Scene nodes must be an array.')
  if (!Array.isArray(value.connectors) || !Array.isArray(value.groups) || !Array.isArray(value.layers)) throw new InvalidSceneError('Scene graph state is invalid.')
  if (!isTransform(value.viewport)) throw new InvalidSceneError('Scene viewport is invalid.')
  if (!isRecord(value.metadata)) throw new InvalidSceneError('Scene metadata must be an object.')

  const scene = {
    version: SCENE_VERSION,
    nodes: value.nodes.map(parseNode),
    connectors: value.connectors.map(parseConnector),
    groups: value.groups.map(parseGroup),
    layers: value.layers.map(parseLayer),
    viewport: value.viewport,
    metadata: value.metadata,
  }
  assertCanonicalReferences(scene)
  return scene
}
function parseLayer(value: unknown): CanvasLayer { if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string' || typeof value.visible !== 'boolean' || typeof value.locked !== 'boolean') throw new InvalidSceneError('Scene contains an invalid layer.'); return { id: value.id, name: value.name, visible: value.visible, locked: value.locked } }
function parseConnector(value: unknown): CanvasConnector {
  if (!isRecord(value) || typeof value.id !== 'string'
    || typeof value.sourceNodeId !== 'string' || typeof value.sourcePortId !== 'string'
    || typeof value.targetNodeId !== 'string' || typeof value.targetPortId !== 'string'
    || !['straight', 'orthogonal'].includes(String(value.routing))
    || (value.label !== undefined && typeof value.label !== 'string')) {
    throw new InvalidSceneError('Scene contains an invalid connector.')
  }
  return {
    id: value.id,
    sourceNodeId: value.sourceNodeId,
    sourcePortId: value.sourcePortId,
    targetNodeId: value.targetNodeId,
    targetPortId: value.targetPortId,
    routing: value.routing as CanvasConnector['routing'],
    ...(value.label === undefined ? {} : { label: value.label }),
  }
}
function parseGroup(value: unknown) { if (!isRecord(value) || typeof value.id !== 'string' || !Array.isArray(value.nodeIds) || !value.nodeIds.every((id) => typeof id === 'string')) throw new InvalidSceneError('Scene contains an invalid group.'); return { id: value.id, nodeIds: value.nodeIds as string[] } }
function parseNode(value: unknown): CanvasNode {
  if (isRecord(value) && value.type === 'circle' && typeof value.id === 'string' && typeof value.layerId === 'string' && isPoint(value.position) && typeof value.radius === 'number' && typeof value.fill === 'string') return { id: value.id, layerId: value.layerId, type: 'circle', position: value.position, radius: value.radius, fill: value.fill }
  if (isRecord(value) && value.type === 'text' && typeof value.id === 'string' && typeof value.layerId === 'string' && isPoint(value.position) && typeof value.text === 'string' && typeof value.fill === 'string' && typeof value.fontSize === 'number') return { id: value.id, layerId: value.layerId, type: 'text', position: value.position, text: value.text, fill: value.fill, fontSize: value.fontSize }
  return parseRectangle(value)
}

function parseRectangle(value: unknown): RectangleNode {
  if (!isRecord(value) || value.type !== 'rectangle' || typeof value.id !== 'string' || typeof value.layerId !== 'string'
    || !isPoint(value.position) || !isSize(value.size) || typeof value.fill !== 'string') {
    throw new InvalidSceneError('Scene contains an invalid rectangle node.')
  }

  return { id: value.id, layerId: value.layerId, type: 'rectangle', position: value.position, size: value.size, fill: value.fill }
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
  uniqueIds(scene.connectors, 'connector')
  uniqueIds(scene.groups, 'group')
  const layerIds = uniqueIds(scene.layers, 'layer')
  if (layerIds.size === 0) throw new InvalidSceneError('Scene must contain at least one layer.')
  if (scene.nodes.some((node) => !layerIds.has(node.layerId))) throw new InvalidSceneError('Scene nodes must reference existing layers.')

  for (const connector of scene.connectors) {
    const source = scene.nodes.find((node) => node.id === connector.sourceNodeId)
    const target = scene.nodes.find((node) => node.id === connector.targetNodeId)
    if (!source || !target || !findNodePort(source, connector.sourcePortId) || !findNodePort(target, connector.targetPortId)) {
      throw new InvalidSceneError('Scene connector endpoints must reference existing node ports.')
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
