import type { CanvasScene, RectangleNode } from './model.js'

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
  if (!isTransform(value.viewport)) throw new Error('Scene viewport is invalid.')
  if (!isRecord(value.metadata)) throw new Error('Scene metadata must be an object.')

  return {
    version: 1,
    nodes: value.nodes.map(parseRectangle),
    viewport: value.viewport,
    metadata: value.metadata,
  }
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
