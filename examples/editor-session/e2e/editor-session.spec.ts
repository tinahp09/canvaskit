import { expect, test } from '@playwright/test'

const url = 'http://127.0.0.1:4186'

test('switching tabs preserves each document scene independently', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'Add rectangle' }).click()
  await expect(page.getByRole('tabpanel')).toContainText('1 rectangle')

  await page.getByRole('tab', { name: 'Poster' }).click()
  await expect(page.getByRole('tabpanel')).toContainText('0 rectangles')

  await page.getByRole('tab', { name: 'Creative brief' }).click()
  await expect(page.getByRole('tabpanel')).toContainText('1 rectangle')
})

test('adding a rectangle marks only the active tab as unsaved', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'Add rectangle' }).click()

  await expect(page.getByLabel('Creative brief status')).toHaveText('Unsaved')
  await expect(page.getByLabel('Poster status')).toHaveText('Saved')
})

test('palette Select all affects only the active document', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('tab', { name: 'Poster' }).click()
  await page.getByRole('button', { name: 'Add rectangle' }).click()
  await page.getByRole('button', { name: 'Open command palette' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Select all' }).click()

  await expect(page.getByLabel('Poster selection')).toHaveText('1 selected')
  await page.getByRole('tab', { name: 'Creative brief' }).click()
  await expect(page.getByLabel('Creative brief selection')).toHaveText('0 selected')
})
