import type { Point, Rect } from '@canvaskit/geometry'
import { nodeBounds } from './bounds.js'
import { interactiveNodesInRenderOrder } from './document.js'
import type { CanvasGuide, CanvasNode, CanvasScene, GuideAxis } from './model.js'

export interface SnapOptions { tolerance?: number }
export interface SnapResult { delta: Point; activeGuides: CanvasGuide[] }
export interface AutoLayoutOptions {
  direction: 'horizontal' | 'vertical' | 'grid'
  columns?: number
  gap?: Point
  origin?: Point
}

export class LayoutController {
  createGuide(scene: CanvasScene, guide: CanvasGuide): CanvasScene {
    assertGuide(guide)
    if (scene.guides.some((item) => item.id === guide.id)) throw new Error(`A guide with id "${guide.id}" already exists.`)
    return { ...scene, guides: [...scene.guides, { ...guide }] }
  }

  moveGuide(scene: CanvasScene, id: string, position: number): CanvasScene {
    if (!Number.isFinite(position)) throw new Error('Guide position must be finite.')
    if (!scene.guides.some((guide) => guide.id === id)) throw new Error(`Unknown guide id: ${id}.`)
    return { ...scene, guides: scene.guides.map((guide) => guide.id === id ? { ...guide, position } : guide) }
  }

  removeGuide(scene: CanvasScene, id: string): CanvasScene {
    if (!scene.guides.some((guide) => guide.id === id)) throw new Error(`Unknown guide id: ${id}.`)
    return { ...scene, guides: scene.guides.filter((guide) => guide.id !== id) }
  }

  snapTranslation(scene: CanvasScene, ids: readonly string[], proposedDelta: Point, options: SnapOptions = {}): SnapResult {
    const selected = ids.flatMap((id) => {
      const node = scene.nodes.find((item) => item.id === id)
      return node && interactiveNodesInRenderOrder(scene).some((item) => item.id === id) ? [node] : []
    })
    if (selected.length === 0) return { delta: { ...proposedDelta }, activeGuides: [] }
    const tolerance = options.tolerance ?? 8
    if (!Number.isFinite(tolerance) || tolerance < 0) throw new RangeError('Snap tolerance must be a non-negative finite number.')
    const selectedIds = new Set(selected.map((node) => node.id))
    const peers = interactiveNodesInRenderOrder(scene).filter((node) => !selectedIds.has(node.id))
    const bounds = unionBounds(selected.map(nodeBounds))
    const x = resolveAxis('vertical', bounds.x, bounds.x + bounds.width / 2, bounds.x + bounds.width, proposedDelta.x, scene.guides, peers, tolerance)
    const y = resolveAxis('horizontal', bounds.y, bounds.y + bounds.height / 2, bounds.y + bounds.height, proposedDelta.y, scene.guides, peers, tolerance)
    return { delta: { x: proposedDelta.x + x.adjustment, y: proposedDelta.y + y.adjustment }, activeGuides: [...x.guides, ...y.guides] }
  }

  autoLayout(scene: CanvasScene, ids: readonly string[], options: AutoLayoutOptions): CanvasScene {
    const requested = new Set(ids)
    const nodes = interactiveNodesInRenderOrder(scene).filter((node) => requested.has(node.id))
    if (nodes.length === 0) return scene
    const gap = options.gap ?? { x: 24, y: 24 }
    const origin = options.origin ?? { x: 0, y: 0 }
    if (!Number.isFinite(gap.x) || !Number.isFinite(gap.y) || !Number.isFinite(origin.x) || !Number.isFinite(origin.y)) throw new Error('Layout gap and origin must be finite.')
    if (options.direction === 'grid' && (!Number.isInteger(options.columns) || options.columns! <= 0)) throw new RangeError('Grid layout requires a positive integer column count.')
    const positions = new Map<string, Point>()
    if (options.direction === 'horizontal') {
      let x = origin.x
      for (const node of nodes) { const bounds = nodeBounds(node); positions.set(node.id, { x, y: origin.y }); x += bounds.width + gap.x }
    } else if (options.direction === 'vertical') {
      let y = origin.y
      for (const node of nodes) { const bounds = nodeBounds(node); positions.set(node.id, { x: origin.x, y }); y += bounds.height + gap.y }
    } else {
      const columns = options.columns!
      const columnWidths = Array.from({ length: columns }, (_, column) => Math.max(...nodes.filter((_, index) => index % columns === column).map((node) => nodeBounds(node).width), 0))
      let y = origin.y
      for (let row = 0; row * columns < nodes.length; row += 1) {
        let x = origin.x
        let rowHeight = 0
        for (let column = 0; column < columns; column += 1) {
          const node = nodes[row * columns + column]
          if (!node) break
          const bounds = nodeBounds(node)
          positions.set(node.id, { x, y })
          rowHeight = Math.max(rowHeight, bounds.height)
          x += columnWidths[column]! + gap.x
        }
        y += rowHeight + gap.y
      }
    }
    return { ...scene, nodes: scene.nodes.map((node) => {
      const target = positions.get(node.id)
      if (!target) return node
      const bounds = nodeBounds(node)
      return { ...node, position: { x: node.position.x + target.x - bounds.x, y: node.position.y + target.y - bounds.y } } as CanvasNode
    }) }
  }
}

function assertGuide(guide: CanvasGuide): void {
  if (!guide.id || (guide.axis !== 'horizontal' && guide.axis !== 'vertical') || !Number.isFinite(guide.position)) throw new Error('Guide is invalid.')
}

function unionBounds(bounds: readonly Rect[]): Rect {
  const minX = Math.min(...bounds.map((item) => item.x)); const minY = Math.min(...bounds.map((item) => item.y))
  const maxX = Math.max(...bounds.map((item) => item.x + item.width)); const maxY = Math.max(...bounds.map((item) => item.y + item.height))
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

function resolveAxis(axis: GuideAxis, start: number, center: number, end: number, proposed: number, guides: readonly CanvasGuide[], peers: readonly CanvasNode[], tolerance: number): { adjustment: number; guides: CanvasGuide[] } {
  const source = [start, center, end]
  const stored = guides.filter((guide) => guide.axis === axis)
  for (const guide of stored) {
    const adjustment = nearestAdjustment(source, guide.position, proposed, tolerance)
    if (adjustment !== undefined) return { adjustment, guides: [guide] }
  }
  const peerValues = peers.flatMap((node) => {
    const bounds = nodeBounds(node)
    return axis === 'vertical' ? [bounds.x, bounds.x + bounds.width / 2, bounds.x + bounds.width] : [bounds.y, bounds.y + bounds.height / 2, bounds.y + bounds.height]
  })
  let candidate: number | undefined
  for (const value of peerValues) {
    const adjustment = nearestAdjustment(source, value, proposed, tolerance)
    if (adjustment !== undefined && (candidate === undefined || Math.abs(adjustment) < Math.abs(candidate))) candidate = adjustment
  }
  return candidate === undefined ? { adjustment: 0, guides: [] } : { adjustment: candidate, guides: [{ id: `snap-${axis}-${start + proposed + candidate}`, axis, position: start + proposed + candidate }] }
}

function nearestAdjustment(source: readonly number[], target: number, proposed: number, tolerance: number): number | undefined {
  let best: number | undefined
  for (const value of source) {
    const adjustment = target - (value + proposed)
    if (Math.abs(adjustment) <= tolerance && (best === undefined || Math.abs(adjustment) < Math.abs(best))) best = adjustment
  }
  return best
}
