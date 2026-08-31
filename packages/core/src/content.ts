import type { Point, Size } from '@canvaskit/geometry'
import type { CanvasAsset, CanvasScene, ImageCrop, ImageFit } from './model.js'

export interface CreateImageInput { id: string; layerId?: string; assetId: string; position: Point; size: Size; fit?: ImageFit; crop?: ImageCrop }
export class ContentController {
  addAsset(scene: CanvasScene, asset: CanvasAsset): CanvasScene {
    if (scene.assets.some((item) => item.id === asset.id)) throw new Error(`An asset with id "${asset.id}" already exists.`)
    return { ...scene, assets: [...scene.assets, { ...asset }] }
  }
  removeAsset(scene: CanvasScene, id: string): CanvasScene {
    if (!scene.assets.some((asset) => asset.id === id)) throw new Error(`Unknown asset id: ${id}.`)
    if (scene.nodes.some((node) => node.type === 'image' && node.assetId === id)) throw new Error('Cannot remove an asset used by an image node.')
    return { ...scene, assets: scene.assets.filter((asset) => asset.id !== id) }
  }
  addImage(scene: CanvasScene, input: CreateImageInput): CanvasScene {
    if (scene.nodes.some((node) => node.id === input.id)) throw new Error(`A node with id "${input.id}" already exists.`)
    if (!scene.assets.some((asset) => asset.id === input.assetId)) throw new Error(`Unknown asset id: ${input.assetId}.`)
    const layerId = input.layerId ?? scene.layers[0]!.id
    if (!scene.layers.some((layer) => layer.id === layerId)) throw new Error(`Unknown layer id: ${layerId}.`)
    return { ...scene, nodes: [...scene.nodes, { id: input.id, layerId, type: 'image', assetId: input.assetId, position: input.position, size: input.size, fit: input.fit ?? 'contain', crop: input.crop ?? { x: 0, y: 0, width: 1, height: 1 } }] }
  }
  updateImage(scene: CanvasScene, id: string, patch: Partial<Pick<CreateImageInput, 'fit' | 'crop'>>): CanvasScene {
    const node = scene.nodes.find((item) => item.id === id)
    if (!node || node.type !== 'image') throw new Error(`Unknown image node id: ${id}.`)
    return { ...scene, nodes: scene.nodes.map((item) => item.id === id ? { ...item, ...patch } : item) }
  }
}
