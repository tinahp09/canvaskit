import { expect, test, type Page } from '@playwright/test'

async function selectWorkflowNode(page: Page) {
  const canvas = page.locator('canvas')
  await canvas.evaluate((element: HTMLCanvasElement) => {
    const bounds = element.getBoundingClientRect()
    const toClient = (point: { x: number; y: number }) => ({
      clientX: bounds.left + point.x * bounds.width / element.width,
      clientY: bounds.top + point.y * bounds.height / element.height,
    })
    const point = toClient({ x: 195, y: 215 })
    element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, buttons: 1, ...point }))
    element.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, ...point }))
  })
}

async function exportScene(page: Page) {
  await page.getByRole('button', { name: 'Export scene' }).click()
  return JSON.parse(await page.getByTestId('scene-json').inputValue())
}

test('duplicates, copies, pastes, undoes, and redoes a selected workflow node', async ({ page }) => {
  await page.goto('/')
  await selectWorkflowNode(page)

  await page.getByRole('button', { name: 'Duplicate' }).click()
  const duplicated = await exportScene(page)
  expect(duplicated.nodes.map((node: { id: string }) => node.id)).toEqual(['webhook', 'request', 'database', 'webhook-copy'])

  await page.getByRole('button', { name: 'Copy' }).click()
  await page.getByRole('button', { name: 'Paste' }).click()
  const pasted = await exportScene(page)
  expect(pasted.nodes.map((node: { id: string }) => node.id)).toEqual(['webhook', 'request', 'database', 'webhook-copy', 'webhook-copy-copy'])

  await page.getByRole('button', { name: 'Undo' }).click()
  expect((await exportScene(page)).nodes.map((node: { id: string }) => node.id)).toEqual(duplicated.nodes.map((node: { id: string }) => node.id))

  await page.getByRole('button', { name: 'Redo' }).click()
  expect((await exportScene(page)).nodes.map((node: { id: string }) => node.id)).toEqual(pasted.nodes.map((node: { id: string }) => node.id))
})

test('clears history after importing a different version 2 scene', async ({ page }) => {
  await page.goto('/')
  await selectWorkflowNode(page)
  await page.getByRole('button', { name: 'Duplicate' }).click()
  expect((await exportScene(page)).nodes).toHaveLength(4)

  const importedScene = {
    version: 2,
    nodes: [{ id: 'imported-node', type: 'rectangle', position: { x: 20, y: 30 }, size: { width: 160, height: 80 }, fill: '#F97316' }],
    edges: [],
    groups: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    metadata: { source: 'durable-editing-test' },
  }
  const migratedScene = {
    version: 6,
    nodes: [{ id: 'imported-node', layerId: 'layer-default', type: 'rectangle', position: { x: 20, y: 30 }, size: { width: 160, height: 80 }, fill: '#F97316' }],
    connectors: [],
    groups: [],
    layers: [{ id: 'layer-default', name: 'Default', visible: true, locked: false }],
    guides: [],
    assets: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    metadata: { source: 'durable-editing-test' },
  }
  await page.getByTestId('scene-json').fill(JSON.stringify(importedScene))
  await page.getByRole('button', { name: 'Import scene' }).click()
  await expect(page.locator('#scene-status')).toHaveText('Scene imported.')
  expect(await exportScene(page)).toEqual(migratedScene)

  await page.getByRole('button', { name: 'Undo' }).click()
  expect(await exportScene(page)).toEqual(migratedScene)

  await page.getByRole('button', { name: 'Redo' }).click()
  expect(await exportScene(page)).toEqual(migratedScene)
})

test('edits and exports the Diagram Toolkit workflow', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('CanvasKit V2.7 — Plugin Platform')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Connect selected' })).toBeVisible()
  await page.getByRole('button', { name: 'Add circle' }).click()
  await page.getByRole('button', { name: 'Export scene' }).click()
  await expect(page.getByTestId('scene-json')).toHaveValue(/circle/)
  await page.getByRole('button', { name: 'Import scene' }).click()
  await expect(page.locator('#scene-status')).toHaveText('Scene imported.')
})

test('connects nodes by dragging from a connection handle', async ({ page }) => {
  await page.goto('/')
  const canvas = page.locator('canvas')

  await canvas.evaluate((element) => {
    const canvasElement = element as HTMLCanvasElement
    const bounds = canvasElement.getBoundingClientRect()
    const toClient = (point: { x: number; y: number }) => ({
      clientX: bounds.left + point.x * bounds.width / canvasElement.width,
      clientY: bounds.top + point.y * bounds.height / canvasElement.height,
    })
    canvasElement.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, ...toClient({ x: 195, y: 215 }) }))
    canvasElement.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, ...toClient({ x: 195, y: 215 }) }))
    canvasElement.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, buttons: 1, ...toClient({ x: 286, y: 215 }) }))
    canvasElement.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, ...toClient({ x: 475, y: 215 }) }))
  })

  await page.getByRole('button', { name: 'Export scene' }).click()
  await expect(page.getByTestId('scene-json')).toHaveValue(/\"id\":\"connector-1\"/)
})

test('shows import errors without changing the scene', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Export scene' }).click()
  const before = await page.getByTestId('scene-json').inputValue()
  await page.getByTestId('scene-json').fill('{')
  await page.getByRole('button', { name: 'Import scene' }).click()
  await expect(page.locator('#scene-status')).toHaveText(/Import failed:/)
  await page.getByRole('button', { name: 'Export scene' }).click()
  await expect(page.getByTestId('scene-json')).toHaveValue(before)
})

test('exports escaped SVG and PNG data through accessible export controls', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('checkbox', { name: 'Show grid' })).toBeChecked()
  await expect(page.getByRole('checkbox', { name: 'Snap to grid' })).toBeChecked()

  const sceneWithMarkupText = {
    version: 2,
    nodes: [{ id: 'label', type: 'text', position: { x: 20, y: 30 }, text: '<script>alert(1)</script>', fontSize: 20, fill: '#F4F6F8' }],
    edges: [],
    groups: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    metadata: {},
  }
  await page.getByTestId('scene-json').fill(JSON.stringify(sceneWithMarkupText))
  await page.getByRole('button', { name: 'Import scene' }).click()

  await page.getByRole('button', { name: 'Export SVG' }).click()
  await expect(page.getByTestId('export-preview')).toHaveValue(/&lt;script&gt;alert\(1\)&lt;\/script&gt;/)
  await expect(page.locator('#scene-status')).toHaveText('SVG exported.')

  await page.getByRole('button', { name: 'Export PNG' }).click()
  await expect(page.getByTestId('export-preview')).toHaveValue(/^data:image\/png;base64,/)
  await expect(page.locator('#scene-status')).toHaveText('PNG exported.')
})

test('supports keyboard focus and labelled navigation through the editor workflow', async ({ page }) => {
  await page.goto('/')

  const canvas = page.getByRole('application', { name: 'CanvasKit example' })
  await canvas.focus()
  await expect(canvas).toBeFocused()
  await expect(canvas).toHaveCSS('outline-style', 'solid')

  await page.keyboard.press('Control+A')
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Scene JSON')).toBeFocused()
  await expect(page.getByLabel('Export preview')).toHaveAttribute('readonly', '')

  await page.getByRole('button', { name: 'Export scene' }).click()
  await expect(page.locator('#scene-status')).toHaveText('Scene exported.')
})

test('adds an image asset and image node through labelled controls with undo', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Image asset URL' }).fill('https://cdn.test/logo.png')
  await page.getByRole('button', { name: 'Add image asset' }).click()
  await page.getByRole('button', { name: 'Add image node' }).click()
  const exported = await exportScene(page)
  expect(exported.assets).toContainEqual(expect.objectContaining({ id: 'asset-1', source: 'https://cdn.test/logo.png' }))
  expect(exported.nodes).toContainEqual(expect.objectContaining({ type: 'image', assetId: 'asset-1' }))
  await page.getByRole('button', { name: 'Undo' }).click()
  expect((await exportScene(page)).nodes.some((node: { type: string }) => node.type === 'image')).toBe(false)
})

test('exports PDF and exposes the canvas contents through an ARIA mirror', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Export PDF' }).click()
  await expect(page.getByTestId('export-preview')).toHaveValue(/^data:application\/pdf;base64,/)
  await expect(page.getByRole('list', { name: 'Canvas content' })).toContainText('Rectangle: webhook')
})

test('runs an extension command and exposes plugin diagnostics', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Show plugin diagnostics' }).click()
  await expect(page.locator('#plugin-diagnostics')).toHaveText(/"plugins"/)
  await expect(page.locator('#scene-status')).toHaveText('Plugin diagnostics shown.')
})
