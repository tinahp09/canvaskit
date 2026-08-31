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
    const connectors = migrateLegacyEdges(scene.edges)
    const { edges: _legacyEdges, ...withoutEdges } = scene
    scene = { ...withoutEdges, version: 4, connectors }
  }

  if (scene.version === 4) {
    scene = { ...scene, version: SCENE_VERSION, guides: [] }
  }

  if (scene.version === SCENE_VERSION) return scene
  throw new UnsupportedSceneVersionError(scene.version)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function migrateLegacyEdges(edges: unknown): unknown {
  if (!Array.isArray(edges)) return edges
  return edges.map((edge) => {
    if (!isRecord(edge)
      || typeof edge.id !== 'string'
      || !['line', 'arrow', 'bezier'].includes(String(edge.type))
      || typeof edge.sourceId !== 'string'
      || typeof edge.targetId !== 'string') {
      throw new InvalidSceneError('Scene contains an invalid edge.')
    }
    return {
      id: edge.id,
      sourceNodeId: edge.sourceId,
      sourcePortId: 'center',
      targetNodeId: edge.targetId,
      targetPortId: 'center',
      routing: 'straight',
    }
  })
}
