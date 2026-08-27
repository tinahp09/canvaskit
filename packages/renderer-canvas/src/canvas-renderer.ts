import { nodeCenter, SpatialIndex, type CanvasScene } from '@canvaskit/core'

export class CanvasRenderer {
  private readonly context: CanvasRenderingContext2D

  constructor(private readonly element: HTMLCanvasElement) {
    const context = element.getContext('2d')
    if (!context) throw new Error('Canvas 2D is not available.')
    this.context = context
  }

  render(scene: CanvasScene, selectedNodeIds: readonly string[] = []): void {
    this.context.clearRect(0, 0, this.element.width, this.element.height)
    const { viewport } = scene
    const visibleNodes = new SpatialIndex(scene.nodes).query({
      x: -viewport.x / viewport.zoom,
      y: -viewport.y / viewport.zoom,
      width: this.element.width / viewport.zoom,
      height: this.element.height / viewport.zoom,
    })
    const visibleNodeIds = new Set(visibleNodes.map((node) => node.id))
    const nodesById = new Map(scene.nodes.map((node) => [node.id, node]))

    for (const edge of scene.edges ?? []) {
      const source = nodesById.get(edge.sourceId)
      const target = nodesById.get(edge.targetId)
      if (!source || !target || (!visibleNodeIds.has(source.id) && !visibleNodeIds.has(target.id))) continue
      const a = nodeCenter(source); const b = nodeCenter(target)
      const ax = a.x * viewport.zoom + viewport.x; const ay = a.y * viewport.zoom + viewport.y
      const bx = b.x * viewport.zoom + viewport.x; const by = b.y * viewport.zoom + viewport.y
      this.context.beginPath(); this.context.moveTo(ax, ay)
      if (edge.type === 'bezier') this.context.bezierCurveTo(ax + (bx - ax) / 2, ay, ax + (bx - ax) / 2, by, bx, by)
      else this.context.lineTo(bx, by)
      this.context.strokeStyle = '#737B88'; this.context.lineWidth = 1.5; this.context.stroke()
      if (edge.type === 'arrow') this.drawArrowhead(ax, ay, bx, by)
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
      this.context.arc(point.x * viewport.zoom + viewport.x, point.y * viewport.zoom + viewport.y, 6, 0, Math.PI * 2)
      this.context.fillStyle = '#F4F6F8'
      this.context.fill()
    }
  }

  private drawArrowhead(ax: number, ay: number, bx: number, by: number): void {
    const angle = Math.atan2(by - ay, bx - ax); const size = 8
    this.context.beginPath(); this.context.moveTo(bx, by)
    this.context.lineTo(bx - size * Math.cos(angle - Math.PI / 6), by - size * Math.sin(angle - Math.PI / 6))
    this.context.lineTo(bx - size * Math.cos(angle + Math.PI / 6), by - size * Math.sin(angle + Math.PI / 6))
    this.context.fill()
  }
}
