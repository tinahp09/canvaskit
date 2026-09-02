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

/**
 * Converges whole-scene operations with Lamport ordering while leaving message
 * transport and durable storage to the host application.
 */
export class CollaborationRuntime {
  private clock = 0
  private readonly seenOperationIds = new Set<string>()
  private readonly latestByTarget = new Map<string, CollaborationOperation>()
  private readonly presenceByActor = new Map<string, PresenceSnapshot>()

  constructor(private readonly actorId: string) {
    if (!isNonEmptyString(actorId)) throw new Error('Collaboration actor ID must be a non-empty string.')
  }

  getClock(): number {
    return this.clock
  }

  recordLocal(scene: CanvasScene, target = 'scene'): CollaborationOperation {
    if (!isNonEmptyString(target)) throw new Error('Collaboration target must be a non-empty string.')
    this.clock += 1
    const operation = validateCollaborationOperation({
      id: `${this.actorId}:${this.clock}`,
      actorId: this.actorId,
      clock: this.clock,
      target,
      kind: 'scene',
      scene,
    })
    this.seenOperationIds.add(operation.id)
    this.latestByTarget.set(target, operation)
    return operation
  }

  applyRemote(operation: unknown, scene: CanvasScene): CollaborationApplyResult {
    const next = validateCollaborationOperation(operation)
    this.clock = Math.max(this.clock, next.clock)

    if (this.seenOperationIds.has(next.id)) return { scene, applied: false, reason: 'duplicate' }
    this.seenOperationIds.add(next.id)

    const latest = this.latestByTarget.get(next.target)
    if (latest && compareOperationOrder(next, latest) <= 0) return { scene, applied: false, reason: 'stale' }

    this.latestByTarget.set(next.target, next)
    return { scene: next.scene, applied: true }
  }

  setPresence(snapshot: PresenceSnapshot): void {
    this.presenceByActor.set(snapshot.actorId, validatePresence(snapshot))
  }

  removePresence(actorId: string): boolean {
    return this.presenceByActor.delete(actorId)
  }

  getPresence(): PresenceSnapshot[] {
    return [...this.presenceByActor.values()]
      .sort((left, right) => left.actorId.localeCompare(right.actorId))
      .map(clonePresence)
  }
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

function compareOperationOrder(left: CollaborationOperation, right: CollaborationOperation): number {
  return left.clock - right.clock || left.actorId.localeCompare(right.actorId) || left.id.localeCompare(right.id)
}

function validatePresence(value: PresenceSnapshot): PresenceSnapshot {
  if (!isNonEmptyString(value?.actorId)
    || !Number.isFinite(value?.updatedAt)
    || !Array.isArray(value?.selection)
    || !value.selection.every(isNonEmptyString)
    || (value.cursor !== undefined && (!Number.isFinite(value.cursor.x) || !Number.isFinite(value.cursor.y)))
    || (value.metadata !== undefined && !isRecord(value.metadata))) {
    throw new Error('Invalid collaboration presence.')
  }

  return clonePresence(value)
}

function clonePresence(value: PresenceSnapshot): PresenceSnapshot {
  return {
    actorId: value.actorId,
    updatedAt: value.updatedAt,
    selection: [...value.selection],
    ...(value.cursor === undefined ? {} : { cursor: { ...value.cursor } }),
    ...(value.metadata === undefined ? {} : { metadata: { ...value.metadata } }),
  }
}
