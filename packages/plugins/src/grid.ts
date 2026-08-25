import type { CanvasPlugin } from '@canvaskit/core'

export interface GridPluginOptions {
  size?: number
  style?: 'dots' | 'lines'
  color?: string
}

export interface GridPlugin extends CanvasPlugin {
  readonly config: Readonly<Required<GridPluginOptions>>
}

export function createGridPlugin(options: GridPluginOptions = {}): GridPlugin {
  const config = Object.freeze({
    size: options.size ?? 20,
    style: options.style ?? 'dots',
    color: options.color ?? '#e5e7eb',
  })

  return { id: 'grid', config, install: () => undefined }
}
