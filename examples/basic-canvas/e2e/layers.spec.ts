import { expect, test, type Page } from '@playwright/test'

async function canvasPoint(page: Page, world: { x: number; y: number }) {
  const bounds = await page.locator('canvas').boundingBox()
  if (!bounds) throw new Error('Canvas is not visible.')
  return { x: bounds.x + world.x * bounds.width / 1200, y: bounds.y + world.y * bounds.height / 720 }
}

async function clickCanvas(page: Page, world: { x: number; y: number }) {
  const point = await canvasPoint(page, world)
  await page.mouse.click(point.x, point.y)
}

async function dragCanvas(page: Page, start: { x: number; y: number }, end: { x: number; y: number }) {
  const from = await canvasPoint(page, start)
  const to = await canvasPoint(page, end)
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(to.x, to.y)
  await page.mouse.up()
}

async function exportScene(page: Page) {
  await page.getByRole('button', { name: 'Export scene' }).click()
  return JSON.parse(await page.getByTestId('scene-json').inputValue()) as {
    nodes: Array<{ id: string; layerId: string; position: { x: number; y: number } }>
    groups: Array<{ id: string; nodeIds: string[] }>
    layers: Array<{ id: string; visible: boolean; locked: boolean }>
  }
}

function node(scene: Awaited<ReturnType<typeof exportScene>>, id: string) {
  const result = scene.nodes.find((candidate) => candidate.id === id)
  if (!result) throw new Error(`Missing node ${id}.`)
  return result
}

test('hides a layer from real pointer selection and restores it through history', async ({ page }) => {
  await page.goto('/')
  const hideLayer = page.getByRole('button', { name: 'Hide active layer' })
  await expect(hideLayer).toBeVisible({ timeout: 1_000 })
  await hideLayer.click()

  await clickCanvas(page, { x: 195, y: 215 })
  await page.getByRole('button', { name: 'Duplicate' }).click()
  expect((await exportScene(page)).nodes.map((candidate) => candidate.id)).toEqual(['webhook', 'request', 'database'])

  await page.getByRole('button', { name: 'Undo' }).click()
  await page.getByRole('button', { name: 'Redo' }).click()
  await clickCanvas(page, { x: 195, y: 215 })
  await page.getByRole('button', { name: 'Duplicate' }).click()
  expect((await exportScene(page)).nodes.map((candidate) => candidate.id)).toEqual(['webhook', 'request', 'database'])

  await page.getByRole('button', { name: 'Undo' }).click()
  await clickCanvas(page, { x: 195, y: 215 })
  await page.getByRole('button', { name: 'Duplicate' }).click()
  expect((await exportScene(page)).nodes.map((candidate) => candidate.id)).toEqual(['webhook', 'request', 'database', 'webhook-copy'])
})

test('prevents locked-layer pointer drags and restores mutations through undo and redo', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('checkbox', { name: 'Snap to grid' }).uncheck()
  await page.getByRole('button', { name: 'Lock active layer' }).click()

  await dragCanvas(page, { x: 195, y: 215 }, { x: 235, y: 245 })
  expect(node(await exportScene(page), 'webhook').position).toEqual({ x: 120, y: 180 })

  await page.getByRole('button', { name: 'Undo' }).click()
  await dragCanvas(page, { x: 195, y: 215 }, { x: 235, y: 245 })
  expect(node(await exportScene(page), 'webhook').position).toMatchObject({ y: 210 })
  expect(node(await exportScene(page), 'webhook').position.x).toBeCloseTo(160)

  await page.getByRole('button', { name: 'Undo' }).click()
  expect(node(await exportScene(page), 'webhook').position).toEqual({ x: 120, y: 180 })
  await page.getByRole('button', { name: 'Redo' }).click()
  expect(node(await exportScene(page), 'webhook').position).toMatchObject({ y: 210 })
  expect(node(await exportScene(page), 'webhook').position.x).toBeCloseTo(160)
})

test('reorders rendered layers and groups selected nodes through accessible controls', async ({ page }) => {
  await page.goto('/')
  const scene = {
    version: 3,
    layers: [
      { id: 'layer-default', name: 'Default', visible: true, locked: false },
      { id: 'bottom', name: 'Bottom', visible: true, locked: false },
      { id: 'top', name: 'Top', visible: true, locked: false },
    ],
    nodes: [
      { id: 'top-node', layerId: 'top', type: 'rectangle', position: { x: 100, y: 100 }, size: { width: 100, height: 80 }, fill: '#0000ff' },
      { id: 'bottom-node', layerId: 'bottom', type: 'rectangle', position: { x: 100, y: 100 }, size: { width: 100, height: 80 }, fill: '#ff0000' },
    ], edges: [], groups: [], viewport: { x: 0, y: 0, zoom: 1 }, metadata: {},
  }
  await page.getByTestId('scene-json').fill(JSON.stringify(scene))
  await page.getByRole('button', { name: 'Import scene' }).click()
  const pixel = async () => page.locator('canvas').evaluate((element) => {
    const context = (element as HTMLCanvasElement).getContext('2d')!
    return [...context.getImageData(150, 140, 1, 1).data]
  })
  expect(await pixel()).toEqual([0, 0, 255, 255])

  await page.getByRole('combobox', { name: 'Active layer' }).selectOption('top')
  await page.getByRole('button', { name: 'Move active layer backward' }).click()
  expect((await exportScene(page)).layers.map((layer) => layer.id)).toEqual(['layer-default', 'top', 'bottom'])
  expect(await pixel()).toEqual([255, 0, 0, 255])

  await clickCanvas(page, { x: 150, y: 140 })
  await page.getByRole('button', { name: 'Add layer' }).click()
  await page.getByRole('button', { name: 'Move selected nodes to active layer' }).click()
  const moved = await exportScene(page)
  expect(moved.layers.map((layer) => layer.id)).toEqual(['layer-default', 'top', 'bottom', 'layer-1'])
  expect(node(moved, 'bottom-node').layerId).toBe('layer-1')
  await page.getByRole('button', { name: 'Group selected nodes', exact: true }).click()
  expect((await exportScene(page)).groups).toEqual([{ id: 'group-1', nodeIds: ['bottom-node'], visible: true, locked: false }])
  await page.getByRole('button', { name: 'Ungroup selected nodes', exact: true }).click()
  expect((await exportScene(page)).groups).toEqual([])
  await page.getByRole('button', { name: 'Undo' }).click()
  expect((await exportScene(page)).groups).toEqual([{ id: 'group-1', nodeIds: ['bottom-node'], visible: true, locked: false }])
  await page.getByRole('button', { name: 'Redo' }).click()
  expect((await exportScene(page)).groups).toEqual([])
})
