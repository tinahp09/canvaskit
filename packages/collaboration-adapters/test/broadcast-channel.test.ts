import { expect, it } from 'vitest'
import { addRectangle, createScene, type CollaborationOperation } from '@canvaskit/core'
import {
  BroadcastChannelTransport,
  decodeEnvelope,
  type BroadcastChannelLike,
} from '../src/index.js'

class FakeBroadcastChannel implements BroadcastChannelLike {
  onmessage: ((event: { data: unknown }) => void) | null = null
  readonly posted: unknown[] = []
  closed = false

  postMessage(message: unknown): void {
    this.posted.push(message)
  }

  close(): void {
    this.closed = true
  }

  receive(message: unknown): void {
    this.onmessage?.({ data: message })
  }
}

const operation: CollaborationOperation = {
  id: 'bea:1',
  actorId: 'bea',
  clock: 1,
  target: 'scene',
  kind: 'scene',
  scene: addRectangle(createScene(), {
    id: 'rectangle', position: { x: 1, y: 2 }, size: { width: 40, height: 20 }, fill: '#0ea5e9',
  }),
}

function operationEnvelope(senderId: string, roomId: string) {
  return JSON.stringify({ version: 1, roomId, senderId, type: 'operation', operation })
}

it('relays a room-matched remote operation but ignores self and other-room messages', () => {
  const channel = new FakeBroadcastChannel()
  const adapter = new BroadcastChannelTransport({
    roomId: 'board', senderId: 'ada', channelFactory: () => channel,
  })
  const received: CollaborationOperation[] = []
  adapter.subscribe((next) => received.push(next))
  adapter.connect()

  channel.receive(operationEnvelope('bea', 'board'))
  channel.receive(operationEnvelope('ada', 'board'))
  channel.receive(operationEnvelope('bea', 'other-room'))

  expect(received).toEqual([operation])
})

it('emits idle, open, and closed exactly once across idempotent lifecycle calls', () => {
  const channel = new FakeBroadcastChannel()
  const adapter = new BroadcastChannelTransport({
    roomId: 'board', senderId: 'ada', channelFactory: () => channel,
  })
  const states: string[] = []
  adapter.subscribeStatus((status) => states.push(status.state))

  adapter.connect()
  adapter.connect()
  adapter.disconnect()
  adapter.disconnect()

  expect(states).toEqual(['idle', 'open', 'closed'])
  expect(channel.closed).toBe(true)
  expect(decodeEnvelope(channel.posted[0])).toMatchObject({ type: 'leave', senderId: 'ada' })
})

it('relays presence and leave notifications while ignoring malformed messages', () => {
  const channel = new FakeBroadcastChannel()
  const adapter = new BroadcastChannelTransport({
    roomId: 'board', senderId: 'ada', channelFactory: () => channel,
  })
  const presence: unknown[] = []
  adapter.subscribePresence((next) => presence.push(next))
  adapter.connect()

  channel.receive(JSON.stringify({
    version: 1, roomId: 'board', senderId: 'bea', type: 'presence',
    presence: { actorId: 'bea', updatedAt: 1, selection: ['rectangle'] },
  }))
  channel.receive(JSON.stringify({ version: 1, roomId: 'board', senderId: 'bea', type: 'leave' }))
  channel.receive('{')

  expect(presence).toEqual([
    { actorId: 'bea', updatedAt: 1, selection: ['rectangle'] },
    { actorId: 'bea', type: 'leave' },
  ])
})

it('reports an unavailable browser channel without throwing', () => {
  const adapter = new BroadcastChannelTransport({ roomId: 'board', senderId: 'ada', channelFactory: null })
  adapter.connect()
  expect(adapter.status).toEqual({ state: 'error', message: 'BroadcastChannel is unavailable.' })
})
