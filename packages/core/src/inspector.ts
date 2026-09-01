import type { CanvasNode, CanvasScene } from './model.js'

export interface InspectorProperty<T = unknown> {
  id: string
  label: string
  nodeTypes?: readonly CanvasNode['type'][]
  read(node: CanvasNode): T
  write(node: CanvasNode, value: T): CanvasNode
}

export type InspectorValue<T> = { kind: 'value'; value: T } | { kind: 'mixed' }

/** Typed, renderer-neutral property schemas for single and multi-selection inspectors. */
export class InspectorRuntime {
  private readonly properties = new Map<string, InspectorProperty>()

  constructor(properties: readonly InspectorProperty[] = []) {
    properties.forEach((property) => this.register(property))
  }

  register<T>(property: InspectorProperty<T>): () => void {
    if (this.properties.has(property.id)) throw new Error(`Inspector property "${property.id}" is already registered.`)
    this.properties.set(property.id, property as InspectorProperty)
    let active = true
    return () => { if (active && this.properties.get(property.id) === property) this.properties.delete(property.id); active = false }
  }

  read<T>(scene: CanvasScene, ids: readonly string[], propertyId: string): InspectorValue<T> | undefined {
    const property = this.requireProperty(propertyId) as InspectorProperty<T>
    const targets = this.targets(scene, ids, property)
    if (targets.length === 0) return undefined
    const values = targets.map((node) => property.read(node))
    return values.every((value) => Object.is(value, values[0])) ? { kind: 'value', value: values[0]! } : { kind: 'mixed' }
  }

  apply<T>(scene: CanvasScene, ids: readonly string[], propertyId: string, value: T): CanvasScene {
    const property = this.requireProperty(propertyId) as InspectorProperty<T>
    const targets = this.targets(scene, ids, property)
    const targetIds = new Set(targets.map((node) => node.id))
    return targetIds.size === 0 ? scene : { ...scene, nodes: scene.nodes.map((node) => targetIds.has(node.id) ? property.write(node, value) : node) }
  }

  private requireProperty(id: string): InspectorProperty {
    const property = this.properties.get(id)
    if (!property) throw new Error(`Unknown inspector property: ${id}.`)
    return property
  }

  private targets(scene: CanvasScene, ids: readonly string[], property: InspectorProperty): CanvasNode[] {
    const requested = new Set(ids)
    for (const id of requested) if (!scene.nodes.some((node) => node.id === id)) throw new Error(`Unknown inspector target: ${id}.`)
    return scene.nodes.filter((node) => requested.has(node.id) && (property.nodeTypes === undefined || property.nodeTypes.includes(node.type)))
  }
}
