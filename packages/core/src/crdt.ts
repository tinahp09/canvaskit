import type { CanvasNode, CanvasScene } from './model.js'
import { importScene } from './serialization.js'

export type CrdtOperation = {
  readonly id: string
  readonly actorId: string
  readonly clock: number
  readonly target: string
  readonly kind: 'node-upsert' | 'node-remove'
  readonly nodeId: string
  readonly node?: CanvasNode
}
export interface CrdtApplyResult { readonly scene: CanvasScene; readonly applied: boolean; readonly reason?: 'duplicate' | 'stale' }

/** Entity-register CRDT for independent Scene V7 node mutations. */
export class CrdtRuntime {
  private clock = 0
  private readonly seen = new Set<string>()
  private readonly latest = new Map<string, CrdtOperation>()
  constructor(private readonly actorId: string) { if (!actorId) throw new Error('CRDT actor ID must be non-empty.') }
  recordLocal(before: CanvasScene, after: CanvasScene, target = 'scene'): CrdtOperation {
    const operation = diffNode(before, after)
    if (!operation) throw new Error('CRDT local change must modify exactly one node.')
    this.clock += 1
    const next = validateCrdtOperation({ ...operation, id: `${this.actorId}:${this.clock}`, actorId: this.actorId, clock: this.clock, target })
    this.seen.add(next.id); this.latest.set(next.nodeId, next)
    return next
  }
  applyRemote(value: unknown, scene: CanvasScene): CrdtApplyResult {
    const next = validateCrdtOperation(value)
    this.clock = Math.max(this.clock, next.clock)
    if (this.seen.has(next.id)) return { scene, applied: false, reason: 'duplicate' }
    this.seen.add(next.id)
    const current = this.latest.get(next.nodeId)
    if (current && compare(next, current) <= 0) return { scene, applied: false, reason: 'stale' }
    this.latest.set(next.nodeId, next)
    const nodes = scene.nodes.filter((node) => node.id !== next.nodeId)
    if (next.kind === 'node-upsert') nodes.push(next.node!)
    nodes.sort((left, right) => left.id.localeCompare(right.id))
    return { scene: importScene(JSON.stringify({ ...scene, nodes })), applied: true }
  }
}

export function validateCrdtOperation(value: unknown): CrdtOperation {
  if (!record(value) || !text(value.id) || !text(value.actorId) || !number(value.clock) || !text(value.target) || !text(value.nodeId) || (value.kind !== 'node-upsert' && value.kind !== 'node-remove')) throw new Error('Invalid CRDT operation.')
  if (value.kind === 'node-upsert') {
    if (!record(value.node)) throw new Error('Invalid CRDT operation.')
    const scene = importScene(JSON.stringify({ version: 7, nodes: [value.node], connectors: [], groups: [], layers: [{ id: 'layer-default', name: 'Default', visible: true, locked: false }], guides: [], assets: [], viewport: { x: 0, y: 0, zoom: 1 }, metadata: {} }))
    return { id: value.id, actorId: value.actorId, clock: value.clock, target: value.target, kind: value.kind, nodeId: value.nodeId, node: scene.nodes[0]! }
  }
  return { id: value.id, actorId: value.actorId, clock: value.clock, target: value.target, kind: value.kind, nodeId: value.nodeId }
}
function diffNode(before: CanvasScene, after: CanvasScene): Omit<CrdtOperation, 'id' | 'actorId' | 'clock' | 'target'> | undefined {
  const ids = new Set([...before.nodes.map((node) => node.id), ...after.nodes.map((node) => node.id)])
  const changed = [...ids].filter((id) => JSON.stringify(before.nodes.find((node) => node.id === id)) !== JSON.stringify(after.nodes.find((node) => node.id === id)))
  if (changed.length !== 1) return undefined
  const node = after.nodes.find((item) => item.id === changed[0])
  return node ? { kind: 'node-upsert', nodeId: node.id, node } : { kind: 'node-remove', nodeId: changed[0]! }
}
function compare(left: CrdtOperation, right: CrdtOperation): number { return left.clock - right.clock || left.actorId.localeCompare(right.actorId) || left.id.localeCompare(right.id) }
function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value) }
function text(value: unknown): value is string { return typeof value === 'string' && value.length > 0 }
function number(value: unknown): value is number { return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 }
