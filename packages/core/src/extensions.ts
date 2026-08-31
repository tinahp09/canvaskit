import type { CanvasKit } from './canvas-kit.js'

export interface CanvasCommandDefinition { id: string; label: string; run(canvas: CanvasKit): void }
export interface CanvasToolDefinition { id: string; label: string; shortcut?: string; activate?(canvas: CanvasKit): void; deactivate?(canvas: CanvasKit): void }
export interface CanvasNodeDefinition { id: string; label: string }
export interface InspectorSection { id: string; label: string; nodeTypes?: readonly string[] }
export interface ExtensionSnapshot {
  commands: ReadonlyArray<Pick<CanvasCommandDefinition, 'id' | 'label'>>
  tools: ReadonlyArray<Pick<CanvasToolDefinition, 'id' | 'label' | 'shortcut'>>
  nodes: ReadonlyArray<CanvasNodeDefinition>
  inspectors: ReadonlyArray<InspectorSection>
}

export class ExtensionRegistry {
  private readonly commands = new Map<string, CanvasCommandDefinition>()
  private readonly tools = new Map<string, CanvasToolDefinition>()
  private readonly nodes = new Map<string, CanvasNodeDefinition>()
  private readonly inspectors = new Map<string, InspectorSection>()

  registerCommand(definition: CanvasCommandDefinition): () => void { return this.register(this.commands, definition, 'Command') }
  registerTool(definition: CanvasToolDefinition): () => void { return this.register(this.tools, definition, 'Tool') }
  registerNode(definition: CanvasNodeDefinition): () => void { return this.register(this.nodes, definition, 'Node') }
  registerInspector(definition: InspectorSection): () => void { return this.register(this.inspectors, definition, 'Inspector') }
  getCommand(id: string): CanvasCommandDefinition | undefined { return this.commands.get(id) }
  getTool(id: string): CanvasToolDefinition | undefined { return this.tools.get(id) }
  snapshot(): ExtensionSnapshot {
    return Object.freeze({
      commands: Object.freeze([...this.commands.values()].map(({ id, label }) => ({ id, label }))),
      tools: Object.freeze([...this.tools.values()].map(({ id, label, shortcut }) => ({ id, label, ...(shortcut === undefined ? {} : { shortcut }) }))),
      nodes: Object.freeze([...this.nodes.values()].map((node) => ({ ...node }))),
      inspectors: Object.freeze([...this.inspectors.values()].map((section) => ({ ...section, ...(section.nodeTypes ? { nodeTypes: [...section.nodeTypes] } : {}) }))),
    })
  }
  private register<T extends { id: string }>(target: Map<string, T>, definition: T, kind: string): () => void {
    if (target.has(definition.id)) throw new Error(`${kind} definition "${definition.id}" is already registered.`)
    const registered = { ...definition }
    target.set(definition.id, registered)
    let active = true
    return () => { if (active && target.get(definition.id) === registered) target.delete(definition.id); active = false }
  }
}
