import { DEFAULT_LAYER_ID, SCENE_VERSION } from './model.js'

export class InvalidSceneError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidSceneError'
  }
}

export class UnsupportedSceneVersionError extends InvalidSceneError {
  constructor(version: unknown) {
    super(`Unsupported scene version: ${String(version)}.`)
    this.name = 'UnsupportedSceneVersionError'
  }
}

export function migrateScene(value: unknown): unknown {
  if (!isRecord(value)) throw new InvalidSceneError('Scene must be an object.')
  let scene = value

  if (scene.version === 1) {
    scene = {
      ...scene,
      version: 2,
      edges: scene.edges === undefined ? [] : scene.edges,
      groups: scene.groups === undefined ? [] : scene.groups,
    }
  }

  if (scene.version === 2) {
    scene = {
      ...scene,
      version: 3,
      layers: [{ id: DEFAULT_LAYER_ID, name: 'Default', visible: true, locked: false }],
      nodes: Array.isArray(scene.nodes) ? scene.nodes.map((node) => isRecord(node) ? { ...node, layerId: DEFAULT_LAYER_ID } : node) : scene.nodes,
    }
  }

  if (scene.version === 3) {
    const edges = scene.edges
    const connectors = Array.isArray(edges)
      ? edges.map((edge) => isRecord(edge) ? {
        id: edge.id,
        sourceNodeId: edge.sourceId,
        sourcePortId: 'center',
        targetNodeId: edge.targetId,
        targetPortId: 'center',
        routing: 'straight',
      } : edge)
      : edges
    const { edges: _legacyEdges, ...withoutEdges } = scene
    scene = { ...withoutEdges, version: SCENE_VERSION, connectors }
  }

  if (scene.version === SCENE_VERSION) return scene
  throw new UnsupportedSceneVersionError(scene.version)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
