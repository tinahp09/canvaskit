import type { CanvasScene } from '@canvaskit/core'

export class CanvasRenderer {
  private readonly context: CanvasRenderingContext2D

  constructor(private readonly element: HTMLCanvasElement) {
    const context = element.getContext('2d')
    if (!context) throw new Error('Canvas 2D is not available.')
    this.context = context
  }

  render(scene: CanvasScene): void {
    this.context.clearRect(0, 0, this.element.width, this.element.height)

    for (const node of scene.nodes) {
      const { viewport } = scene
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
  }
}
