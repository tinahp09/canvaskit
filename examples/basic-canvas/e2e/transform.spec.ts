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

async function exportScene(page: Page) {
  await page.getByRole('button', { name: 'Export scene' }).click()
  return JSON.parse(await page.getByTestId('scene-json').inputValue()) as {
    nodes: Array<{ id: string; position: { x: number; y: number }; size?: { width: number; height: number } }>
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

  expect(node(await exportScene(page), 'webhook')).toMatchObject({
    position: { x: 120, y: 180 }, size: { width: 210, height: 110 },
  })
  assertNoConsoleErrors()
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

test('reports deferred persistent rotation without mutating the scene', async ({ page }) => {
  await page.goto('/')
  await dragInWorldSpace(page, { x: 195, y: 215 }, { x: 195, y: 215 })
  const before = await exportScene(page)
  await dragInWorldSpace(page, { x: 195, y: 156 }, { x: 240, y: 140 })

  await expect(page.getByRole('status')).toHaveText(/Persistent rotation is deferred/i)
  expect(await exportScene(page)).toEqual(before)
})
