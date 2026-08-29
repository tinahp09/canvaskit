import type { CanvasScene } from './model.js'

export type SelectionMode = 'replace' | 'add' | 'remove' | 'toggle'

export class SelectionController {
  private ids = new Set<string>()

  constructor(
    private readonly getScene: () => CanvasScene,
    private readonly onChange: () => void = () => undefined,
  ) {}

  select(id: string): void {
    this.set([id])
  }

  selectMultiple(ids: readonly string[]): void {
    this.add(ids)
  }

  set(ids: readonly string[]): void {
    this.assertNodes(ids)
    this.update(new Set(ids))
  }

  add(ids: readonly string[]): void {
    this.assertNodes(ids)
    this.update(new Set([...this.ids, ...ids]))
  }

  remove(ids: readonly string[]): void {
    this.assertNodes(ids)
    const removed = new Set(ids)
    this.update(new Set([...this.ids].filter((id) => !removed.has(id))))
  }

  toggle(ids: readonly string[]): void {
    this.assertNodes(ids)
    const next = new Set(this.ids)
    for (const id of new Set(ids)) {
      if (next.has(id)) next.delete(id)
      else next.add(id)
    }
    this.update(next)
  }

  clear(): void {
    if (this.ids.size === 0) return
    this.ids = new Set()
    this.onChange()
  }

  get(): string[] { return this.getScene().nodes.filter((node) => this.ids.has(node.id)).map((node) => node.id) }

  selectAll(): void {
    this.set(this.getScene().nodes.map((node) => node.id))
  }

  retainExisting(): void {
    const nodeIds = new Set(this.getScene().nodes.map((node) => node.id))
    this.ids = new Set([...this.ids].filter((id) => nodeIds.has(id)))
  }

  private update(ids: Set<string>): void {
    if (ids.size === this.ids.size && [...ids].every((id) => this.ids.has(id))) return
    this.ids = ids
    this.onChange()
  }

  private assertNodes(ids: readonly string[]): void {
    ids.forEach((id) => this.assertNode(id))
  }

  private assertNode(id: string): void {
    if (!this.getScene().nodes.some((node) => node.id === id)) throw new Error(`Unknown node id: ${id}.`)
  }
}
