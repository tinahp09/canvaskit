import { expect, test } from '@playwright/test'

test('edits, saves, and loads the Phase 2 scene', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('CanvasKit Phase 2')).toBeVisible()
  await page.getByRole('button', { name: 'Add circle' }).click()
  await page.getByRole('button', { name: 'Save scene' }).click()
  await expect(page.getByTestId('scene-json')).toHaveValue(/circle/)
  await page.getByRole('button', { name: 'Load scene' }).click()
})
