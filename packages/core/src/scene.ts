import type { CanvasScene, CreateRectangleInput } from './model.js'

export function createScene(): CanvasScene {
  return {
    version: 1,
    nodes: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    metadata: {},
  }
}

export function addRectangle(scene: CanvasScene, input: CreateRectangleInput): CanvasScene {
  if (scene.nodes.some((node) => node.id === input.id)) {
    throw new Error(`A node with id "${input.id}" already exists.`)
  }

  return {
    ...scene,
    nodes: [...scene.nodes, { ...input, type: 'rectangle' }],
  }
}
