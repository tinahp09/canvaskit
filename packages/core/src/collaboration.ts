import type { Point } from '@canvaskit/geometry'
import type { CanvasScene } from './model.js'
import { importScene } from './serialization.js'

export interface CollaborationOperation {
  id: string
  actorId: string
  clock: number
  target: string
  kind: 'scene'
  scene: CanvasScene
}

export interface CollaborationApplyResult {
  scene: CanvasScene
  applied: boolean
  reason?: 'duplicate' | 'stale'
}

export interface PresenceSnapshot {
  actorId: string
  updatedAt: number
  selection: string[]
  cursor?: Point
  metadata?: Record<string, unknown>
}

export interface CollaborationTransport {
  publish(operation: CollaborationOperation): void | Promise<void>
  subscribe(listener: (operation: CollaborationOperation) => void): () => void
}

/** Validates and canonicalizes a collaboration operation at the Core boundary. */
export function validateCollaborationOperation(value: unknown): CollaborationOperation {
  if (!isRecord(value)
    || !isNonEmptyString(value.id)
    || !isNonEmptyString(value.actorId)
    || !Number.isSafeInteger(value.clock)
    || value.clock < 0
    || !isNonEmptyString(value.target)
    || value.kind !== 'scene') {
    throw new Error('Invalid collaboration operation.')
  }

  return {
    id: value.id,
    actorId: value.actorId,
    clock: value.clock,
    target: value.target,
    kind: 'scene',
    scene: importScene(JSON.stringify(value.scene)),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}
