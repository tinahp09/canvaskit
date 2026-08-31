import { expect, test, type Page } from '@playwright/test'

interface PointerOptions {
  button?: number
  buttons?: number
  modifiers?: { shiftKey?: boolean; metaKey?: boolean; ctrlKey?: boolean }
}

async function dragInWorldSpace(page: Page, start: { x: number; y: number }, end: { x: number; y: number }, options: PointerOptions = {}) {
  const canvas = page.locator('canvas')
  await canvas.evaluate((element, { start, end, options }) => {
    const bounds = element.getBoundingClientRect()
    const toClient = (point: { x: number; y: number }) => ({
      clientX: bounds.left + point.x * bounds.width / element.width,
      clientY: bounds.top + point.y * bounds.height / element.height,
    })
    const button = options.button ?? 0
    const buttons = options.buttons ?? (button === 1 ? 4 : 1)
    element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button, buttons, ...options.modifiers, ...toClient(start) }))
    if (start.x !== end.x || start.y !== end.y) {
      element.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, button: -1, buttons, ...options.modifiers, ...toClient(end) }))
    }
    element.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button, buttons: 0, ...options.modifiers, ...toClient(end) }))
  }, { start, end, options })
}

async function exportScene(page: Page) {
  await page.getByRole('button', { name: 'Export scene' }).click()
  return JSON.parse(await page.getByTestId('scene-json').inputValue()) as {
    nodes: Array<{ id: string; position: { x: number; y: number } }>
    guides: Array<{ id: string; axis: string; position: number }>
    viewport: { x: number; y: number; zoom: number }
  }
}

async function exportNodeIds(page: Page) { return (await exportScene(page)).nodes.map((node) => node.id) }

function trackConsoleErrors(page: Page): () => void {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return () => expect(errors).toEqual([])
}

test('supports modifier selection and contain/intersect marquee through the workflow APIs', async ({ page }) => {
  const assertNoConsoleErrors = trackConsoleErrors(page)
  await page.goto('/')
  await dragInWorldSpace(page, { x: 195, y: 215 }, { x: 195, y: 215 })
  await dragInWorldSpace(page, { x: 475, y: 215 }, { x: 475, y: 215 }, { modifiers: { shiftKey: true } })
  await page.getByRole('button', { name: 'Duplicate' }).click()
  expect(await exportNodeIds(page)).toEqual(['webhook', 'request', 'database', 'webhook-copy', 'request-copy'])

  await page.goto('/')
  await dragInWorldSpace(page, { x: 100, y: 160 }, { x: 290, y: 270 })
  await dragInWorldSpace(page, { x: 350, y: 160 }, { x: 420, y: 270 }, { modifiers: { shiftKey: true } })
  await page.getByRole('button', { name: 'Duplicate' }).click()
  expect(await exportNodeIds(page)).toEqual(['webhook', 'request', 'database', 'webhook-copy', 'request-copy'])
  assertNoConsoleErrors()
})

test('toggles a hit node with the Cmd/Ctrl pointer modifier', async ({ page }) => {
  await page.goto('/')
  await dragInWorldSpace(page, { x: 195, y: 215 }, { x: 195, y: 215 })
  await dragInWorldSpace(page, { x: 195, y: 215 }, { x: 195, y: 215 }, { modifiers: { ctrlKey: true } })
  await page.getByRole('button', { name: 'Duplicate' }).click()
  expect(await exportNodeIds(page)).toEqual(['webhook', 'request', 'database'])

  await dragInWorldSpace(page, { x: 195, y: 215 }, { x: 195, y: 215 }, { modifiers: { ctrlKey: true } })
  await page.getByRole('button', { name: 'Duplicate' }).click()
  expect(await exportNodeIds(page)).toEqual(['webhook', 'request', 'database', 'webhook-copy'])
})

test('middle-pan only changes the viewport in backing-store coordinates', async ({ page }) => {
  await page.goto('/')
  await dragInWorldSpace(page, { x: 195, y: 215 }, { x: 195, y: 215 })
  await dragInWorldSpace(page, { x: 475, y: 215 }, { x: 475, y: 215 }, { modifiers: { shiftKey: true } })
  const before = await exportScene(page)

  await dragInWorldSpace(page, { x: 195, y: 215 }, { x: 235, y: 235 }, { button: 1, buttons: 4 })
  const afterPan = await exportScene(page)
  expect(afterPan.nodes).toEqual(before.nodes)
  expect(afterPan.viewport.x).toBeCloseTo(40)
  expect(afterPan.viewport.y).toBeCloseTo(20)
  expect(afterPan.viewport.zoom).toBe(1)
  await page.getByRole('button', { name: 'Undo' }).click()
  expect(await exportScene(page)).toEqual(afterPan)

  await page.getByRole('button', { name: 'Duplicate' }).click()
  expect(await exportNodeIds(page)).toEqual(['webhook', 'request', 'database', 'webhook-copy', 'request-copy'])
})

test('zooms around the backing-store wheel anchor', async ({ page }) => {
  await page.goto('/')
  const canvas = page.locator('canvas')
  const anchor = await canvas.evaluate((element) => {
    const bounds = element.getBoundingClientRect()
    const point = { x: bounds.left + 600 * bounds.width / element.width, y: bounds.top + 360 * bounds.height / element.height }
    const event = new WheelEvent('wheel', { bubbles: true, clientX: point.x, clientY: point.y, deltaY: -100 })
    element.dispatchEvent(event)
    return {
      x: (event.clientX - bounds.left) * element.width / bounds.width,
      y: (event.clientY - bounds.top) * element.height / bounds.height,
    }
  })
  const scene = await exportScene(page)
  const zoom = Math.exp(0.1)
  expect(scene.viewport.zoom).toBeCloseTo(zoom)
  expect(scene.viewport.x).toBeCloseTo(anchor.x - anchor.x * zoom)
  expect(scene.viewport.y).toBeCloseTo(anchor.y - anchor.y * zoom)
})

test('creates history-backed guides and lays selected nodes out through labelled controls', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Add vertical guide' }).click()
  expect((await exportScene(page)).guides).toEqual([{ id: 'guide-1', axis: 'vertical', position: 300 }])
  await page.getByRole('button', { name: 'Undo' }).click()
  expect((await exportScene(page)).guides).toEqual([])

  await dragInWorldSpace(page, { x: 195, y: 215 }, { x: 195, y: 215 })
  await dragInWorldSpace(page, { x: 475, y: 215 }, { x: 475, y: 215 }, { modifiers: { shiftKey: true } })
  await page.getByRole('combobox', { name: 'Layout direction' }).selectOption('grid')
  await page.getByRole('button', { name: 'Apply auto layout' }).click()
  const laidOut = await exportScene(page)
  expect(laidOut.nodes.slice(0, 2).map((node) => node.position)).toEqual([{ x: 80, y: 120 }, { x: 254, y: 120 }])
  await page.getByRole('button', { name: 'Undo' }).click()
  expect((await exportScene(page)).nodes.slice(0, 2).map((node) => node.position)).toEqual([{ x: 120, y: 180 }, { x: 400, y: 180 }])
})

test('uses internal keyboard clipboard, duplicate, cut, and undo without system clipboard access', async ({ page }) => {
  await page.goto('/')
  const canvas = page.getByRole('application', { name: 'CanvasKit example' })
  await canvas.focus()
  await dragInWorldSpace(page, { x: 195, y: 215 }, { x: 195, y: 215 })
  await page.keyboard.press('Control+C')
  await page.keyboard.press('Control+V')
  expect(await exportNodeIds(page)).toEqual(['webhook', 'request', 'database', 'webhook-copy'])
  await canvas.focus()
  await page.keyboard.press('Control+D')
  expect(await exportNodeIds(page)).toEqual(['webhook', 'request', 'database', 'webhook-copy', 'webhook-copy-copy'])
  await canvas.focus()
  await page.keyboard.press('Control+X')
  expect(await exportNodeIds(page)).toEqual(['webhook', 'request', 'database', 'webhook-copy'])
  await page.getByRole('button', { name: 'Undo' }).click()
  expect(await exportNodeIds(page)).toEqual(['webhook', 'request', 'database', 'webhook-copy', 'webhook-copy-copy'])
})
