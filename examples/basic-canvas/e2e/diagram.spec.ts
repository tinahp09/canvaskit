import { expect, test, type Page } from '@playwright/test'

async function canvasPoint(page: Page, world: { x: number; y: number }) {
  const bounds = await page.locator('canvas').boundingBox()
  if (!bounds) throw new Error('Canvas is not visible.')
  return { x: bounds.x + world.x * bounds.width / 1200, y: bounds.y + world.y * bounds.height / 720 }
}

async function dragPort(page: Page, source: { x: number; y: number }, target: { x: number; y: number }) {
  const start = await canvasPoint(page, source)
  const end = await canvasPoint(page, target)
  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  await page.mouse.move(end.x, end.y)
  await page.mouse.up()
}

async function clickCanvas(page: Page, world: { x: number; y: number }) {
  const point = await canvasPoint(page, world)
  await page.mouse.click(point.x, point.y)
}

async function exportedScene(page: Page) {
  await page.getByRole('button', { name: 'Export scene' }).click()
  return JSON.parse(await page.getByTestId('scene-json').inputValue()) as {
    connectors: Array<{ id: string; sourceNodeId: string; sourcePortId: string; targetNodeId: string; targetPortId: string; routing: string; label?: string }>
    layers: Array<{ id: string; visible: boolean; locked: boolean }>
  }
}

function trackConsoleErrors(page: Page): () => void {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return () => expect(errors).toEqual([])
}

test('creates, selects, reconnects, rejects hidden or locked ports, and history-controls an orthogonal connector', async ({ page }) => {
  const assertNoConsoleErrors = trackConsoleErrors(page)
  await page.goto('/')

  await dragPort(page, { x: 195, y: 180 }, { x: 475, y: 180 })
  const created = await exportedScene(page)
  expect(created.connectors).toContainEqual(expect.objectContaining({
    sourceNodeId: 'webhook', sourcePortId: 'north', targetNodeId: 'request', targetPortId: 'north', routing: 'orthogonal', label: 'Diagram connection',
  }))

  await page.getByRole('button', { name: 'Export SVG' }).click()
  await expect(page.getByTestId('export-preview')).toHaveValue(/connector-label-/)

  // The first connector's deterministic top lane is an actual pointer target.
  await clickCanvas(page, { x: 335, y: 195 })
  await dragPort(page, { x: 400, y: 215 }, { x: 680, y: 215 })
  expect((await exportedScene(page)).connectors.find((connector) => connector.id === 'webhook-request')).toMatchObject({ targetNodeId: 'database', targetPortId: 'west' })

  await clickCanvas(page, { x: 755, y: 215 })
  await page.getByRole('button', { name: 'Add layer' }).click()
  await page.getByRole('button', { name: 'Move selected nodes to active layer' }).click()
  await page.getByRole('button', { name: 'Hide active layer' }).click()
  const beforeHiddenAttempt = await exportedScene(page)
  await dragPort(page, { x: 270, y: 215 }, { x: 680, y: 215 })
  expect(await exportedScene(page)).toEqual(beforeHiddenAttempt)

  await page.getByRole('button', { name: 'Undo' }).click()
  await page.getByRole('button', { name: 'Lock active layer' }).click()
  const beforeLockedAttempt = await exportedScene(page)
  await dragPort(page, { x: 270, y: 215 }, { x: 680, y: 215 })
  expect(await exportedScene(page)).toEqual(beforeLockedAttempt)

  await page.getByRole('button', { name: 'Undo' }).click()
  await clickCanvas(page, { x: 335, y: 195 })
  const beforeDelete = await exportedScene(page)
  await page.locator('canvas').focus()
  await page.keyboard.press('Delete')
  expect((await exportedScene(page)).connectors).toHaveLength(beforeDelete.connectors.length - 1)
  await page.getByRole('button', { name: 'Undo' }).click()
  expect(await exportedScene(page)).toEqual(beforeDelete)
  await page.getByRole('button', { name: 'Redo' }).click()
  expect((await exportedScene(page)).connectors).toHaveLength(beforeDelete.connectors.length - 1)
  assertNoConsoleErrors()
})
