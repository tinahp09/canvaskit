import { screenToWorld, type Point, type ViewportTransform, worldToScreen } from '@canvaskit/geometry'

const MIN_ZOOM = 0.1
const MAX_ZOOM = 4

export class ViewportController {
  private transform: ViewportTransform

  constructor(initial: ViewportTransform = { x: 0, y: 0, zoom: 1 }) {
    this.transform = { ...initial, zoom: clampZoom(initial.zoom) }
  }

  getTransform(): ViewportTransform {
    return { ...this.transform }
  }

  panBy(delta: Point): void {
    this.transform = { ...this.transform, x: this.transform.x + delta.x, y: this.transform.y + delta.y }
  }

  setZoom(zoom: number): void {
    this.transform = { ...this.transform, zoom: clampZoom(zoom) }
  }

  zoomAt(screen: Point, factor: number): void {
    const world = screenToWorld(screen, this.transform)
    const zoom = clampZoom(this.transform.zoom * factor)
    const translated = worldToScreen(world, { x: 0, y: 0, zoom })
    this.transform = { x: screen.x - translated.x, y: screen.y - translated.y, zoom }
  }

  reset(): void {
    this.transform = { x: 0, y: 0, zoom: 1 }
  }
}

function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom))
}
