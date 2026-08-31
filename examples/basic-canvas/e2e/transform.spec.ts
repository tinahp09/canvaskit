import { expect, test, type Page } from '@playwright/test'

async function dragInWorldSpace(page: Page, start: { x: number; y: number }, end: { x: number; y: number }, shiftKey = false) {
  const canvas = page.locator('canvas')
  await canvas.evaluate((element, { start, end, shiftKey }) => {
    const canvasElement = element as HTMLCanvasElement
    const bounds = canvasElement.getBoundingClientRect()
    const toClient = (point: { x: number; y: number }) => ({
      clientX: bounds.left + point.x * bounds.width / canvasElement.width,
      clientY: bounds.top + point.y * bounds.height / canvasElement.height,
    })
    element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, buttons: 1, shiftKey, ...toClient(start) }))
    if (start.x !== end.x || start.y !== end.y) {
      element.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, button: -1, buttons: 1, shiftKey, ...toClient(end) }))
    }
    element.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, buttons: 0, shiftKey, ...toClient(end) }))
  }, { start, end, shiftKey })
}

async function canvasClientPoint(page: Page, screen: { x: number; y: number }) {
  const bounds = await page.locator('canvas').boundingBox()
  if (!bounds) throw new Error('Canvas is not visible.')
  return { x: bounds.x + screen.x * bounds.width / 1200, y: bounds.y + screen.y * bounds.height / 720 }
}

async function dragWithMouse(page: Page, start: { x: number; y: number }, end: { x: number; y: number }) {
  const startPoint = await canvasClientPoint(page, start)
  const endPoint = await canvasClientPoint(page, end)
  await page.mouse.move(startPoint.x, startPoint.y)
  await page.mouse.down()
  await page.mouse.move(endPoint.x, endPoint.y)
  await page.mouse.up()
}

async function clickWithMouse(page: Page, screen: { x: number; y: number }) {
  const point = await canvasClientPoint(page, screen)
  await page.mouse.click(point.x, point.y)
}

async function exportScene(page: Page) {
  await page.getByRole('button', { name: 'Export scene' }).click()
  return JSON.parse(await page.getByTestId('scene-json').inputValue()) as {
    nodes: Array<{ id: string; position: { x: number; y: number }; size?: { width: number; height: number }; rotation?: number }>
  }
}

function node(scene: Awaited<ReturnType<typeof exportScene>>, id: string) {
  return scene.nodes.find((candidate) => candidate.id === id)!
}

function trackConsoleErrors(page: Page): () => void {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return () => expect(errors).toEqual([])
}

test('resizes the selected node only when dragging its overlay handle', async ({ page }) => {
  const assertNoConsoleErrors = trackConsoleErrors(page)
  await page.goto('/')
  await dragInWorldSpace(page, { x: 195, y: 215 }, { x: 195, y: 215 })
  await dragInWorldSpace(page, { x: 270, y: 250 }, { x: 330, y: 290 })

  const resized = node(await exportScene(page), 'webhook')
  expect(resized).toMatchObject({ position: { x: 120, y: 180 }, size: { width: 210 } })
  expect(resized.size?.height).toBeCloseTo(110, 10)
  assertNoConsoleErrors()
})

test('uses the visible east resize handle instead of the separate connection handle', async ({ page }) => {
  await page.goto('/')
  await clickWithMouse(page, { x: 195, y: 215 })
  await dragWithMouse(page, { x: 270, y: 215 }, { x: 330, y: 215 })

  expect(node(await exportScene(page), 'webhook')).toMatchObject({
    position: { x: 120, y: 180 }, size: { width: 210, height: 70 },
  })
})

test('commits a captured resize released outside the canvas so undo restores the scene', async ({ page }) => {
  await page.goto('/')
  await clickWithMouse(page, { x: 195, y: 215 })
  const canvas = page.locator('canvas')
  const bounds = await canvas.boundingBox()
  if (!bounds) throw new Error('Canvas is not visible.')
  const start = await canvasClientPoint(page, { x: 270, y: 250 })
  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  await page.mouse.move(bounds.x + bounds.width + 24, bounds.y + 250 * bounds.height / 720)
  await page.mouse.up()
  await page.getByRole('button', { name: 'Undo' }).click()

  expect(node(await exportScene(page), 'webhook')).toMatchObject({
    position: { x: 120, y: 180 }, size: { width: 150, height: 70 },
  })
})

test('uses a fixed screen-space resize hit target at high zoom', async ({ page }) => {
  await page.goto('/')
  const highZoomScene = {
    version: 2,
    nodes: [{ id: 'zoomed', type: 'rectangle', position: { x: 80, y: 20 }, size: { width: 50, height: 30 }, fill: '#7C7FF2' }],
    edges: [], groups: [], viewport: { x: 0, y: 0, zoom: 4 }, metadata: {},
  }
  await page.getByTestId('scene-json').fill(JSON.stringify(highZoomScene))
  await page.getByRole('button', { name: 'Import scene' }).click()
  await clickWithMouse(page, { x: 420, y: 140 })
  await clickWithMouse(page, { x: 540, y: 200 })
  expect(node(await exportScene(page), 'zoomed').size).toEqual({ width: 50, height: 30 })

  await clickWithMouse(page, { x: 420, y: 140 })
  await dragWithMouse(page, { x: 520, y: 140 }, { x: 560, y: 140 })
  const resized = node(await exportScene(page), 'zoomed').size!
  expect(resized.width).toBeCloseTo(60)
  expect(resized.height).toBeCloseTo(30)
})

test('uses Shift at resize pointerdown to preserve the selected aspect ratio', async ({ page }) => {
  await page.goto('/')
  await dragInWorldSpace(page, { x: 195, y: 215 }, { x: 195, y: 215 })
  await dragInWorldSpace(page, { x: 270, y: 250 }, { x: 330, y: 275 }, true)

  expect(node(await exportScene(page), 'webhook')).toMatchObject({
    position: { x: 120, y: 180 }, size: { width: 210, height: 98 },
  })
})

test('align controls are history-backed through undo and redo', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Align left' })).toBeVisible()
  await dragInWorldSpace(page, { x: 195, y: 215 }, { x: 195, y: 215 })
  await dragInWorldSpace(page, { x: 475, y: 215 }, { x: 475, y: 215 }, true)
  await page.getByRole('button', { name: 'Align center' }).click()
  expect(node(await exportScene(page), 'webhook').position.x).toBe(260)
  expect(node(await exportScene(page), 'request').position.x).toBe(260)

  await page.getByRole('button', { name: 'Undo' }).click()
  expect(node(await exportScene(page), 'webhook').position.x).toBe(120)
  expect(node(await exportScene(page), 'request').position.x).toBe(400)
  await page.getByRole('button', { name: 'Redo' }).click()
  expect(node(await exportScene(page), 'webhook').position.x).toBe(260)
})

test('distributes selected nodes through the public command control', async ({ page }) => {
  await page.goto('/')
  await dragInWorldSpace(page, { x: 475, y: 215 }, { x: 535, y: 215 })
  const canvas = page.getByRole('application', { name: 'CanvasKit example' })
  await canvas.focus()
  await page.keyboard.press('Control+A')
  await page.getByRole('button', { name: 'Distribute horizontal' }).click()

  expect(node(await exportScene(page), 'request').position.x).toBe(400)
})

test('persists a rotate-handle drag as one undoable scene change', async ({ page }) => {
  await page.goto('/')
  await dragInWorldSpace(page, { x: 195, y: 215 }, { x: 195, y: 215 })
  await dragInWorldSpace(page, { x: 195, y: 156 }, { x: 240, y: 140 })

  expect(node(await exportScene(page), 'webhook').rotation).toBeCloseTo(0.5404, 3)
  await page.getByRole('button', { name: 'Undo' }).click()
  expect(node(await exportScene(page), 'webhook').rotation).toBeUndefined()
  await page.getByRole('button', { name: 'Redo' }).click()
  expect(node(await exportScene(page), 'webhook').rotation).toBeCloseTo(0.5404, 3)
})
