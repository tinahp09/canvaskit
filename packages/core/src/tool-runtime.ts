import type { Point, Rect } from '@canvaskit/geometry'

export type BuiltInToolId = 'select' | 'pan' | 'rectangle' | 'text' | 'connector'
export type ToolPointerEventType = 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel'
export interface ToolPointerEvent { type: ToolPointerEventType; point: Point }
export type ToolRuntimePhase = 'idle' | 'dragging'
export interface ToolRuntimeSnapshot { activeTool: BuiltInToolId; phase: ToolRuntimePhase }
export type ToolIntent =
  | { type: 'select-at'; point: Point }
  | { type: 'pan-by'; delta: Point }
  | { type: 'preview-rectangle'; bounds: Rect }
  | { type: 'create-rectangle'; bounds: Rect }
  | { type: 'create-text'; point: Point }
  | { type: 'preview-connector'; source: Point; target: Point }
  | { type: 'create-connector'; source: Point; target: Point }

/** A renderer-independent state machine for the built-in editor tools. */
export class ToolRuntime {
  private activeTool: BuiltInToolId
  private phase: ToolRuntimePhase = 'idle'
  private start: Point | undefined
  private previous: Point | undefined

  constructor(initialTool: BuiltInToolId = 'select') { this.activeTool = initialTool }

  activate(tool: BuiltInToolId): void {
    this.activeTool = tool
    this.reset()
  }

  snapshot(): ToolRuntimeSnapshot { return Object.freeze({ activeTool: this.activeTool, phase: this.phase }) }

  handle(event: ToolPointerEvent): ToolIntent[] {
    if (event.type === 'pointercancel') { this.reset(); return [] }
    if (event.type === 'pointerdown') return this.begin(event.point)
    if (event.type === 'pointermove') return this.update(event.point)
    return this.end(event.point)
  }

  private begin(point: Point): ToolIntent[] {
    if (this.activeTool === 'select') return [{ type: 'select-at', point: { ...point } }]
    if (this.activeTool === 'text') return [{ type: 'create-text', point: { ...point } }]
    this.phase = 'dragging'; this.start = { ...point }; this.previous = { ...point }
    return []
  }

  private update(point: Point): ToolIntent[] {
    if (this.phase !== 'dragging' || !this.start) return []
    const previous = this.previous ?? this.start
    this.previous = { ...point }
    if (this.activeTool === 'pan') return [{ type: 'pan-by', delta: { x: point.x - previous.x, y: point.y - previous.y } }]
    if (this.activeTool === 'rectangle') return [{ type: 'preview-rectangle', bounds: normalizedRect(this.start, point) }]
    if (this.activeTool === 'connector') return [{ type: 'preview-connector', source: { ...this.start }, target: { ...point } }]
    return []
  }

  private end(point: Point): ToolIntent[] {
    if (this.phase !== 'dragging' || !this.start) return []
    const start = this.start
    this.reset()
    if (this.activeTool === 'rectangle') {
      const bounds = normalizedRect(start, point)
      return bounds.width === 0 || bounds.height === 0 ? [] : [{ type: 'create-rectangle', bounds }]
    }
    if (this.activeTool === 'connector' && (start.x !== point.x || start.y !== point.y)) return [{ type: 'create-connector', source: start, target: { ...point } }]
    return []
  }

  private reset(): void { this.phase = 'idle'; this.start = undefined; this.previous = undefined }
}

function normalizedRect(first: Point, second: Point): Rect {
  return { x: Math.min(first.x, second.x), y: Math.min(first.y, second.y), width: Math.abs(second.x - first.x), height: Math.abs(second.y - first.y) }
}
