import { expect, test } from '@playwright/test'

test('edits, saves, and loads the Phase 3 workflow', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('CanvasKit Phase 3 — Workflow')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Connect selected' })).toBeVisible()
  await page.getByRole('button', { name: 'Add circle' }).click()
  await page.getByRole('button', { name: 'Save scene' }).click()
  await expect(page.getByTestId('scene-json')).toHaveValue(/circle/)
  await page.getByRole('button', { name: 'Load scene' }).click()
})

test('connects nodes by dragging from a connection handle', async ({ page }) => {
  await page.goto('/')
  const canvas = page.locator('canvas')

  await canvas.evaluate((element) => {
    const canvasElement = element as HTMLCanvasElement
    const bounds = canvasElement.getBoundingClientRect()
    const toClient = (point: { x: number; y: number }) => ({
      clientX: bounds.left + point.x * bounds.width / canvasElement.width,
      clientY: bounds.top + point.y * bounds.height / canvasElement.height,
    })
    canvasElement.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, ...toClient({ x: 195, y: 215 }) }))
    canvasElement.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, ...toClient({ x: 195, y: 215 }) }))
    canvasElement.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, buttons: 1, ...toClient({ x: 270, y: 215 }) }))
    canvasElement.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, ...toClient({ x: 475, y: 215 }) }))
  })

  await page.getByRole('button', { name: 'Save scene' }).click()
  await expect(page.getByTestId('scene-json')).toHaveValue(/\"id\":\"edge-3\"/)
})
