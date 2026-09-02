import { expect, test } from '@playwright/test'

test('syncs an edit from Ada to Bea and exposes remote presence', async ({ page }) => {
  await page.goto('http://127.0.0.1:4181')

  await page.getByRole('button', { name: 'Ada: add rectangle' }).click()
  await expect(page.getByRole('status')).toHaveText('Ada operation delivered to Bea.')
  await expect(page.getByRole('list', { name: 'Bea canvas content' }).getByRole('listitem')).toHaveText(['Rectangle: ada-rectangle'])
  await expect(page.getByRole('list', { name: 'Active collaborators' })).toContainText('Ada')
  await expect(page.getByRole('list', { name: 'Operation log' })).toContainText('ada:1 · delivered')
})

test('delivers queued operations in order after reconnecting Bea', async ({ page }) => {
  await page.goto('http://127.0.0.1:4181')

  await page.getByRole('button', { name: 'Disconnect Bea' }).click()
  await page.getByRole('button', { name: 'Ada: add rectangle' }).click()
  await expect(page.getByRole('status')).toHaveText('Ada operation queued for Bea.')
  await page.getByRole('button', { name: 'Reconnect Bea' }).click()

  await expect(page.getByRole('status')).toHaveText('Queued operations delivered to Bea.')
  await expect(page.getByRole('list', { name: 'Bea canvas content' }).getByRole('listitem')).toHaveText(['Rectangle: ada-rectangle'])
})

test('converges on the newest snapshot when queued operations arrive out of order', async ({ page }) => {
  await page.goto('http://127.0.0.1:4181')

  await page.getByRole('button', { name: 'Disconnect Bea' }).click()
  await page.getByRole('button', { name: 'Ada: add rectangle' }).click()
  await page.getByRole('button', { name: 'Ada: recolor rectangle' }).click()
  await page.getByRole('button', { name: 'Deliver newest first' }).click()

  await expect(page.getByRole('status')).toHaveText('Newest queued operation delivered to Bea; stale snapshots were ignored.')
  await expect(page.getByRole('list', { name: 'Bea canvas content' }).getByRole('listitem')).toHaveAttribute('data-fill', '#1976f3')
})
