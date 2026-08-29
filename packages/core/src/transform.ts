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

export class UnsupportedPersistentRotationError extends Error {
  constructor() {
    super('Persistent rotation is not supported in the current scene model.')
    this.name = 'UnsupportedPersistentRotationError'
  }
}

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
    if (handle === 'rotate') throw new UnsupportedPersistentRotationError()

    const nodes = selectedNodes(scene, ids)
    if (!nodes) return scene

    const sourceBounds = unionBounds(nodes)
    if (sourceBounds.width === 0 || sourceBounds.height === 0) return scene
    const targetBounds = resizeBounds(sourceBounds, handle, point, constraints)
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

  if (node.type === 'rectangle') {
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
