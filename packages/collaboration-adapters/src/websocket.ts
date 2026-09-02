import type { CollaborationOperation, PresenceSnapshot } from '@canvaskit/core'
import { CollaborationAdapterBase } from './adapter.js'

export interface WebSocketLike {
  readyState: number
  onopen: (() => void) | null
  onclose: (() => void) | null
  onmessage: ((event: { data: unknown }) => void) | null
  send(data: string): void
  close(): void
}

export type WebSocketFactory = (url: string) => WebSocketLike
export interface ReconnectPolicy { initialDelayMs: number; maxDelayMs: number; maxAttempts: number }
export type CollaborationDiagnostic = { type: 'outbox-overflow'; operationId: string }
export interface WebSocketTransportOptions {
  url: string
  roomId: string
  senderId: string
  webSocketFactory: WebSocketFactory
  maxOutboxSize?: number
  reconnectPolicy?: Partial<ReconnectPolicy>
}

const OPEN = 1
const DEFAULT_POLICY: ReconnectPolicy = { initialDelayMs: 250, maxDelayMs: 8_000, maxAttempts: 5 }

/** Host-injected WebSocket transport with bounded FIFO retry delivery. */
export class WebSocketTransport extends CollaborationAdapterBase {
  private socket: WebSocketLike | undefined
  private readonly outbox: Array<{ data: string; operationId?: string }> = []
  private readonly diagnosticListeners = new Set<(event: CollaborationDiagnostic) => void>()
  private readonly maxOutboxSize: number
  private readonly policy: ReconnectPolicy
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined
  private reconnectAttempt = 0
  private manualDisconnect = false

  constructor(private readonly options: WebSocketTransportOptions) {
    super(options.roomId, options.senderId)
    this.maxOutboxSize = options.maxOutboxSize ?? 100
    this.policy = { ...DEFAULT_POLICY, ...options.reconnectPolicy }
  }

  connect(): void {
    if (this.socket || this.reconnectTimer) return
    this.manualDisconnect = false
    this.openSocket()
  }

  disconnect(): void {
    this.manualDisconnect = true
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.reconnectTimer = undefined
    const socket = this.socket
    this.socket = undefined
    if (socket?.readyState === OPEN) socket.send(this.createEnvelope({ type: 'leave' }))
    socket?.close()
    this.setStatus({ state: 'closed' })
  }

  publish(operation: CollaborationOperation): void {
    this.sendOrQueue(this.createEnvelope({ type: 'operation', operation }), operation.id)
  }

  publishPresence(presence: PresenceSnapshot): void {
    this.sendOrQueue(this.createEnvelope({ type: 'presence', presence }))
  }

  subscribeDiagnostics(listener: (event: CollaborationDiagnostic) => void): () => void {
    this.diagnosticListeners.add(listener)
    return () => this.diagnosticListeners.delete(listener)
  }

  private openSocket(): void {
    if (this.reconnectAttempt === 0) this.setStatus({ state: 'connecting' })
    else this.setStatus({ state: 'reconnecting', attempt: this.reconnectAttempt, retryAt: Date.now() })
    let socket: WebSocketLike
    try { socket = this.options.webSocketFactory(this.options.url) } catch {
      this.setStatus({ state: 'error', message: 'WebSocket connection failed.' }); return
    }
    this.socket = socket
    socket.onopen = () => {
      if (this.socket !== socket || this.manualDisconnect) return
      this.reconnectAttempt = 0
      this.setStatus({ state: 'open' })
      while (this.outbox.length > 0) socket.send(this.outbox.shift()!.data)
    }
    socket.onmessage = (event) => this.receive(event.data)
    socket.onclose = () => {
      if (this.socket === socket) this.socket = undefined
      if (this.manualDisconnect) return
      this.scheduleReconnect()
    }
  }

  private sendOrQueue(data: string, operationId?: string): void {
    if (this.socket?.readyState === OPEN) { this.socket.send(data); return }
    if (this.outbox.length >= this.maxOutboxSize) {
      if (operationId) for (const listener of this.diagnosticListeners) listener({ type: 'outbox-overflow', operationId })
      return
    }
    this.outbox.push({ data, operationId })
  }

  private scheduleReconnect(): void {
    if (this.manualDisconnect || this.reconnectAttempt >= this.policy.maxAttempts) { this.setStatus({ state: 'closed' }); return }
    const attempt = ++this.reconnectAttempt
    const delay = Math.min(this.policy.maxDelayMs, this.policy.initialDelayMs * 2 ** (attempt - 1)) + stableJitter(this.senderId, attempt)
    const retryAt = Date.now() + delay
    this.setStatus({ state: 'reconnecting', attempt, retryAt })
    this.reconnectTimer = setTimeout(() => { this.reconnectTimer = undefined; this.openSocket() }, delay)
  }
}

function stableJitter(senderId: string, attempt: number): number {
  let hash = attempt
  for (const character of senderId) hash = ((hash * 31) + character.charCodeAt(0)) >>> 0
  return hash % 100
}
