import type { CanvasScene } from './model.js'
import { isNodeInteractive } from './document.js'

export type SelectionMode = 'replace' | 'add' | 'remove' | 'toggle'

export class SelectionController {
  private ids = new Set<string>()

  constructor(
    private readonly getScene: () => CanvasScene,
    private readonly onChange: () => void = () => undefined,
    private readonly interactionPredicate?: (id: string) => boolean,
  ) {}

  select(id: string): void {
    this.set([id])
  }

  selectMultiple(ids: readonly string[]): void {
    this.add(ids)
  }

  set(ids: readonly string[]): void {
    this.assertNodes(ids)
    this.update(this.interactiveIds(ids))
  }

  add(ids: readonly string[]): void {
    this.assertNodes(ids)
    this.update(new Set([...this.ids, ...this.interactiveIds(ids)]))
  }

  remove(ids: readonly string[]): void {
    this.assertNodes(ids)
    const removed = this.interactiveIds(ids)
    this.update(new Set([...this.ids].filter((id) => !removed.has(id))))
  }

  toggle(ids: readonly string[]): void {
    this.assertNodes(ids)
    const next = new Set(this.ids)
    for (const id of this.interactiveIds(ids)) {
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

  get(): string[] {
    return this.getScene().nodes
      .filter((node) => this.ids.has(node.id) && this.canSelect(node.id))
      .map((node) => node.id)
  }

  selectAll(): void {
    this.set(this.getScene().nodes.map((node) => node.id))
  }

  retainExisting(): void {
    this.ids = this.interactiveIds(this.ids)
  }

  private update(ids: Set<string>): void {
    const interactiveIds = this.interactiveIds(ids)
    if (interactiveIds.size === this.ids.size && [...interactiveIds].every((id) => this.ids.has(id))) return
    this.ids = interactiveIds
    this.onChange()
  }

  private assertNodes(ids: readonly string[]): void {
    ids.forEach((id) => this.assertNode(id))
  }

  private interactiveIds(ids: Iterable<string>): Set<string> {
    return new Set([...ids].filter((id) => this.canSelect(id)))
  }

  private canSelect(id: string): boolean {
    return this.interactionPredicate?.(id) ?? isNodeInteractive(this.getScene(), id)
  }

  private assertNode(id: string): void {
    if (!this.getScene().nodes.some((node) => node.id === id)) throw new Error(`Unknown node id: ${id}.`)
  }
}
