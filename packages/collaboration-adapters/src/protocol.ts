import {
  validateCollaborationOperation,
  type CollaborationOperation,
  type PresenceSnapshot,
} from '@canvaskit/core'

export const COLLABORATION_PROTOCOL_VERSION = 1 as const

interface EnvelopeBase {
  version: typeof COLLABORATION_PROTOCOL_VERSION
  roomId: string
  senderId: string
}

export type CollaborationEnvelope =
  | (EnvelopeBase & { type: 'operation'; operation: CollaborationOperation })
  | (EnvelopeBase & { type: 'presence'; presence: PresenceSnapshot })
  | (EnvelopeBase & { type: 'leave' })

/** Serializes a validated collaboration-adapter message for transport. */
export function encodeEnvelope(envelope: CollaborationEnvelope): string {
  return JSON.stringify(envelope)
}

/**
 * Parses and canonicalizes an untrusted adapter message. Invalid input is
 * deliberately ignored so a bad peer cannot interrupt an editor session.
 */
export function decodeEnvelope(raw: unknown): CollaborationEnvelope | undefined {
  const value = parseJson(raw)
  if (!isRecord(value)
    || value.version !== COLLABORATION_PROTOCOL_VERSION
    || !isNonEmptyString(value.roomId)
    || !isNonEmptyString(value.senderId)) {
    return undefined
  }

  if (value.type === 'leave') {
    return { version: COLLABORATION_PROTOCOL_VERSION, roomId: value.roomId, senderId: value.senderId, type: 'leave' }
  }

  if (value.type === 'operation') {
    try {
      return {
        version: COLLABORATION_PROTOCOL_VERSION,
        roomId: value.roomId,
        senderId: value.senderId,
        type: 'operation',
        operation: validateCollaborationOperation(value.operation),
      }
    } catch {
      return undefined
    }
  }

  if (value.type === 'presence') {
    const presence = validatePresence(value.presence)
    return presence === undefined
      ? undefined
      : { version: COLLABORATION_PROTOCOL_VERSION, roomId: value.roomId, senderId: value.senderId, type: 'presence', presence }
  }

  return undefined
}

function parseJson(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw
  try {
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

function validatePresence(value: unknown): PresenceSnapshot | undefined {
  if (!isRecord(value)
    || !isNonEmptyString(value.actorId)
    || !Number.isFinite(value.updatedAt)
    || !Array.isArray(value.selection)
    || !value.selection.every(isNonEmptyString)
    || (value.cursor !== undefined && (!isRecord(value.cursor) || !Number.isFinite(value.cursor.x) || !Number.isFinite(value.cursor.y)))
    || (value.metadata !== undefined && !isRecord(value.metadata))) {
    return undefined
  }

  return {
    actorId: value.actorId,
    updatedAt: value.updatedAt as number,
    selection: [...value.selection],
    ...(value.cursor === undefined ? {} : { cursor: { x: value.cursor.x as number, y: value.cursor.y as number } }),
    ...(value.metadata === undefined ? {} : { metadata: { ...value.metadata } }),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}
