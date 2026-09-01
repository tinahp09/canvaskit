import { expect, test } from '@playwright/test'

test('shows the professional diagram editor and applies an inspector property', async ({ page }) => {
  await page.goto('http://127.0.0.1:4180')
  const canvas = page.getByRole('application', { name: 'Professional diagram canvas' })
  await expect(canvas).toBeVisible()
  const bounds = await canvas.boundingBox()
  if (!bounds) throw new Error('Expected diagram canvas bounds.')
  await page.mouse.click(bounds.x + bounds.width * 180 / 960, bounds.y + bounds.height * 260 / 620)
  await expect(page.getByRole('heading', { name: 'trigger' })).toBeVisible()
  await page.getByLabel('Fill').fill('#ff0000')
  await page.getByRole('button', { name: 'Apply fill' }).click()
  await expect(page.getByRole('status')).toHaveText('Fill applied.')
})

test('offers the connection command after additive diagram selection', async ({ page }) => {
  await page.goto('http://127.0.0.1:4180')
  const canvas = page.getByRole('application', { name: 'Professional diagram canvas' })
  const bounds = await canvas.boundingBox()
  if (!bounds) throw new Error('Expected diagram canvas bounds.')
  const point = (x: number, y: number) => ({ x: bounds.x + bounds.width * x / 960, y: bounds.y + bounds.height * y / 620 })

  await page.mouse.click(point(180, 260).x, point(180, 260).y)
  await page.keyboard.down('Shift')
  await page.mouse.click(point(450, 260).x, point(450, 260).y)
  await page.keyboard.up('Shift')
  await page.getByRole('button', { name: '⌘K Commands' }).click()

  await expect(page.getByRole('button', { name: /Connect selected flow/ })).toBeVisible()
})
