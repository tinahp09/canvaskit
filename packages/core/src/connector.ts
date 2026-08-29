import type { Point, Rect } from '@canvaskit/geometry'
import type { CanvasConnector, CanvasScene, CreateConnectorInput } from './model.js'
import { nodeBounds } from './bounds.js'
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
    if (source.direction === 'center' || target.direction === 'center') return [source.position, target.position]
    const route = orthogonalRoute(source.position, source.direction, target.position, target.direction)
    return hasImmediateReversal(route) || routeCrossesOpenInterior(route, source.bounds) || routeCrossesOpenInterior(route, target.bounds)
      ? exteriorNodeDetour(source.position, source.direction, source.bounds, target.position, target.direction, target.bounds)
      : route
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
    return { ...port, bounds: nodeBounds(node) }
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
  const stubDirection = segmentDirection(sourceStub, join)
  if (!approachDirection || !stubDirection || samePoint(join, sourceStub) || samePoint(join, targetStub)) {
    return perpendicularLaneDetour(source, sourceStub, targetStub, target, sourceDirection, targetDirection)
  }
  if (approachDirection === targetDirection) {
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
    if (source.y === target.y) return collinearHorizontalRoute(source, sourceDirection, target, targetDirection)
    const lane = horizontalLane(source.x, sourceDirection, target.x, targetDirection)
    return lane === undefined ? undefined : [{ ...source }, { x: lane, y: source.y }, { x: lane, y: target.y }, { ...target }]
  }
  if (isHorizontal(targetDirection)) return undefined
  if (source.x === target.x) return collinearVerticalRoute(source, sourceDirection, target, targetDirection)
  const lane = verticalLane(source.y, sourceDirection, target.y, targetDirection)
  return lane === undefined ? undefined : [{ ...source }, { x: source.x, y: lane }, { x: target.x, y: lane }, { ...target }]
}

function collinearHorizontalRoute(source: Point, sourceDirection: 'east' | 'west', target: Point, targetDirection: 'east' | 'west'): Point[] {
  const sourceStub = offset(source, sourceDirection)
  const targetStub = offset(target, targetDirection)
  const laneY = source.y - ROUTE_CLEARANCE
  return [
    { ...source }, sourceStub,
    { x: sourceStub.x, y: laneY }, { x: targetStub.x, y: laneY },
    targetStub, { ...target },
  ]
}

function collinearVerticalRoute(source: Point, sourceDirection: 'north' | 'south', target: Point, targetDirection: 'north' | 'south'): Point[] {
  const sourceStub = offset(source, sourceDirection)
  const targetStub = offset(target, targetDirection)
  const laneX = source.x - ROUTE_CLEARANCE
  return [
    { ...source }, sourceStub,
    { x: laneX, y: sourceStub.y }, { x: laneX, y: targetStub.y },
    targetStub, { ...target },
  ]
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

function perpendicularLaneDetour(
  source: Point,
  sourceStub: Point,
  targetStub: Point,
  target: Point,
  sourceDirection: Exclude<CanvasConnectorDirection, 'center'>,
  targetDirection: Exclude<CanvasConnectorDirection, 'center'>,
): Point[] {
  const extendedSourceStub = offset(sourceStub, sourceDirection)
  const offsets = [
    perpendicularOffset(sourceDirection),
    -perpendicularOffset(sourceDirection),
    2 * perpendicularOffset(sourceDirection),
    -2 * perpendicularOffset(sourceDirection),
  ]

  for (const laneOffset of offsets) {
    for (const approachOffset of offsets) {
      const route = detourRoute(
        source,
        sourceStub,
        extendedSourceStub,
        targetStub,
        target,
        sourceDirection,
        targetDirection,
        laneOffset,
        approachOffset,
      )
      if (!hasImmediateReversal(route)) return route
    }
  }

  // The deterministic first candidate is retained as a total fallback; the
  // route still preserves the port stubs even for degenerate coordinates.
  return detourRoute(
    source, sourceStub, extendedSourceStub, targetStub, target,
    sourceDirection, targetDirection, offsets[0]!, offsets[0]!,
  )
}

function detourRoute(
  source: Point,
  sourceStub: Point,
  extendedSourceStub: Point,
  targetStub: Point,
  target: Point,
  sourceDirection: Exclude<CanvasConnectorDirection, 'center'>,
  targetDirection: Exclude<CanvasConnectorDirection, 'center'>,
  laneOffset: number,
  approachOffset: number,
): Point[] {
  if (isHorizontal(sourceDirection)) {
    const lane = { x: extendedSourceStub.x, y: extendedSourceStub.y + laneOffset }
    if (isHorizontal(targetDirection)) {
      return compactRoute([source, sourceStub, extendedSourceStub, lane, { x: targetStub.x, y: lane.y }, targetStub, target])
    }
    const approachX = targetStub.x + approachOffset
    return compactRoute([
      source, sourceStub, extendedSourceStub, lane,
      { x: approachX, y: lane.y }, { x: approachX, y: targetStub.y },
      targetStub, target,
    ])
  }

  const lane = { x: extendedSourceStub.x + laneOffset, y: extendedSourceStub.y }
  if (!isHorizontal(targetDirection)) {
    return compactRoute([source, sourceStub, extendedSourceStub, lane, { x: lane.x, y: targetStub.y }, targetStub, target])
  }
  const approachY = targetStub.y + approachOffset
  return compactRoute([
    source, sourceStub, extendedSourceStub, lane,
    { x: lane.x, y: approachY }, { x: targetStub.x, y: approachY },
    targetStub, target,
  ])
}

function hasImmediateReversal(points: readonly Point[]): boolean {
  let previous: Exclude<CanvasConnectorDirection, 'center'> | undefined
  for (let index = 1; index < points.length; index += 1) {
    const direction = segmentDirection(points[index - 1]!, points[index]!)
    if (!direction) continue
    if (previous && direction === oppositeDirection(previous)) return true
    previous = direction
  }
  return false
}

function exteriorNodeDetour(
  source: Point,
  sourceDirection: Exclude<CanvasConnectorDirection, 'center'>,
  sourceBounds: Rect,
  target: Point,
  targetDirection: Exclude<CanvasConnectorDirection, 'center'>,
  targetBounds: Rect,
): Point[] {
  const sourceStub = exteriorStub(source, sourceDirection)
  const targetStub = exteriorStub(target, targetDirection)
  const top = Math.min(sourceBounds.y, targetBounds.y) - ROUTE_CLEARANCE
  const bottom = Math.max(sourceBounds.y + sourceBounds.height, targetBounds.y + targetBounds.height) + ROUTE_CLEARANCE
  const left = Math.min(sourceBounds.x, targetBounds.x) - ROUTE_CLEARANCE
  const right = Math.max(sourceBounds.x + sourceBounds.width, targetBounds.x + targetBounds.width) + ROUTE_CLEARANCE
  const verticalLanes = sourceDirection === 'north' ? [top, bottom] : [bottom, top]
  const horizontalLanes = sourceDirection === 'west' ? [left, right] : [right, left]

  for (const lane of isHorizontal(sourceDirection) ? verticalLanes : horizontalLanes) {
    for (const approach of isHorizontal(targetDirection) ? verticalLanes : horizontalLanes) {
      const route = exteriorDetourCandidate(
        source, sourceStub, targetStub, target,
        sourceDirection, targetDirection, lane, approach,
      )
      if (!hasImmediateReversal(route) && !routeCrossesOpenInterior(route, sourceBounds) && !routeCrossesOpenInterior(route, targetBounds)) {
        return route
      }
    }
  }

  return exteriorDetourCandidate(
    source, sourceStub, targetStub, target,
    sourceDirection, targetDirection,
    isHorizontal(sourceDirection) ? verticalLanes[0]! : horizontalLanes[0]!,
    isHorizontal(targetDirection) ? verticalLanes[0]! : horizontalLanes[0]!,
  )
}

function exteriorStub(point: Point, direction: Exclude<CanvasConnectorDirection, 'center'>): Point {
  switch (direction) {
    case 'north': return { x: point.x, y: point.y - 1 }
    case 'east': return { x: point.x + 1, y: point.y }
    case 'south': return { x: point.x, y: point.y + 1 }
    case 'west': return { x: point.x - 1, y: point.y }
  }
}

function exteriorDetourCandidate(
  source: Point,
  sourceStub: Point,
  targetStub: Point,
  target: Point,
  sourceDirection: Exclude<CanvasConnectorDirection, 'center'>,
  targetDirection: Exclude<CanvasConnectorDirection, 'center'>,
  lane: number,
  approach: number,
): Point[] {
  if (isHorizontal(sourceDirection)) {
    if (isHorizontal(targetDirection)) {
      return compactRoute([source, sourceStub, { x: sourceStub.x, y: lane }, { x: targetStub.x, y: lane }, targetStub, target])
    }
    return compactRoute([
      source, sourceStub, { x: sourceStub.x, y: lane }, { x: approach, y: lane },
      { x: approach, y: targetStub.y }, targetStub, target,
    ])
  }
  if (!isHorizontal(targetDirection)) {
    return compactRoute([source, sourceStub, { x: lane, y: sourceStub.y }, { x: lane, y: targetStub.y }, targetStub, target])
  }
  return compactRoute([
    source, sourceStub, { x: lane, y: sourceStub.y }, { x: lane, y: approach },
    { x: targetStub.x, y: approach }, targetStub, target,
  ])
}

function routeCrossesOpenInterior(points: readonly Point[], bounds: Rect): boolean {
  return points.slice(1).some((point, index) => segmentCrossesOpenInterior(points[index]!, point, bounds))
}

function segmentCrossesOpenInterior(from: Point, to: Point, bounds: Rect): boolean {
  const right = bounds.x + bounds.width
  const bottom = bounds.y + bounds.height
  if (from.x === to.x) {
    return from.x > bounds.x && from.x < right
      && Math.max(Math.min(from.y, to.y), bounds.y) < Math.min(Math.max(from.y, to.y), bottom)
  }
  return from.y > bounds.y && from.y < bottom
    && Math.max(Math.min(from.x, to.x), bounds.x) < Math.min(Math.max(from.x, to.x), right)
}

function oppositeDirection(direction: Exclude<CanvasConnectorDirection, 'center'>): Exclude<CanvasConnectorDirection, 'center'> {
  switch (direction) {
    case 'north': return 'south'
    case 'east': return 'west'
    case 'south': return 'north'
    case 'west': return 'east'
  }
}

function perpendicularOffset(direction: Exclude<CanvasConnectorDirection, 'center'>): number {
  return direction === 'north' || direction === 'east' ? ROUTE_CLEARANCE : -ROUTE_CLEARANCE
}

function segmentDirection(from: Point, to: Point): Exclude<CanvasConnectorDirection, 'center'> | undefined {
  if (from.x === to.x && from.y === to.y) return undefined
  if (from.x === to.x) return to.y > from.y ? 'south' : 'north'
  return to.x > from.x ? 'east' : 'west'
}

function samePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y
}

function compactRoute(points: readonly Point[]): Point[] {
  return points.reduce<Point[]>((route, point) => {
    if (route.length === 0 || route.at(-1)!.x !== point.x || route.at(-1)!.y !== point.y) route.push({ ...point })
    return route
  }, [])
}

type CanvasConnectorDirection = 'north' | 'east' | 'south' | 'west' | 'center'
