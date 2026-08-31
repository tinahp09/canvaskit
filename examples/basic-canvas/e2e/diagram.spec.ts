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

async function dispatchPointer(page: Page, type: 'pointerdown' | 'pointerup' | 'pointercancel', world: { x: number; y: number }) {
  await page.locator('canvas').evaluate((element, { type, world }) => {
    const canvas = element as HTMLCanvasElement
    const bounds = canvas.getBoundingClientRect()
    canvas.dispatchEvent(new PointerEvent(type, {
      bubbles: true, button: 0, buttons: type === 'pointerdown' ? 1 : 0,
      clientX: bounds.left + world.x * bounds.width / canvas.width,
      clientY: bounds.top + world.y * bounds.height / canvas.height,
    }))
  }, { type, world })
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
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
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
  await expect(page.getByTestId('export-preview')).toHaveValue(/marker-end="url\(#arrowhead\)"/)
  await expect(page.getByTestId('export-preview')).toHaveValue(/Webhook request/)
  await expect(page.getByTestId('export-preview')).toHaveValue(/<path id="connector-webhook-request" d="M 270 215 L 290 215 L 290 195 L 380 195 L 380 215 L 400 215"/)

  // The first connector's deterministic top lane is an actual pointer target.
  await clickCanvas(page, { x: 335, y: 195 })
  await expect.poll(async () => page.locator('canvas').evaluate((canvas) => {
    const context = canvas.getContext('2d')!
    return [...context.getImageData(335, 195, 1, 1).data]
  })).toEqual([37, 99, 235, 255])
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

test('assigns an overlapping port drag to the visually frontmost layer node', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('scene-json').fill(JSON.stringify({
    version: 4,
    layers: [
      { id: 'lower', name: 'Lower', visible: true, locked: false },
      { id: 'upper', name: 'Upper', visible: true, locked: false },
      { id: 'target-layer', name: 'Target', visible: true, locked: false },
    ],
    nodes: [
      { id: 'lower-node', layerId: 'lower', type: 'rectangle', position: { x: 100, y: 100 }, size: { width: 100, height: 80 }, fill: '#f00' },
      { id: 'upper-node', layerId: 'upper', type: 'rectangle', position: { x: 100, y: 100 }, size: { width: 100, height: 80 }, fill: '#00f' },
      { id: 'target', layerId: 'target-layer', type: 'rectangle', position: { x: 300, y: 100 }, size: { width: 100, height: 80 }, fill: '#0f0' },
    ], connectors: [], groups: [], viewport: { x: 0, y: 0, zoom: 1 }, metadata: {},
  }))
  await page.getByRole('button', { name: 'Import scene' }).click()
  await dragPort(page, { x: 200, y: 140 }, { x: 300, y: 140 })

  expect((await exportedScene(page)).connectors).toEqual([expect.objectContaining({ sourceNodeId: 'upper-node', sourcePortId: 'east', targetNodeId: 'target', targetPortId: 'west' })])
})

test('aborts connector creation and reconnection on pointer cancellation without adding history', async ({ page }) => {
  await page.goto('/')
  const initial = await exportedScene(page)

  await dispatchPointer(page, 'pointerdown', { x: 195, y: 180 })
  await dispatchPointer(page, 'pointercancel', { x: 475, y: 180 })
  await dispatchPointer(page, 'pointerup', { x: 475, y: 180 })
  expect(await exportedScene(page)).toEqual(initial)

  await clickCanvas(page, { x: 335, y: 195 })
  await dispatchPointer(page, 'pointerdown', { x: 400, y: 215 })
  await dispatchPointer(page, 'pointercancel', { x: 680, y: 215 })
  await dispatchPointer(page, 'pointerup', { x: 680, y: 215 })
  expect(await exportedScene(page)).toEqual(initial)
})

test('offers keyboard and screen-reader operable connector creation, selection, reconnection, cancellation, and deletion', async ({ page }) => {
  await page.goto('/')
  const source = page.getByRole('combobox', { name: 'Source port' })
  const target = page.getByRole('combobox', { name: 'Target port' })
  const selected = page.getByRole('combobox', { name: 'Selected connector' })
  await expect(source).toContainText('webhook — east')
  await source.selectOption({ label: 'webhook — east' })
  await target.selectOption({ label: 'database — west' })
  await page.getByRole('button', { name: 'Create connector' }).click()
  await expect(selected).toHaveValue('connector-1')
  expect((await exportedScene(page)).connectors).toContainEqual(expect.objectContaining({ id: 'connector-1', sourceNodeId: 'webhook', targetNodeId: 'database' }))

  await target.selectOption({ label: 'request — west' })
  await page.getByRole('button', { name: 'Retarget selected connector' }).click()
  expect((await exportedScene(page)).connectors.find((connector) => connector.id === 'connector-1')).toMatchObject({ targetNodeId: 'request', targetPortId: 'west' })

  await page.getByRole('button', { name: 'Cancel connector interaction' }).click()
  await selected.selectOption('connector-1')
  await page.locator('canvas').focus()
  await page.keyboard.press('Delete')
  expect((await exportedScene(page)).connectors.some((connector) => connector.id === 'connector-1')).toBe(false)
})
