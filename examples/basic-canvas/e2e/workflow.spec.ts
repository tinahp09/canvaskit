import { expect, test, type Page } from '@playwright/test'

async function dragInWorldSpace(page: Page, start: { x: number; y: number }, end: { x: number; y: number }, modifiers: { shiftKey?: boolean } = {}) {
  const canvas = page.locator('canvas')
  await canvas.evaluate((element, { start, end, modifiers }) => {
    const bounds = element.getBoundingClientRect()
    const toClient = (point: { x: number; y: number }) => ({
      clientX: bounds.left + point.x * bounds.width / element.width,
      clientY: bounds.top + point.y * bounds.height / element.height,
    })
    element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, buttons: 1, ...modifiers, ...toClient(start) }))
    element.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, button: 0, buttons: 1, ...modifiers, ...toClient(end) }))
    element.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, ...modifiers, ...toClient(end) }))
  }, { start, end, modifiers })
}

async function exportNodeIds(page: Page) {
  await page.getByRole('button', { name: 'Export scene' }).click()
  const scene = JSON.parse(await page.getByTestId('scene-json').inputValue()) as { nodes: Array<{ id: string }> }
  return scene.nodes.map((node) => node.id)
}

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
  await dragInWorldSpace(page, { x: 475, y: 215 }, { x: 475, y: 215 }, { shiftKey: true })
  await page.getByRole('button', { name: 'Duplicate' }).click()
  expect(await exportNodeIds(page)).toEqual(['webhook', 'request', 'database', 'webhook-copy', 'request-copy'])

  await page.goto('/')
  await dragInWorldSpace(page, { x: 100, y: 160 }, { x: 290, y: 270 })
  await dragInWorldSpace(page, { x: 350, y: 160 }, { x: 420, y: 270 }, { shiftKey: true })
  await page.getByRole('button', { name: 'Duplicate' }).click()
  expect(await exportNodeIds(page)).toEqual(['webhook', 'request', 'database', 'webhook-copy', 'request-copy'])
  assertNoConsoleErrors()
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
