import { ConnectorController, deriveNodePorts, isNodeInteractive, nodeCenter, projectVisibleDocument, SpatialIndex, type CanvasEdge, type CanvasScene, type TransformOverlay } from '@canvaskit/core'

interface Point { x: number; y: number }

const RESIZE_HANDLES = [
  'north-west', 'north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west',
] as const
const CONNECTION_HANDLE_OFFSET = 16
const CONNECTOR_STROKE = '#737B88'
const SELECTED_CONNECTOR_STROKE = '#2563EB'

type CompatibleCanvasScene = CanvasScene & { edges?: readonly CanvasEdge[] }

export class CanvasRenderer {
  private readonly context: CanvasRenderingContext2D

  constructor(private readonly element: HTMLCanvasElement) {
    const context = element.getContext('2d')
    if (!context) throw new Error('Canvas 2D is not available.')
    this.context = context
  }

  render(
    scene: CanvasScene,
    selectedNodeIds: readonly string[] = [],
    transformOverlay?: TransformOverlay,
    selectedConnectorId?: string,
  ): { visibleNodeCount: number } {
    this.context.clearRect(0, 0, this.element.width, this.element.height)
    const { viewport } = scene
    const worldViewport = getWorldViewport(this.element, viewport)
    if (!worldViewport) return { visibleNodeCount: 0 }
    const projection = projectVisibleDocument(scene)
    const visibleNodes = new SpatialIndex(projection.nodes).query(worldViewport)
    const visibleNodeIds = new Set(visibleNodes.map((node) => node.id))
    const nodesById = new Map(projection.nodes.map((node) => [node.id, node]))

    for (const edge of legacyEdges(scene)) {
      const source = nodesById.get(edge.sourceId)
      const target = nodesById.get(edge.targetId)
      if (!source || !target) continue
      const a = nodeCenter(source); const b = nodeCenter(target)
      const ax = a.x * viewport.zoom + viewport.x; const ay = a.y * viewport.zoom + viewport.y
      const bx = b.x * viewport.zoom + viewport.x; const by = b.y * viewport.zoom + viewport.y
      const hasVisibleEndpoint = visibleNodeIds.has(source.id) || visibleNodeIds.has(target.id)
      if (!hasVisibleEndpoint && !edgeMayCrossViewport(ax, ay, bx, by, this.element.width, this.element.height)) continue
      this.context.beginPath(); this.context.moveTo(ax, ay)
      if (edge.type === 'bezier') this.context.bezierCurveTo(ax + (bx - ax) / 2, ay, ax + (bx - ax) / 2, by, bx, by)
      else this.context.lineTo(bx, by)
      this.context.strokeStyle = CONNECTOR_STROKE; this.context.lineWidth = 1.5; this.context.stroke()
      if (edge.type === 'arrow') this.drawArrowhead(ax, ay, bx, by)
    }

    const connectorController = new ConnectorController()
    for (const connector of projection.connectors) {
      const route = connectorController.route(scene, connector)
      const screenRoute = route.map((point) => toScreenPoint(point, viewport))
      const hasVisibleEndpoint = visibleNodeIds.has(connector.sourceNodeId) || visibleNodeIds.has(connector.targetNodeId)
      if (!hasVisibleEndpoint && !routeMayCrossViewport(screenRoute, this.element.width, this.element.height)) continue

      this.context.beginPath()
      this.context.moveTo(screenRoute[0]!.x, screenRoute[0]!.y)
      for (const point of screenRoute.slice(1)) this.context.lineTo(point.x, point.y)
      this.context.strokeStyle = connector.id === selectedConnectorId ? SELECTED_CONNECTOR_STROKE : CONNECTOR_STROKE
      this.context.lineWidth = connector.id === selectedConnectorId ? 2.5 : 1.5
      this.context.stroke()
      const previous = screenRoute.at(-2)
      const target = screenRoute.at(-1)
      if (previous && target) this.drawArrowhead(previous.x, previous.y, target.x, target.y)
      if (connector.label) {
        const label = pointAlongRoute(screenRoute)
        this.context.fillStyle = connector.id === selectedConnectorId ? SELECTED_CONNECTOR_STROKE : CONNECTOR_STROKE
        this.context.font = '12px sans-serif'
        this.context.fillText(connector.label, label.x, label.y)
      }
    }

    for (const node of visibleNodes) {
      this.context.fillStyle = node.fill
      const x = node.position.x * viewport.zoom + viewport.x
      const y = node.position.y * viewport.zoom + viewport.y
      if (node.type === 'rectangle') {
        this.context.fillRect(x, y, node.size.width * viewport.zoom, node.size.height * viewport.zoom)
      } else if (node.type === 'circle') {
        this.context.beginPath()
        this.context.arc(x, y, node.radius * viewport.zoom, 0, Math.PI * 2)
        this.context.fill()
      } else {
        this.context.font = `${node.fontSize * viewport.zoom}px sans-serif`
        this.context.fillText(node.text, x, y)
      }
    }

    for (const node of visibleNodes) {
      if (!selectedNodeIds.includes(node.id)) continue
      const point = node.type === 'rectangle'
        ? { x: node.position.x + node.size.width, y: node.position.y + node.size.height / 2 }
        : node.type === 'circle'
          ? { x: node.position.x + node.radius, y: node.position.y }
          : { x: node.position.x + node.text.length * node.fontSize, y: node.position.y - node.fontSize / 2 }
      this.context.beginPath()
      this.context.arc(
        point.x * viewport.zoom + viewport.x + (transformOverlay ? CONNECTION_HANDLE_OFFSET : 0),
        point.y * viewport.zoom + viewport.y,
        6,
        0,
        Math.PI * 2,
      )
      this.context.fillStyle = '#F4F6F8'
      this.context.fill()
    }

    for (const node of visibleNodes) {
      if (!isNodeInteractive(scene, node.id)) continue
      for (const port of deriveNodePorts(node)) {
        const point = toScreenPoint(port.position, viewport)
        this.context.beginPath()
        this.context.arc(point.x, point.y, 4, 0, Math.PI * 2)
        this.context.fillStyle = '#F4F6F8'
        this.context.fill()
      }
    }

    if (transformOverlay) this.drawTransformOverlay(transformOverlay, viewport)

    return { visibleNodeCount: visibleNodes.length }
  }

  private drawTransformOverlay(overlay: TransformOverlay, viewport: CanvasScene['viewport']): void {
    const screenPoint = ({ x, y }: { x: number; y: number }) => ({
      x: x * viewport.zoom + viewport.x,
      y: y * viewport.zoom + viewport.y,
    })
    const bounds = screenPoint(overlay.bounds)
    const width = overlay.bounds.width * viewport.zoom
    const height = overlay.bounds.height * viewport.zoom

    this.context.strokeStyle = '#93C5FD'
    this.context.lineWidth = 1
    this.context.setLineDash([4, 4])
    this.context.strokeRect(bounds.x, bounds.y, width, height)
    this.context.setLineDash([])

    const north = screenPoint(overlay.handles.north)
    const rotation = screenPoint(overlay.handles.rotate)
    this.context.beginPath()
    this.context.moveTo(north.x, north.y)
    this.context.lineTo(rotation.x, rotation.y)
    this.context.stroke()

    this.context.fillStyle = '#F4F6F8'
    this.context.strokeStyle = '#2563EB'
    for (const handle of RESIZE_HANDLES) {
      const point = screenPoint(overlay.handles[handle])
      this.context.fillRect(point.x - 4, point.y - 4, 8, 8)
      this.context.strokeRect(point.x - 4, point.y - 4, 8, 8)
    }
    this.context.beginPath()
    this.context.arc(rotation.x, rotation.y, 5, 0, Math.PI * 2)
    this.context.fill()
    this.context.stroke()
  }

  private drawArrowhead(ax: number, ay: number, bx: number, by: number): void {
    const angle = Math.atan2(by - ay, bx - ax); const size = 8
    this.context.beginPath(); this.context.moveTo(bx, by)
    this.context.lineTo(bx - size * Math.cos(angle - Math.PI / 6), by - size * Math.sin(angle - Math.PI / 6))
    this.context.lineTo(bx - size * Math.cos(angle + Math.PI / 6), by - size * Math.sin(angle + Math.PI / 6))
    this.context.fill()
  }
}

function legacyEdges(scene: CanvasScene): readonly CanvasEdge[] {
  const edges = (scene as CompatibleCanvasScene).edges
  return Array.isArray(edges) ? edges : []
}

function toScreenPoint(point: Point, viewport: CanvasScene['viewport']): Point {
  return { x: point.x * viewport.zoom + viewport.x, y: point.y * viewport.zoom + viewport.y }
}

function pointAlongRoute(route: readonly Point[]): Point {
  const total = route.slice(1).reduce((length, point, index) => length + Math.hypot(point.x - route[index]!.x, point.y - route[index]!.y), 0)
  let remaining = total / 2
  for (let index = 1; index < route.length; index += 1) {
    const start = route[index - 1]!
    const end = route[index]!
    const segmentLength = Math.hypot(end.x - start.x, end.y - start.y)
    if (remaining <= segmentLength || index === route.length - 1) {
      const ratio = segmentLength === 0 ? 0 : remaining / segmentLength
      return { x: start.x + (end.x - start.x) * ratio, y: start.y + (end.y - start.y) * ratio }
    }
    remaining -= segmentLength
  }
  return route[0] ?? { x: 0, y: 0 }
}

function getWorldViewport(element: HTMLCanvasElement, viewport: CanvasScene['viewport']): { x: number; y: number; width: number; height: number } | undefined {
  if (!Number.isFinite(viewport.zoom) || viewport.zoom === 0) return undefined
  const first = { x: -viewport.x / viewport.zoom, y: -viewport.y / viewport.zoom }
  const second = { x: (element.width - viewport.x) / viewport.zoom, y: (element.height - viewport.y) / viewport.zoom }
  return {
    x: Math.min(first.x, second.x),
    y: Math.min(first.y, second.y),
    width: Math.abs(second.x - first.x),
    height: Math.abs(second.y - first.y),
  }
}

function edgeMayCrossViewport(ax: number, ay: number, bx: number, by: number, width: number, height: number): boolean {
  return Math.max(ax, bx) >= 0 && Math.min(ax, bx) <= width
    && Math.max(ay, by) >= 0 && Math.min(ay, by) <= height
}

function routeMayCrossViewport(route: readonly Point[], width: number, height: number): boolean {
  return route.some((point, index) => {
    const next = route[index + 1]
    return next !== undefined && edgeMayCrossViewport(point.x, point.y, next.x, next.y, width, height)
  })
}
