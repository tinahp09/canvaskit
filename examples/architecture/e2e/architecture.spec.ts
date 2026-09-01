import { expect, test } from '@playwright/test'

test('exports a service dependency graph from the labelled architecture canvas', async ({ page }) => {
  await page.goto('http://127.0.0.1:4179')

  await expect(page.getByRole('application', { name: 'Architecture canvas' })).toBeVisible()
  await page.getByRole('button', { name: 'Export architecture' }).click()
  const scene = JSON.parse(await page.getByLabel('Architecture JSON').inputValue())
  expect(scene.nodes.filter((node: { type: string }) => node.type === 'rectangle').map((node: { id: string }) => node.id)).toEqual(['gateway', 'catalog', 'orders', 'database'])
  expect(scene.nodes.filter((node: { type: string }) => node.type === 'text').map((node: { text: string }) => node.text)).toEqual(['Gateway', 'Catalog', 'Orders', 'Database'])
  expect(scene.connectors.map((connector: { sourceNodeId: string; targetNodeId: string }) => [connector.sourceNodeId, connector.targetNodeId])).toEqual([
    ['gateway', 'catalog'],
    ['gateway', 'orders'],
    ['orders', 'database'],
  ])
})

test('renders service names visibly and in the architecture canvas description', async ({ page }) => {
  await page.goto('http://127.0.0.1:4179')

  const services = page.getByRole('list', { name: 'Services on architecture canvas' })
  await expect(services).toBeVisible()
  await expect(services.getByRole('listitem')).toHaveText(['Gateway', 'Catalog', 'Orders', 'Database'])
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

test('connects two services selected with an additive pointer gesture', async ({ page }) => {
  await page.goto('http://127.0.0.1:4179')

  const canvas = page.getByRole('application', { name: 'Architecture canvas' })
  const bounds = await canvas.boundingBox()
  if (!bounds) throw new Error('Expected architecture canvas bounds.')
  await page.mouse.click(bounds.x + bounds.width * 450 / 1160, bounds.y + bounds.height * 175 / 560)
  await page.keyboard.down('Shift')
  await page.mouse.click(bounds.x + bounds.width * 800 / 1160, bounds.y + bounds.height * 390 / 560)
  await page.keyboard.up('Shift')
  await page.getByRole('button', { name: 'Connect selected services' }).click()
  await expect(page.getByRole('status')).toHaveText('Service dependency added.')

  await page.getByRole('button', { name: 'Export architecture' }).click()
  const scene = JSON.parse(await page.getByLabel('Architecture JSON').inputValue())
  expect(scene.connectors).toContainEqual(expect.objectContaining({ sourceNodeId: 'catalog', targetNodeId: 'database' }))
})

test('keeps architecture export data in a labelled textarea after keyboard navigation', async ({ page }) => {
  await page.goto('http://127.0.0.1:4179')

  const canvas = page.getByRole('application', { name: 'Architecture canvas' })
  await canvas.focus()
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Architecture JSON')).toBeFocused()

  await page.getByRole('button', { name: 'Export architecture' }).click()
  await expect(page.getByRole('status')).toHaveText('Architecture exported.')
  await expect(page.getByLabel('Architecture JSON')).toHaveValue(/"version":7/)
})
