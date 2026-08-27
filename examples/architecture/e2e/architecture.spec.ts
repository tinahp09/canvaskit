import { expect, test } from '@playwright/test'

test('exports a service dependency graph from the labelled architecture canvas', async ({ page }) => {
  await page.goto('http://127.0.0.1:4179')

  await expect(page.getByRole('application', { name: 'Architecture canvas' })).toBeVisible()
  await page.getByRole('button', { name: 'Export architecture' }).click()
  const scene = JSON.parse(await page.getByLabel('Architecture JSON').inputValue())
  expect(scene.nodes.map((node: { id: string }) => node.id)).toEqual(['gateway', 'catalog', 'orders', 'database'])
  expect(scene.edges.map((edge: { sourceId: string; targetId: string }) => [edge.sourceId, edge.targetId])).toEqual([
    ['gateway', 'catalog'],
    ['gateway', 'orders'],
    ['orders', 'database'],
  ])
})

test('adds and imports services with keyboard selection available on the canvas', async ({ page }) => {
  await page.goto('http://127.0.0.1:4179')
  const canvas = page.getByRole('application', { name: 'Architecture canvas' })
  await canvas.focus()
  await expect(canvas).toHaveCSS('outline-style', 'solid')
  await page.keyboard.press('Control+A')
  await page.getByRole('button', { name: 'Add service' }).click()
  await page.getByRole('button', { name: 'Export architecture' }).click()
  await expect(page.getByLabel('Architecture JSON')).toHaveValue(/notifications/)
  await page.getByRole('button', { name: 'Import architecture' }).click()
  await expect(page.getByRole('status')).toHaveText('Architecture imported.')
})

test('keeps architecture export data in a labelled textarea after keyboard navigation', async ({ page }) => {
  await page.goto('http://127.0.0.1:4179')

  const canvas = page.getByRole('application', { name: 'Architecture canvas' })
  await canvas.focus()
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Architecture JSON')).toBeFocused()

  await page.getByRole('button', { name: 'Export architecture' }).click()
  await expect(page.getByRole('status')).toHaveText('Architecture exported.')
  await expect(page.getByLabel('Architecture JSON')).toHaveValue(/"version":2/)
})
