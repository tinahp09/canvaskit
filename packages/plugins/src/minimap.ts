import type { CanvasKit, CanvasPlugin } from '@canvaskit/core'

type Viewport = ReturnType<CanvasKit['getScene']>['viewport']

export interface MinimapSceneSummary {
  readonly nodeCount: number
  readonly edgeCount: number
  readonly groupCount: number
  readonly viewport: Readonly<Viewport>
}

export interface MinimapPlugin extends CanvasPlugin {
  readonly summary: Readonly<MinimapSceneSummary> | undefined
}

function summarize(canvas: CanvasKit): Readonly<MinimapSceneSummary> {
  const scene = canvas.getScene()
  return Object.freeze({
    nodeCount: scene.nodes.length,
    edgeCount: scene.edges.length,
    groupCount: scene.groups.length,
    viewport: Object.freeze({ ...scene.viewport }),
  })
}

export function createMinimapPlugin(): MinimapPlugin {
  let canvas: CanvasKit | undefined

  return {
    id: 'minimap',
    get summary() {
      return canvas ? summarize(canvas) : undefined
    },
    install: (installedCanvas) => {
      canvas = installedCanvas
      return () => { canvas = undefined }
    },
  }
}
