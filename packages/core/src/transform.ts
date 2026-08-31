import type { Point, Rect } from '@canvaskit/geometry'
import { nodeBounds } from './bounds.js'
import type { CanvasNode, CanvasScene } from './model.js'

export type TransformHandle =
  | 'north-west'
  | 'north'
  | 'north-east'
  | 'east'
  | 'south-east'
  | 'south'
  | 'south-west'
  | 'west'
  | 'rotate'

export interface TransformConstraints {
  minWidth?: number
  minHeight?: number
  preserveAspectRatio?: boolean
}

export interface TransformOverlay {
  bounds: Rect
  handles: Readonly<Record<TransformHandle, Point>>
  rotation: number
}

export type AlignmentAxis = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
export type DistributionAxis = 'horizontal' | 'vertical'

const ROTATION_HANDLE_OFFSET = 24

export class TransformController {
  getOverlay(scene: CanvasScene, ids: readonly string[]): TransformOverlay | undefined {
    const nodes = selectedNodes(scene, ids)
    if (!nodes) return undefined

    const bounds = unionBounds(nodes)
    return {
      bounds,
      handles: createHandles(bounds),
      rotation: 0,
    }
  }

  resize(
    scene: CanvasScene,
    ids: readonly string[],
    handle: TransformHandle,
    point: Point,
    constraints: TransformConstraints = {},
  ): CanvasScene {
    const nodes = selectedNodes(scene, ids)
    if (!nodes) return scene

    if (handle === 'rotate') {
      const bounds = unionBounds(nodes)
      const centre = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }
      return this.rotate(scene, ids, Math.atan2(point.y - centre.y, point.x - centre.x) + Math.PI / 2)
    }

    const sourceBounds = unionBounds(nodes)
    if (sourceBounds.width === 0 || sourceBounds.height === 0) return scene
    const resizedBounds = resizeBounds(sourceBounds, handle, point, constraints)
    const targetBounds = requiresUniformNodeScale(nodes, sourceBounds, resizedBounds)
      ? projectToUniformScale(sourceBounds, resizedBounds, handle, constraints)
      : resizedBounds
    const scaleX = targetBounds.width / sourceBounds.width
    const scaleY = targetBounds.height / sourceBounds.height
    const selectedIds = new Set(nodes.map((node) => node.id))

    return {
      ...scene,
      nodes: scene.nodes.map((node) => selectedIds.has(node.id)
        ? resizeNode(node, sourceBounds, targetBounds, scaleX, scaleY, handle)
        : node),
    }
  }

  rotate(scene: CanvasScene, ids: readonly string[], radians: number): CanvasScene {
    if (!Number.isFinite(radians)) throw new Error('Rotation angle must be finite.')
    const nodes = selectedNodes(scene, ids)
    if (!nodes || radians === 0) return scene
    const bounds = unionBounds(nodes)
    const centre = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }
    const selectedIds = new Set(nodes.map((node) => node.id))
    return { ...scene, nodes: scene.nodes.map((node) => selectedIds.has(node.id) ? rotateNode(node, centre, radians) : node) }
  }

  align(scene: CanvasScene, ids: readonly string[], axis: AlignmentAxis): CanvasScene {
    const nodes = selectedNodes(scene, ids)
    if (!nodes) return scene

    const selectionBounds = unionBounds(nodes)
    const selectionRight = selectionBounds.x + selectionBounds.width
    const selectionBottom = selectionBounds.y + selectionBounds.height
    const selectionCenterX = selectionBounds.x + selectionBounds.width / 2
    const selectionCenterY = selectionBounds.y + selectionBounds.height / 2
    const moves = new Map(nodes.map((node) => {
      const bounds = normalizeRect(nodeBounds(node))
      const right = bounds.x + bounds.width
      const bottom = bounds.y + bounds.height
      const centerX = bounds.x + bounds.width / 2
      const centerY = bounds.y + bounds.height / 2
      switch (axis) {
        case 'left': return [node.id, { x: selectionBounds.x - bounds.x, y: 0 }]
        case 'center': return [node.id, { x: selectionCenterX - centerX, y: 0 }]
        case 'right': return [node.id, { x: selectionRight - right, y: 0 }]
        case 'top': return [node.id, { x: 0, y: selectionBounds.y - bounds.y }]
        case 'middle': return [node.id, { x: 0, y: selectionCenterY - centerY }]
        case 'bottom': return [node.id, { x: 0, y: selectionBottom - bottom }]
      }
    }))
    return translateSelectedNodes(scene, moves)
  }

  distribute(scene: CanvasScene, ids: readonly string[], axis: DistributionAxis): CanvasScene {
    const nodes = selectedNodes(scene, ids)
    if (!nodes || nodes.length < 2) return scene

    const ordered = nodes
      .map((node, index) => ({ node, index, bounds: normalizeRect(nodeBounds(node)) }))
      .sort((first, second) => {
        const firstPosition = axis === 'horizontal' ? first.bounds.x : first.bounds.y
        const secondPosition = axis === 'horizontal' ? second.bounds.x : second.bounds.y
        return firstPosition - secondPosition || first.index - second.index
      })
    const first = ordered[0].bounds
    const last = ordered.at(-1)!.bounds
    const start = axis === 'horizontal' ? first.x : first.y
    const end = axis === 'horizontal' ? last.x + last.width : last.y + last.height
    const totalSize = ordered.reduce((total, item) => total + (axis === 'horizontal' ? item.bounds.width : item.bounds.height), 0)
    const gap = (end - start - totalSize) / (ordered.length - 1)
    let cursor = start
    const moves = new Map<string, Point>()

    for (const { node, bounds } of ordered) {
      const position = axis === 'horizontal' ? bounds.x : bounds.y
      moves.set(node.id, axis === 'horizontal' ? { x: cursor - position, y: 0 } : { x: 0, y: cursor - position })
      cursor += (axis === 'horizontal' ? bounds.width : bounds.height) + gap
    }

    return translateSelectedNodes(scene, moves)
  }
}

function rotateNode(node: CanvasNode, centre: Point, radians: number): CanvasNode {
  const bounds = normalizeRect(nodeBounds(node))
  const anchor = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }
  const sin = Math.sin(radians); const cos = Math.cos(radians)
  const rotated = { x: centre.x + (anchor.x - centre.x) * cos - (anchor.y - centre.y) * sin, y: centre.y + (anchor.x - centre.x) * sin + (anchor.y - centre.y) * cos }
  const rotation = normalizeAngle((node.rotation ?? 0) + radians)
  if (node.type === 'rectangle' || node.type === 'image') return { ...node, position: { x: rotated.x - bounds.width / 2, y: rotated.y - bounds.height / 2 }, rotation }
  if (node.type === 'circle') return { ...node, position: rotated, rotation }
  return { ...node, position: { x: rotated.x - bounds.width / 2, y: rotated.y + bounds.height / 2 }, rotation }
}

function normalizeAngle(value: number): number {
  const full = Math.PI * 2
  const normalized = value % full
  return normalized < 0 ? normalized + full : normalized
}

function translateSelectedNodes(scene: CanvasScene, moves: ReadonlyMap<string, Point>): CanvasScene {
  if (![...moves.values()].some(({ x, y }) => x !== 0 || y !== 0)) return scene
  return {
    ...scene,
    nodes: scene.nodes.map((node) => {
      const move = moves.get(node.id)
      return move ? { ...node, position: { x: node.position.x + move.x, y: node.position.y + move.y } } : node
    }),
  }
}

function selectedNodes(scene: CanvasScene, ids: readonly string[]): CanvasNode[] | undefined {
  if (ids.length === 0) return undefined
  const byId = new Map(scene.nodes.map((node) => [node.id, node]))
  const uniqueIds = [...new Set(ids)]
  const nodes = uniqueIds.map((id) => byId.get(id))
  return nodes.every((node): node is CanvasNode => node !== undefined) ? nodes : undefined
}

function unionBounds(nodes: readonly CanvasNode[]): Rect {
  const normalized = nodes.map((node) => normalizeRect(nodeBounds(node)))
  const left = Math.min(...normalized.map((bounds) => bounds.x))
  const top = Math.min(...normalized.map((bounds) => bounds.y))
  const right = Math.max(...normalized.map((bounds) => bounds.x + bounds.width))
  const bottom = Math.max(...normalized.map((bounds) => bounds.y + bounds.height))
  return { x: left, y: top, width: right - left, height: bottom - top }
}

function normalizeRect(rect: Rect): Rect {
  const right = rect.x + rect.width
  const bottom = rect.y + rect.height
  return {
    x: Math.min(rect.x, right),
    y: Math.min(rect.y, bottom),
    width: Math.abs(rect.width),
    height: Math.abs(rect.height),
  }
}

function createHandles(bounds: Rect): Readonly<Record<TransformHandle, Point>> {
  const centerX = bounds.x + bounds.width / 2
  const centerY = bounds.y + bounds.height / 2
  const right = bounds.x + bounds.width
  const bottom = bounds.y + bounds.height
  return {
    'north-west': { x: bounds.x, y: bounds.y },
    north: { x: centerX, y: bounds.y },
    'north-east': { x: right, y: bounds.y },
    east: { x: right, y: centerY },
    'south-east': { x: right, y: bottom },
    south: { x: centerX, y: bottom },
    'south-west': { x: bounds.x, y: bottom },
    west: { x: bounds.x, y: centerY },
    rotate: { x: centerX, y: bounds.y - ROTATION_HANDLE_OFFSET },
  }
}

function resizeBounds(source: Rect, handle: Exclude<TransformHandle, 'rotate'>, point: Point, constraints: TransformConstraints): Rect {
  const minWidth = minimum(constraints.minWidth)
  const minHeight = minimum(constraints.minHeight)
  const right = source.x + source.width
  const bottom = source.y + source.height
  let left = source.x
  let top = source.y
  let nextRight = right
  let nextBottom = bottom

  if (handle === 'north-west' || handle === 'west' || handle === 'south-west') left = Math.min(point.x, right - minWidth)
  if (handle === 'north-east' || handle === 'east' || handle === 'south-east') nextRight = Math.max(point.x, source.x + minWidth)
  if (handle === 'north-west' || handle === 'north' || handle === 'north-east') top = Math.min(point.y, bottom - minHeight)
  if (handle === 'south-west' || handle === 'south' || handle === 'south-east') nextBottom = Math.max(point.y, source.y + minHeight)

  const resized = { x: left, y: top, width: nextRight - left, height: nextBottom - top }
  return constraints.preserveAspectRatio ? preserveAspectRatio(source, resized, handle, minWidth, minHeight) : resized
}

/**
 * Circle and text nodes have one scalar size, so their bounds cannot represent
 * a non-uniform scale. Project the entire selection onto a uniform transform
 * whenever either type is selected; this keeps every node and the overlay in
 * the same affine transform instead of mixing an affine position with a
 * different scalar-size transform.
 */
function requiresUniformNodeScale(nodes: readonly CanvasNode[], source: Rect, target: Rect): boolean {
  return nodes.some((node) => node.type !== 'rectangle')
    && target.width / source.width !== target.height / source.height
}

function projectToUniformScale(
  source: Rect,
  candidate: Rect,
  handle: Exclude<TransformHandle, 'rotate'>,
  constraints: TransformConstraints,
): Rect {
  const scaleX = candidate.width / source.width
  const scaleY = candidate.height / source.height
  const scale = Math.max(
    Math.abs(scaleX - 1) >= Math.abs(scaleY - 1) ? scaleX : scaleY,
    minimum(constraints.minWidth) / source.width,
    minimum(constraints.minHeight) / source.height,
  )
  const width = source.width * scale
  const height = source.height * scale
  const right = source.x + source.width
  const bottom = source.y + source.height

  if (handle === 'east') return { x: source.x, y: source.y + (source.height - height) / 2, width, height }
  if (handle === 'west') return { x: right - width, y: source.y + (source.height - height) / 2, width, height }
  if (handle === 'south') return { x: source.x + (source.width - width) / 2, y: source.y, width, height }
  if (handle === 'north') return { x: source.x + (source.width - width) / 2, y: bottom - height, width, height }

  return {
    x: handle === 'north-west' || handle === 'south-west' ? right - width : source.x,
    y: handle === 'north-west' || handle === 'north-east' ? bottom - height : source.y,
    width,
    height,
  }
}

function minimum(value: number | undefined): number {
  return Number.isFinite(value) ? Math.max(0, value ?? 0) : 0
}

function preserveAspectRatio(
  source: Rect,
  candidate: Rect,
  handle: Exclude<TransformHandle, 'rotate'>,
  minWidth: number,
  minHeight: number,
): Rect {
  if (source.width === 0 || source.height === 0) return candidate

  const ratio = source.width / source.height
  const sourceRight = source.x + source.width
  const sourceBottom = source.y + source.height
  let width: number
  let height: number

  if (handle === 'east' || handle === 'west') {
    width = Math.max(candidate.width, minWidth, minHeight * ratio)
    height = width / ratio
    return {
      x: handle === 'west' ? sourceRight - width : source.x,
      y: source.y + (source.height - height) / 2,
      width,
      height,
    }
  }

  if (handle === 'north' || handle === 'south') {
    height = Math.max(candidate.height, minHeight, minWidth / ratio)
    width = height * ratio
    return {
      x: source.x + (source.width - width) / 2,
      y: handle === 'north' ? sourceBottom - height : source.y,
      width,
      height,
    }
  }

  const scaleX = candidate.width / source.width
  const scaleY = candidate.height / source.height
  const scale = Math.max(
    Math.abs(scaleX - 1) >= Math.abs(scaleY - 1) ? scaleX : scaleY,
    minWidth / source.width,
    minHeight / source.height,
  )
  width = source.width * scale
  height = source.height * scale
  return {
    x: handle === 'north-west' || handle === 'south-west' ? sourceRight - width : source.x,
    y: handle === 'north-west' || handle === 'north-east' ? sourceBottom - height : source.y,
    width,
    height,
  }
}

function resizeNode(
  node: CanvasNode,
  source: Rect,
  target: Rect,
  scaleX: number,
  scaleY: number,
  handle: Exclude<TransformHandle, 'rotate'>,
): CanvasNode {
  const mapPoint = (point: Point): Point => ({
    x: target.x + (point.x - source.x) * scaleX,
    y: target.y + (point.y - source.y) * scaleY,
  })

  if (node.type === 'rectangle' || node.type === 'image') {
    const bounds = normalizeRect(nodeBounds(node))
    return {
      ...node,
      position: mapPoint(bounds),
      size: { width: bounds.width * scaleX, height: bounds.height * scaleY },
    }
  }

  const scale = nodeScale(handle, scaleX, scaleY)
  if (node.type === 'circle') {
    return { ...node, position: mapPoint(node.position), radius: node.radius * scale }
  }

  return { ...node, position: mapPoint(node.position), fontSize: node.fontSize * scale }
}

function nodeScale(handle: Exclude<TransformHandle, 'rotate'>, scaleX: number, scaleY: number): number {
  if (handle === 'north' || handle === 'south') return scaleY
  if (handle === 'east' || handle === 'west') return scaleX
  return Math.max(scaleX, scaleY)
}
