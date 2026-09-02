import type {
  CollaborationOperation,
  CollaborationTransport,
  PresenceSnapshot,
} from '@canvaskit/core'
import { decodeEnvelope, encodeEnvelope, type CollaborationEnvelope } from './protocol.js'

export type CollaborationConnectionStatus =
  | { state: 'idle' | 'connecting' | 'open' | 'closed' }
  | { state: 'reconnecting'; attempt: number; retryAt: number }
  | { state: 'error'; message: string }

export type PresenceEvent = PresenceSnapshot | { actorId: string; type: 'leave' }

export interface CollaborationAdapter extends CollaborationTransport {
  readonly status: CollaborationConnectionStatus
  connect(): void
  disconnect(options?: { reconnect?: boolean }): void
  subscribeStatus(listener: (status: CollaborationConnectionStatus) => void): () => void
  publishPresence(snapshot: PresenceSnapshot): void | Promise<void>
  subscribePresence(listener: (event: PresenceEvent) => void): () => void
}

/** Shared listener and envelope filtering behavior for browser adapters. */
export abstract class CollaborationAdapterBase implements CollaborationAdapter {
  private readonly operationListeners = new Set<(operation: CollaborationOperation) => void>()
  private readonly presenceListeners = new Set<(event: PresenceEvent) => void>()
  private readonly statusListeners = new Set<(status: CollaborationConnectionStatus) => void>()
  private currentStatus: CollaborationConnectionStatus = { state: 'idle' }

  protected constructor(
    protected readonly roomId: string,
    protected readonly senderId: string,
  ) {}

  get status(): CollaborationConnectionStatus {
    return this.currentStatus
  }

  abstract connect(): void
  abstract disconnect(options?: { reconnect?: boolean }): void
  abstract publish(operation: CollaborationOperation): void | Promise<void>
  abstract publishPresence(snapshot: PresenceSnapshot): void | Promise<void>

  subscribe(listener: (operation: CollaborationOperation) => void): () => void {
    this.operationListeners.add(listener)
    return () => this.operationListeners.delete(listener)
  }

  subscribePresence(listener: (event: PresenceEvent) => void): () => void {
    this.presenceListeners.add(listener)
    return () => this.presenceListeners.delete(listener)
  }

  subscribeStatus(listener: (status: CollaborationConnectionStatus) => void): () => void {
    this.statusListeners.add(listener)
    listener(this.currentStatus)
    return () => this.statusListeners.delete(listener)
  }

  protected createEnvelope(payload: Omit<CollaborationEnvelope, 'version' | 'roomId' | 'senderId'>): string {
    return encodeEnvelope({ version: 1, roomId: this.roomId, senderId: this.senderId, ...payload } as CollaborationEnvelope)
  }

  protected receive(raw: unknown): void {
    const envelope = decodeEnvelope(raw)
    if (!envelope || envelope.roomId !== this.roomId || envelope.senderId === this.senderId) return

    if (envelope.type === 'operation') {
      for (const listener of this.operationListeners) listener(envelope.operation)
    } else if (envelope.type === 'presence') {
      for (const listener of this.presenceListeners) listener(envelope.presence)
    } else {
      for (const listener of this.presenceListeners) listener({ actorId: envelope.senderId, type: 'leave' })
    }
  }

  protected setStatus(status: CollaborationConnectionStatus): void {
    if (JSON.stringify(this.currentStatus) === JSON.stringify(status)) return
    this.currentStatus = status
    for (const listener of this.statusListeners) listener(status)
  }
}
