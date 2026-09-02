import type { CollaborationOperation, PresenceSnapshot } from '@canvaskit/core'
import { CollaborationAdapterBase } from './adapter.js'

export interface BroadcastChannelLike {
  onmessage: ((event: { data: unknown }) => void) | null
  postMessage(message: unknown): void
  close(): void
}

export type BroadcastChannelFactory = (name: string) => BroadcastChannelLike

export interface BroadcastChannelTransportOptions {
  roomId: string
  senderId: string
  channelName?: string
  /** Omit for the browser API; pass null to deliberately disable the transport. */
  channelFactory?: BroadcastChannelFactory | null
}

/** Same-origin collaboration transport backed by the browser BroadcastChannel API. */
export class BroadcastChannelTransport extends CollaborationAdapterBase {
  private channel: BroadcastChannelLike | undefined
  private readonly channelName: string
  private readonly channelFactory: BroadcastChannelFactory | undefined

  constructor(options: BroadcastChannelTransportOptions) {
    super(options.roomId, options.senderId)
    this.channelName = options.channelName ?? `canvaskit:${options.roomId}`
    this.channelFactory = options.channelFactory === undefined
      ? getBrowserChannelFactory()
      : options.channelFactory ?? undefined
  }

  connect(): void {
    if (this.channel) return
    if (!this.channelFactory) {
      this.setStatus({ state: 'error', message: 'BroadcastChannel is unavailable.' })
      return
    }

    try {
      const channel = this.channelFactory(this.channelName)
      channel.onmessage = (event) => this.receive(event.data)
      this.channel = channel
      this.setStatus({ state: 'open' })
    } catch {
      this.setStatus({ state: 'error', message: 'BroadcastChannel is unavailable.' })
    }
  }

  disconnect(): void {
    if (!this.channel) return
    this.post({ type: 'leave' })
    this.channel.onmessage = null
    this.channel.close()
    this.channel = undefined
    this.setStatus({ state: 'closed' })
  }

  publish(operation: CollaborationOperation): void {
    this.post({ type: 'operation', operation })
  }

  publishPresence(presence: PresenceSnapshot): void {
    this.post({ type: 'presence', presence })
  }

  private post(payload: { type: 'leave' } | { type: 'operation'; operation: CollaborationOperation } | { type: 'presence'; presence: PresenceSnapshot }): void {
    if (!this.channel) return
    this.channel.postMessage(this.createEnvelope(payload))
  }
}

function getBrowserChannelFactory(): BroadcastChannelFactory | undefined {
  if (typeof globalThis.BroadcastChannel !== 'function') return undefined
  return (name) => new globalThis.BroadcastChannel(name) as unknown as BroadcastChannelLike
}
