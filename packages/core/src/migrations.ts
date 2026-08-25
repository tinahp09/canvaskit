import { SCENE_VERSION } from './model.js'

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

  if (value.version === 1) {
    return {
      ...value,
      version: SCENE_VERSION,
      edges: value.edges === undefined ? [] : value.edges,
      groups: value.groups === undefined ? [] : value.groups,
    }
  }

  if (value.version === SCENE_VERSION) return value
  throw new UnsupportedSceneVersionError(value.version)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
