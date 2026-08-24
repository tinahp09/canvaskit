import type { CanvasScene } from './model.js'

export class SelectionController {
  private ids = new Set<string>()

  constructor(private readonly getScene: () => CanvasScene) {}

  select(id: string): void {
    this.assertNode(id)
    this.ids = new Set([id])
  }

  selectMultiple(ids: readonly string[]): void {
    ids.forEach((id) => this.assertNode(id))
    ids.forEach((id) => this.ids.add(id))
  }

  clear(): void { this.ids.clear() }

  get(): string[] { return [...this.ids] }

  selectAll(): void { this.ids = new Set(this.getScene().nodes.map((node) => node.id)) }

  private assertNode(id: string): void {
    if (!this.getScene().nodes.some((node) => node.id === id)) throw new Error(`Unknown node id: ${id}.`)
  }
}
