import { expect, test } from '@playwright/test'

test('groups selected freeform shapes and exports the whiteboard', async ({ page }) => {
  await page.goto('http://127.0.0.1:4177')

  const canvas = page.getByRole('application', { name: 'Whiteboard canvas' })
  await canvas.focus()
  await expect(canvas).toBeFocused()
  await expect(canvas).toHaveCSS('outline-style', 'solid')
  await page.keyboard.press('Control+A')
  await page.getByRole('button', { name: 'Group selected shapes' }).click()
  await page.getByRole('button', { name: 'Export whiteboard' }).click()

  const scene = JSON.parse(await page.getByLabel('Whiteboard JSON').inputValue())
  expect(scene.groups).toEqual([{ id: 'idea-group', nodeIds: ['note', 'circle', 'caption'] }])
  await expect(page.getByRole('status')).toHaveText('Whiteboard exported.')
})

test('imports an exported whiteboard through labelled actions', async ({ page }) => {
  await page.goto('http://127.0.0.1:4177')
  await page.getByRole('button', { name: 'Export whiteboard' }).click()
  const exported = await page.getByLabel('Whiteboard JSON').inputValue()

  await page.getByLabel('Whiteboard JSON').fill(exported)
  await page.getByRole('button', { name: 'Import whiteboard' }).click()
  await expect(page.getByRole('status')).toHaveText('Whiteboard imported.')
})

test('keeps exported whiteboard data in a labelled text control during keyboard navigation', async ({ page }) => {
  await page.goto('http://127.0.0.1:4177')

  const canvas = page.getByRole('application', { name: 'Whiteboard canvas' })
  await canvas.focus()
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Whiteboard JSON')).toBeFocused()

  await page.getByRole('button', { name: 'Export whiteboard' }).click()
  await expect(page.getByRole('status')).toHaveText('Whiteboard exported.')
  await expect(page.getByLabel('Whiteboard JSON')).toHaveValue(/"version":6/)
})
