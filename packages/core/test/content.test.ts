import { expect, it } from 'vitest'
import { addRectangle, CanvasKit, ContentController, createScene } from '../src/index.js'

const asset = { id: 'logo', kind: 'image' as const, source: 'https://cdn.test/logo.png', mimeType: 'image/png', width: 80, height: 40 }

it('keeps assets reusable while rejecting removal when an image node references one', () => {
  const content = new ContentController()
  const scene = content.addAsset(createScene(), asset)
  const withImage = content.addImage(scene, { id: 'logo-node', assetId: 'logo', position: { x: 20, y: 30 }, size: { width: 160, height: 80 } })

  expect(() => content.removeAsset(withImage, 'logo')).toThrow('Cannot remove an asset used by an image node.')
  expect(content.removeAsset({ ...withImage, nodes: [] }, 'logo').assets).toEqual([])
})

it('updates image crop and plain-text compatible rich runs immutably', () => {
  const content = new ContentController()
  let scene = content.addAsset(createScene(), asset)
  scene = content.addImage(scene, { id: 'logo-node', assetId: 'logo', position: { x: 20, y: 30 }, size: { width: 160, height: 80 } })
  scene = addRectangle(scene, { id: 'box', position: { x: 0, y: 0 }, size: { width: 1, height: 1 }, fill: '#fff' })
  const cropped = content.updateImage(scene, 'logo-node', { fit: 'cover', crop: { x: 0.1, y: 0, width: 0.8, height: 1 } })

  expect(cropped.nodes.find((node) => node.id === 'logo-node')).toMatchObject({ fit: 'cover', crop: { x: 0.1, y: 0, width: 0.8, height: 1 } })
})

it('records asset and image mutations in CanvasKit history', () => {
  const kit = new CanvasKit()
  expect(kit.addAsset(asset)).toBe(true)
  expect(kit.addImage({ id: 'logo-node', assetId: 'logo', position: { x: 20, y: 30 }, size: { width: 160, height: 80 } })).toBe(true)
  expect(kit.undo().nodes).toEqual([])
  expect(kit.undo().assets).toEqual([])
})
