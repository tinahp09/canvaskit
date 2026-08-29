import { ConnectorController, deriveNodePorts, nodeCenter, projectVisibleDocument, type CanvasEdge, type CanvasScene, type Renderer } from '@canvaskit/core'

interface Point { x: number; y: number }

const SVG_WIDTH = 1200
const SVG_HEIGHT = 720
const EDGE_STROKE = '#737B88'

type CompatibleCanvasScene = CanvasScene & { edges?: readonly CanvasEdge[] }

function escapeXML(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  })[character]!)
}

function attribute(name: string, value: string | number): string {
  return ` ${name}="${escapeXML(String(value))}"`
}

function transform(value: number, offset: number, zoom: number): number {
  return value * zoom + offset
}

/**
 * Serializes a scene into a deterministic SVG document.
 *
 * SVG exports use the fixed 1200×720 logical canvas viewBox. Scene viewport
 * translation and zoom are applied directly to every exported shape and edge.
 */
export function renderSVG(scene: CanvasScene): string {
  const { viewport } = scene
  const projection = projectVisibleDocument(scene)
  const nodesById = new Map(projection.nodes.map((node) => [node.id, node]))
  const x = (value: number) => transform(value, viewport.x, viewport.zoom)
  const y = (value: number) => transform(value, viewport.y, viewport.zoom)
  const scale = (value: number) => value * viewport.zoom
  const elements: string[] = [
    '<defs><marker id="arrowhead" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M 0 0 L 8 4 L 0 8 z" fill="#737B88"/></marker></defs>',
  ]

  for (const edge of legacyEdges(scene)) {
    const source = nodesById.get(edge.sourceId)
    const target = nodesById.get(edge.targetId)
    if (!source || !target) continue

    const start = nodeCenter(source)
    const end = nodeCenter(target)
    const x1 = x(start.x)
    const y1 = y(start.y)
    const x2 = x(end.x)
    const y2 = y(end.y)

    if (edge.type === 'bezier') {
      const midpoint = x1 + (x2 - x1) / 2
      elements.push(`<path${attribute('id', edge.id)}${attribute('d', `M ${x1} ${y1} C ${midpoint} ${y1}, ${midpoint} ${y2}, ${x2} ${y2}`)} fill="none" stroke="${EDGE_STROKE}" stroke-width="1.5"/>`)
    } else {
      const marker = edge.type === 'arrow' ? ' marker-end="url(#arrowhead)"' : ''
      elements.push(`<line${attribute('id', edge.id)} x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${EDGE_STROKE}" stroke-width="1.5"${marker}/>`)
    }
  }

  const connectorController = new ConnectorController()
  for (const connector of projection.connectors) {
    const route = connectorController.route(scene, connector).map((point) => ({ x: x(point.x), y: y(point.y) }))
    const path = route.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
    elements.push(`<path${attribute('id', `connector-${connector.id}`)}${attribute('d', path)} fill="none" stroke="${EDGE_STROKE}" stroke-width="1.5" marker-end="url(#arrowhead)"/>`)
    if (connector.label) {
      const label = pointAlongRoute(route)
      elements.push(`<text${attribute('id', `connector-label-${connector.id}`)} x="${label.x}" y="${label.y}" fill="${EDGE_STROKE}" font-size="12" text-anchor="middle">${escapeXML(connector.label)}</text>`)
    }
  }

  for (const node of projection.nodes) {
    if (node.type === 'rectangle') {
      elements.push(`<rect${attribute('id', node.id)} x="${x(node.position.x)}" y="${y(node.position.y)}" width="${scale(node.size.width)}" height="${scale(node.size.height)}"${attribute('fill', node.fill)}/>`)
    } else if (node.type === 'circle') {
      elements.push(`<circle${attribute('id', node.id)} cx="${x(node.position.x)}" cy="${y(node.position.y)}" r="${scale(node.radius)}"${attribute('fill', node.fill)}/>`)
    } else {
      elements.push(`<text${attribute('id', node.id)} x="${x(node.position.x)}" y="${y(node.position.y)}"${attribute('fill', node.fill)} font-size="${scale(node.fontSize)}">${escapeXML(node.text)}</text>`)
    }
  }

  for (const node of projection.nodes) {
    for (const port of deriveNodePorts(node)) {
      elements.push(`<circle${attribute('id', `port-${node.id}-${port.id}`)} cx="${x(port.position.x)}" cy="${y(port.position.y)}" r="4" fill="#F4F6F8" stroke="${EDGE_STROKE}" stroke-width="1"/>`)
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" width="${SVG_WIDTH}" height="${SVG_HEIGHT}">${elements.join('')}</svg>`
}

function legacyEdges(scene: CanvasScene): readonly CanvasEdge[] {
  const edges = (scene as CompatibleCanvasScene).edges
  return Array.isArray(edges) ? edges : []
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

export class SvgRenderer implements Renderer {
  private renderedSVG = ''

  get svg(): string {
    return this.renderedSVG
  }

  render(scene: CanvasScene): void {
    this.renderedSVG = renderSVG(scene)
  }
}
