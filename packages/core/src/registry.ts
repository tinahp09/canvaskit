export interface NamedDefinition {
  id: string
}

class DefinitionRegistry<T extends NamedDefinition> {
  private readonly definitions = new Map<string, T>()

  constructor(private readonly kind: string) {}

  register(definition: T): void {
    if (this.definitions.has(definition.id)) {
      throw new Error(`${this.kind} definition "${definition.id}" is already registered.`)
    }
    this.definitions.set(definition.id, definition)
  }

  get(id: string): T | undefined {
    return this.definitions.get(id)
  }
}

export class NodeRegistry<T extends NamedDefinition = NamedDefinition> extends DefinitionRegistry<T> {
  constructor() { super('Node') }
}

export class EdgeRegistry<T extends NamedDefinition = NamedDefinition> extends DefinitionRegistry<T> {
  constructor() { super('Edge') }
}
