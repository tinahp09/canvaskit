import { expect, test } from '@playwright/test'

test('shows rectangle and text entity nodes with relationship edges', async ({ page }) => {
  await page.goto('http://127.0.0.1:4178')

  await expect(page.getByRole('application', { name: 'ERD canvas' })).toBeVisible()
  await page.getByRole('button', { name: 'Export ERD' }).click()
  const scene = JSON.parse(await page.getByLabel('ERD JSON').inputValue())
  expect(scene.nodes.filter((node: { type: string }) => node.type === 'rectangle')).toHaveLength(3)
  expect(scene.nodes.filter((node: { type: string }) => node.type === 'text')).toHaveLength(3)
  expect(scene.edges.map((edge: { sourceId: string; targetId: string }) => [edge.sourceId, edge.targetId])).toEqual([
    ['customers', 'orders'],
    ['orders', 'order-items'],
  ])
})

test('adds an entity and imports the ERD through accessible controls', async ({ page }) => {
  await page.goto('http://127.0.0.1:4178')
  await page.getByRole('button', { name: 'Add entity' }).click()
  await page.getByRole('button', { name: 'Export ERD' }).click()
  await expect(page.getByLabel('ERD JSON')).toHaveValue(/payments/)
  await page.getByRole('button', { name: 'Import ERD' }).click()
  await expect(page.getByRole('status')).toHaveText('ERD imported.')
})

test('exposes focus-visible keyboard navigation and live ERD export feedback', async ({ page }) => {
  await page.goto('http://127.0.0.1:4178')

  const canvas = page.getByRole('application', { name: 'ERD canvas' })
  await canvas.focus()
  await expect(canvas).toBeFocused()
  await expect(canvas).toHaveCSS('outline-style', 'solid')
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('ERD JSON')).toBeFocused()

  await page.getByRole('button', { name: 'Export ERD' }).click()
  await expect(page.getByRole('status')).toHaveText('ERD exported.')
  await expect(page.getByLabel('ERD JSON')).toHaveValue(/"version":2/)
})
