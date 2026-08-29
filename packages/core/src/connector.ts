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
  if (sourceDirection === 'center' || targetDirection === 'center') return [{ ...source }, { ...target }]

  const twoBend = twoBendRoute(source, sourceDirection, target, targetDirection)
  if (twoBend) return compactRoute(twoBend)

  const sourceStub = offset(source, sourceDirection)
  const targetStub = offset(target, targetDirection)
  const join = sourceDirection === 'east' || sourceDirection === 'west'
    ? { x: sourceStub.x, y: targetStub.y }
    : { x: targetStub.x, y: sourceStub.y }
  const approachDirection = segmentDirection(join, targetStub)
  if (approachDirection === targetDirection) {
    const stubDirection = segmentDirection(sourceStub, join)
    const detour = offset(join, stubDirection)
    const turn = isHorizontal(sourceDirection)
      ? { x: targetStub.x, y: detour.y }
      : { x: detour.x, y: targetStub.y }
    return compactRoute([source, sourceStub, join, detour, turn, targetStub, target])
  }
  return compactRoute([source, sourceStub, join, targetStub, target])
}

const ROUTE_CLEARANCE = 20

function twoBendRoute(source: Point, sourceDirection: Exclude<CanvasConnectorDirection, 'center'>, target: Point, targetDirection: Exclude<CanvasConnectorDirection, 'center'>): Point[] | undefined {
  const sourceHorizontal = isHorizontal(sourceDirection)
  if (sourceHorizontal) {
    if (!isHorizontal(targetDirection)) return undefined
    const lane = horizontalLane(source.x, sourceDirection, target.x, targetDirection)
    return lane === undefined ? undefined : [{ ...source }, { x: lane, y: source.y }, { x: lane, y: target.y }, { ...target }]
  }
  if (isHorizontal(targetDirection)) return undefined
  const lane = verticalLane(source.y, sourceDirection, target.y, targetDirection)
  return lane === undefined ? undefined : [{ ...source }, { x: source.x, y: lane }, { x: target.x, y: lane }, { ...target }]
}

function horizontalLane(sourceX: number, sourceDirection: 'east' | 'west', targetX: number, targetDirection: 'east' | 'west'): number | undefined {
  if (sourceDirection === 'east' && targetDirection === 'east') return Math.max(sourceX, targetX) + ROUTE_CLEARANCE
  if (sourceDirection === 'west' && targetDirection === 'west') return Math.min(sourceX, targetX) - ROUTE_CLEARANCE
  if (sourceDirection === 'east' && targetDirection === 'west') return sourceX < targetX ? (sourceX + targetX) / 2 : undefined
  return sourceX > targetX ? (sourceX + targetX) / 2 : undefined
}

function verticalLane(sourceY: number, sourceDirection: 'north' | 'south', targetY: number, targetDirection: 'north' | 'south'): number | undefined {
  if (sourceDirection === 'south' && targetDirection === 'south') return Math.max(sourceY, targetY) + ROUTE_CLEARANCE
  if (sourceDirection === 'north' && targetDirection === 'north') return Math.min(sourceY, targetY) - ROUTE_CLEARANCE
  if (sourceDirection === 'south' && targetDirection === 'north') return sourceY < targetY ? (sourceY + targetY) / 2 : undefined
  return sourceY > targetY ? (sourceY + targetY) / 2 : undefined
}

function offset(point: Point, direction: Exclude<CanvasConnectorDirection, 'center'>): Point {
  switch (direction) {
    case 'north': return { x: point.x, y: point.y - ROUTE_CLEARANCE }
    case 'east': return { x: point.x + ROUTE_CLEARANCE, y: point.y }
    case 'south': return { x: point.x, y: point.y + ROUTE_CLEARANCE }
    case 'west': return { x: point.x - ROUTE_CLEARANCE, y: point.y }
  }
}

function isHorizontal(direction: Exclude<CanvasConnectorDirection, 'center'>): direction is 'east' | 'west' {
  return direction === 'east' || direction === 'west'
}

function segmentDirection(from: Point, to: Point): Exclude<CanvasConnectorDirection, 'center'> {
  if (from.x === to.x) return to.y > from.y ? 'south' : 'north'
  return to.x > from.x ? 'east' : 'west'
}

function compactRoute(points: readonly Point[]): Point[] {
  return points.reduce<Point[]>((route, point) => {
    if (route.length === 0 || route.at(-1)!.x !== point.x || route.at(-1)!.y !== point.y) route.push({ ...point })
    return route
  }, [])
}

type CanvasConnectorDirection = 'north' | 'east' | 'south' | 'west' | 'center'
