import { expect, test } from '@playwright/test'

test('loads 10,000 nodes and updates the visible count after panning', async ({ page }) => {
  await page.goto('http://127.0.0.1:4176')

  await expect(page.getByTestId('loaded-node-count')).toHaveText('10,000')
  const visibleCount = page.getByTestId('visible-node-count')
  const initialVisibleCount = Number(await visibleCount.textContent())
  expect(initialVisibleCount).toBeGreaterThan(0)

  for (let click = 0; click < 10; click++) await page.getByRole('button', { name: 'Pan right' }).click()

  await expect(visibleCount).toHaveText('0')
})
