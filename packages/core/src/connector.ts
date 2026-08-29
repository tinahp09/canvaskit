import type { Point } from '@canvaskit/geometry'
import type { CanvasConnector, CanvasScene, CreateConnectorInput } from './model.js'
import { findNodePort } from './ports.js'

export interface ConnectorEndpoint {
  nodeId: string
  portId: string
}

export interface ReconnectConnectorInput {
  source?: ConnectorEndpoint
  target?: ConnectorEndpoint
}

/** Owns connector endpoint validation and derives connector geometry on demand. */
export class ConnectorController {
  create(scene: CanvasScene, input: CreateConnectorInput): CanvasScene {
    if (scene.connectors.some((connector) => connector.id === input.id)) {
      throw new Error(`A connector with id "${input.id}" already exists.`)
    }
    const connector: CanvasConnector = {
      ...input,
      routing: input.routing ?? 'straight',
    }
    this.validate(scene, connector)
    return { ...scene, connectors: [...scene.connectors, connector] }
  }

  validate(scene: CanvasScene, connector: CanvasConnector): void {
    this.assertEndpoint(scene, 'source', connector.sourceNodeId, connector.sourcePortId)
    this.assertEndpoint(scene, 'target', connector.targetNodeId, connector.targetPortId)
  }

  remove(scene: CanvasScene, connectorId: string): CanvasScene {
    return { ...scene, connectors: scene.connectors.filter((connector) => connector.id !== connectorId) }
  }

  reconnect(scene: CanvasScene, connectorId: string, input: ReconnectConnectorInput): CanvasScene {
    const connector = scene.connectors.find((candidate) => candidate.id === connectorId)
    if (!connector) throw new Error(`Unknown connector id: "${connectorId}".`)
    const reconnected: CanvasConnector = {
      ...connector,
      ...(input.source === undefined ? {} : { sourceNodeId: input.source.nodeId, sourcePortId: input.source.portId }),
      ...(input.target === undefined ? {} : { targetNodeId: input.target.nodeId, targetPortId: input.target.portId }),
    }
    this.validate(scene, reconnected)
    return {
      ...scene,
      connectors: scene.connectors.map((candidate) => candidate.id === connectorId ? reconnected : candidate),
    }
  }

  route(scene: CanvasScene, connectorOrId: CanvasConnector | string): Point[] {
    const connector = typeof connectorOrId === 'string'
      ? scene.connectors.find((candidate) => candidate.id === connectorOrId)
      : connectorOrId
    if (!connector) throw new Error(`Unknown connector id: "${connectorOrId}".`)
    this.validate(scene, connector)
    const source = this.endpoint(scene, connector.sourceNodeId, connector.sourcePortId)
    const target = this.endpoint(scene, connector.targetNodeId, connector.targetPortId)
    if (connector.routing === 'straight') return [source.position, target.position]
    return orthogonalRoute(source.position, source.direction, target.position, target.direction)
  }

  private assertEndpoint(scene: CanvasScene, side: 'source' | 'target', nodeId: string, portId: string): void {
    const node = scene.nodes.find((candidate) => candidate.id === nodeId)
    if (!node) throw new Error(`Connector ${side} node "${nodeId}" does not exist.`)
    if (!findNodePort(node, portId)) throw new Error(`Connector ${side} port "${portId}" does not exist on node "${nodeId}".`)
  }

  private endpoint(scene: CanvasScene, nodeId: string, portId: string) {
    const node = scene.nodes.find((candidate) => candidate.id === nodeId)
    if (!node) throw new Error(`Unknown node id: "${nodeId}".`)
    const port = findNodePort(node, portId)
    if (!port) throw new Error(`Unknown port id: "${portId}".`)
    return port
  }
}

function orthogonalRoute(source: Point, sourceDirection: CanvasConnectorDirection, target: Point, targetDirection: CanvasConnectorDirection): Point[] {
  const sourceHorizontal = sourceDirection === 'east' || sourceDirection === 'west'
  const targetHorizontal = targetDirection === 'east' || targetDirection === 'west'
  if (sourceHorizontal && targetHorizontal) {
    const middleX = horizontalLane(source.x, sourceDirection, target.x, targetDirection)
    return [{ ...source }, { x: middleX, y: source.y }, { x: middleX, y: target.y }, { ...target }]
  }
  if (!sourceHorizontal && !targetHorizontal) {
    const middleY = verticalLane(source.y, sourceDirection, target.y, targetDirection)
    return [{ ...source }, { x: source.x, y: middleY }, { x: target.x, y: middleY }, { ...target }]
  }
  if (sourceHorizontal) return [{ ...source }, { x: target.x, y: source.y }, { ...target }]
  return [{ ...source }, { x: source.x, y: target.y }, { ...target }]
}

const ROUTE_CLEARANCE = 20

function horizontalLane(sourceX: number, sourceDirection: CanvasConnectorDirection, targetX: number, targetDirection: CanvasConnectorDirection): number {
  if (sourceDirection === 'east' && targetDirection === 'east') return Math.max(sourceX, targetX) + ROUTE_CLEARANCE
  if (sourceDirection === 'west' && targetDirection === 'west') return Math.min(sourceX, targetX) - ROUTE_CLEARANCE
  if (sourceDirection === 'east' && targetDirection === 'west' && sourceX > targetX) return Math.max(sourceX, targetX) + ROUTE_CLEARANCE
  if (sourceDirection === 'west' && targetDirection === 'east' && sourceX < targetX) return Math.min(sourceX, targetX) - ROUTE_CLEARANCE
  return (sourceX + targetX) / 2
}

function verticalLane(sourceY: number, sourceDirection: CanvasConnectorDirection, targetY: number, targetDirection: CanvasConnectorDirection): number {
  if (sourceDirection === 'south' && targetDirection === 'south') return Math.max(sourceY, targetY) + ROUTE_CLEARANCE
  if (sourceDirection === 'north' && targetDirection === 'north') return Math.min(sourceY, targetY) - ROUTE_CLEARANCE
  if (sourceDirection === 'south' && targetDirection === 'north' && sourceY > targetY) return Math.max(sourceY, targetY) + ROUTE_CLEARANCE
  if (sourceDirection === 'north' && targetDirection === 'south' && sourceY < targetY) return Math.min(sourceY, targetY) - ROUTE_CLEARANCE
  return (sourceY + targetY) / 2
}

type CanvasConnectorDirection = 'north' | 'east' | 'south' | 'west' | 'center'
