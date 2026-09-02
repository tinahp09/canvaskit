import { expect, it } from 'vitest'
import { addRectangle, createScene } from '@canvaskit/core'
import { decodeEnvelope, encodeEnvelope } from '../src/index.js'

const operation = {
  id: 'ada:1',
  actorId: 'ada',
  clock: 1,
  target: 'scene',
  kind: 'scene' as const,
  scene: addRectangle(createScene(), {
    id: 'rectangle',
    position: { x: 10, y: 20 },
    size: { width: 120, height: 60 },
    fill: '#6d5dfc',
  }),
}

it('round-trips a serializable operation envelope', () => {
  const envelope = {
    version: 1 as const,
    roomId: 'board-1',
    senderId: 'ada',
    type: 'operation' as const,
    operation,
  }

  expect(decodeEnvelope(encodeEnvelope(envelope))).toEqual(envelope)
})

it('round-trips presence and leave envelopes', () => {
  expect(decodeEnvelope(JSON.stringify({
    version: 1,
    roomId: 'board-1',
    senderId: 'bea',
    type: 'presence',
    presence: { actorId: 'bea', updatedAt: 10, selection: ['rectangle'], cursor: { x: 4, y: 8 } },
  }))).toMatchObject({ type: 'presence', presence: { actorId: 'bea', selection: ['rectangle'] } })
  expect(decodeEnvelope(JSON.stringify({ version: 1, roomId: 'board-1', senderId: 'bea', type: 'leave' }))).toEqual({
    version: 1, roomId: 'board-1', senderId: 'bea', type: 'leave',
  })
})

it.each([
  '{',
  JSON.stringify({ version: 2, roomId: 'board-1', senderId: 'ada', type: 'leave' }),
  JSON.stringify({ version: 1, roomId: '', senderId: 'ada', type: 'leave' }),
  JSON.stringify({ version: 1, roomId: 'board-1', senderId: 'ada', type: 'operation', operation: { ...operation, clock: -1 } }),
])('rejects malformed adapter envelope %#', (raw) => {
  expect(decodeEnvelope(raw)).toBeUndefined()
})
