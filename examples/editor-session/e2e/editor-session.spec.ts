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

test('saves and restores the active document through the V7 adapter', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'Add rectangle' }).click()
  await page.getByRole('button', { name: 'Save active' }).click()

  await expect(page.getByLabel('Creative brief persistence')).toHaveText('Saved')
  await page.getByRole('button', { name: 'Restore documents' }).click()
  await expect(page.getByRole('tabpanel')).toContainText('1 rectangle')
})

test('saves a local-first workspace manifest and restores its active tab', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('tab', { name: 'Poster' }).click()
  await page.getByRole('button', { name: 'Save workspace' }).click()
  await expect(page.getByLabel('Workspace recovery status')).toHaveText('Ready')
  await expect(page.getByLabel('Recent documents')).toContainText('Creative brief')
  await expect(page.getByLabel('Recent documents')).toContainText('Poster')

  await page.getByRole('tab', { name: 'Creative brief' }).click()
  await page.getByRole('button', { name: 'Restore previous workspace' }).click()
  await expect(page.getByRole('tab', { name: 'Poster' })).toHaveAttribute('aria-selected', 'true')
})

test('shows an adapter failure and retries the current document save', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'Simulate save failure' }).click()
  await page.getByRole('button', { name: 'Save active' }).click()

  await expect(page.getByLabel('Creative brief persistence')).toHaveText('Error')
  await page.getByRole('button', { name: 'Retry save' }).click()
  await expect(page.getByLabel('Creative brief persistence')).toHaveText('Saved')
})

test('autosaves a dirty document and exposes recovery actions', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'Simulate save failure' }).click()
  await page.getByRole('button', { name: 'Add rectangle' }).click()
  await expect(page.getByLabel('Autosave status')).toHaveText('Error')
  await page.getByRole('button', { name: 'Recover changes' }).click()
  await expect(page.getByRole('status')).toContainText('Recovered')
  await page.getByRole('button', { name: 'Discard recovery' }).click()
  await expect(page.getByRole('status')).toContainText('discarded')
})

test('queues a local document and synchronizes only after an explicit host action', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'Add rectangle' }).click()
  await page.getByRole('button', { name: 'Queue for sync' }).click()
  await expect(page.getByRole('status')).toContainText('queued')
  await page.getByRole('button', { name: 'Sync now' }).click()
  await expect(page.getByRole('status')).toContainText('synchronized')
})
