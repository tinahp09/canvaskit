import { expect, test } from '@playwright/test'

test('loads 10,000 nodes and updates the visible count after panning', async ({ page }) => {
  await page.goto('http://127.0.0.1:4176')

  await expect(page.getByTestId('loaded-node-count')).toHaveText('10,000')
  const visibleCount = page.getByTestId('visible-node-count')
  const renderedVisibleCount = page.getByTestId('rendered-visible-node-count')
  const initialVisibleCount = Number(await visibleCount.textContent())
  expect(initialVisibleCount).toBeGreaterThan(0)
  await expect(renderedVisibleCount).toHaveText(String(initialVisibleCount))

  for (let click = 0; click < 10; click++) await page.getByRole('button', { name: 'Pan right' }).click()

  await expect(visibleCount).toHaveText('0')
  await expect(renderedVisibleCount).toHaveText('0')

  await page.getByRole('button', { name: 'Reset view' }).click()
  await page.getByRole('button', { name: 'Zoom in' }).click()
  await expect.poll(() => visibleCount.textContent()).not.toBe(String(initialVisibleCount))
})

test('provides labelled, focus-visible keyboard navigation to performance controls', async ({ page }) => {
  await page.goto('http://127.0.0.1:4176')

  const canvas = page.getByRole('application', { name: '10,000 node canvas' })
  await canvas.focus()
  await expect(canvas).toBeFocused()
  await expect(canvas).toHaveCSS('outline-style', 'solid')

  await page.keyboard.press('Shift+Tab')
  await expect(page.getByRole('button', { name: 'Reset view' })).toBeFocused()
  await expect(page.getByRole('status')).toContainText('use the controls')
})
