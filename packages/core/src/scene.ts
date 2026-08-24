import type { CanvasNode, CanvasScene, CreateCircleInput, CreateRectangleInput, CreateTextInput } from './model.js'

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
function addNode(scene: CanvasScene, node: CanvasNode): CanvasScene {
  if (scene.nodes.some((item) => item.id === node.id)) throw new Error(`A node with id "${node.id}" already exists.`)
  return { ...scene, nodes: [...scene.nodes, node] }
}
export function addCircle(scene: CanvasScene, input: CreateCircleInput): CanvasScene { return addNode(scene, { ...input, type: 'circle' }) }
export function addText(scene: CanvasScene, input: CreateTextInput): CanvasScene { return addNode(scene, { ...input, type: 'text' }) }
