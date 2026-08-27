import type { CanvasScene } from './model.js'

export class SelectionController {
  private ids = new Set<string>()

  constructor(
    private readonly getScene: () => CanvasScene,
    private readonly onChange: () => void = () => undefined,
  ) {}

  select(id: string): void {
    this.assertNode(id)
    this.ids = new Set([id])
    this.onChange()
  }

  selectMultiple(ids: readonly string[]): void {
    ids.forEach((id) => this.assertNode(id))
    const size = this.ids.size
    ids.forEach((id) => this.ids.add(id))
    if (this.ids.size !== size) this.onChange()
  }

  clear(): void {
    if (this.ids.size === 0) return
    this.ids.clear()
    this.onChange()
  }

  get(): string[] { return [...this.ids] }

  selectAll(): void {
    const ids = new Set(this.getScene().nodes.map((node) => node.id))
    if (ids.size === this.ids.size && [...ids].every((id) => this.ids.has(id))) return
    this.ids = ids
    this.onChange()
  }

  retainExisting(): void {
    const nodeIds = new Set(this.getScene().nodes.map((node) => node.id))
    this.ids = new Set([...this.ids].filter((id) => nodeIds.has(id)))
  }

  private assertNode(id: string): void {
    if (!this.getScene().nodes.some((node) => node.id === id)) throw new Error(`Unknown node id: ${id}.`)
  }
}
