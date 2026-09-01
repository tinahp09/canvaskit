import type { CanvasNode, CanvasScene, CreateConnectorInput } from './model.js'
import { ConnectorController } from './connector.js'
import { findNodePort } from './ports.js'

export interface DiagramEndpointPolicy { nodeTypes?: readonly CanvasNode['type'][]; ports?: readonly string[] }
export interface DiagramConnectionPolicy { id: string; source: DiagramEndpointPolicy; target: DiagramEndpointPolicy }
export interface DiagramConnection { sourceNodeId: string; sourcePortId: string; targetNodeId: string; targetPortId: string }

/** Data-only policies for validating diagram connection intent before mutation. */
export class DiagramRuntime {
  constructor(private readonly policies: readonly DiagramConnectionPolicy[]) {}

  canConnect(scene: CanvasScene, connection: DiagramConnection): boolean {
    const source = scene.nodes.find((node) => node.id === connection.sourceNodeId)
    const target = scene.nodes.find((node) => node.id === connection.targetNodeId)
    if (!source || !target || !findNodePort(source, connection.sourcePortId) || !findNodePort(target, connection.targetPortId)) return false
    return this.policies.some((policy) => matchesEndpoint(source, connection.sourcePortId, policy.source) && matchesEndpoint(target, connection.targetPortId, policy.target))
  }

  create(scene: CanvasScene, input: CreateConnectorInput): CanvasScene {
    if (!this.canConnect(scene, input)) throw new Error('Diagram connection violates every registered policy.')
    return new ConnectorController().create(scene, input)
  }
}

function matchesEndpoint(node: CanvasNode, portId: string, policy: DiagramEndpointPolicy): boolean {
  return (policy.nodeTypes === undefined || policy.nodeTypes.includes(node.type)) && (policy.ports === undefined || policy.ports.includes(portId))
}
