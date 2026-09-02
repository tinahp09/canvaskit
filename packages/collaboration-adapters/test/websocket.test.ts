import { expect, it } from 'vitest'
import { createScene, type CollaborationOperation } from '@canvaskit/core'
import { decodeEnvelope, WebSocketTransport, type WebSocketLike } from '../src/index.js'

class FakeWebSocket implements WebSocketLike {
  readyState = 0
  onopen: (() => void) | null = null
  onclose: (() => void) | null = null
  onmessage: ((event: { data: unknown }) => void) | null = null
  readonly sent: string[] = []
  send(data: string): void { this.sent.push(data) }
  close(): void { this.readyState = 3; this.onclose?.() }
  open(): void { this.readyState = 1; this.onopen?.() }
}

const operation = (id: string): CollaborationOperation => ({
  id, actorId: 'ada', clock: Number(id.at(-1)), target: 'scene', kind: 'scene', scene: createScene(),
})

it('replays queued operations in FIFO order once the socket opens', () => {
  const socket = new FakeWebSocket()
  const adapter = new WebSocketTransport({ url: 'wss://example.test', roomId: 'board', senderId: 'ada', webSocketFactory: () => socket })
  adapter.connect()
  adapter.publish(operation('ada:1'))
  adapter.publish(operation('ada:2'))
  socket.open()
  expect(socket.sent.map(decodeEnvelope)).toMatchObject([
    { type: 'operation', operation: { id: 'ada:1' } },
    { type: 'operation', operation: { id: 'ada:2' } },
  ])
})

it('caps the outbox and emits a diagnostic instead of silently dropping data', () => {
  const socket = new FakeWebSocket()
  const adapter = new WebSocketTransport({
    url: 'wss://example.test', roomId: 'board', senderId: 'ada', maxOutboxSize: 1, webSocketFactory: () => socket,
  })
  const diagnostics: unknown[] = []
  adapter.subscribeDiagnostics((event) => diagnostics.push(event))
  adapter.connect()
  adapter.publish(operation('ada:1'))
  adapter.publish(operation('ada:2'))
  expect(diagnostics).toEqual([{ type: 'outbox-overflow', operationId: 'ada:2' }])
})

it('does not reconnect after a manual disconnect and sends leave only when open', () => {
  const socket = new FakeWebSocket()
  const adapter = new WebSocketTransport({ url: 'wss://example.test', roomId: 'board', senderId: 'ada', webSocketFactory: () => socket })
  adapter.connect()
  adapter.disconnect()
  expect(socket.sent).toEqual([])
  socket.open()
  expect(socket.sent).toEqual([])
})
