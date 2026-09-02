import { expect, test } from '@playwright/test'

test('synchronizes an operation and reports presence through BroadcastChannel', async ({ page }) => {
  await page.goto('http://127.0.0.1:4185')
  await page.getByRole('button', { name: 'Ada: add rectangle' }).click()
  await expect(page.getByRole('status')).toHaveText('Ada operation delivered through BroadcastChannel.')
  await expect(page.getByRole('list', { name: 'Bea canvas content' })).toContainText('Rectangle: ada-rectangle')
  await expect(page.getByRole('list', { name: 'Active collaborators' })).toContainText('Ada')
})

test('reports unavailable BroadcastChannel without mutating either scene', async ({ page }) => {
  await page.goto('http://127.0.0.1:4185?transport=unavailable')
  await expect(page.getByRole('status')).toHaveText('BroadcastChannel is unavailable.')
  await expect(page.getByRole('list', { name: 'Ada canvas content' })).toBeEmpty()
  await expect(page.getByRole('list', { name: 'Bea canvas content' })).toBeEmpty()
})
