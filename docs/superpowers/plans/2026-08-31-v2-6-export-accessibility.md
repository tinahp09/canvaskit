# V2.6 Export & Accessibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship deterministic Scene V6 PDF export and a host-owned ARIA mirror.

**Architecture:** `@canvaskit/renderer-pdf` transforms the visible scene into a
minimal deterministic PDF object graph. `@canvaskit/accessibility` derives a
pure semantic snapshot then reconciles it into an offscreen DOM list; neither
package changes Core interaction or storage.

**Tech Stack:** TypeScript 5.8, Vitest/JSDOM, Playwright, workspace packages.

**Spec:** `docs/superpowers/specs/2026-08-31-v2-6-export-accessibility-design.md`

## Global Constraints

- Preserve immutable Scene V6 input; use `projectVisibleDocument` for layer filtering.
- Do not add runtime dependencies or browser-only APIs to PDF byte generation.
- PDF only supports V2 primitives; image nodes use a labelled vector placeholder.
- Accessibility helpers own only their generated DOM container.

---

### Task 1: Create the PDF package and deterministic writer

**Files:**
- Create: `packages/renderer-pdf/package.json`
- Create: `packages/renderer-pdf/tsconfig.json`
- Create: `packages/renderer-pdf/src/index.ts`
- Create: `packages/renderer-pdf/src/pdf-renderer.ts`
- Test: `packages/renderer-pdf/test/pdf-renderer.test.ts`
- Modify: `pnpm-workspace.yaml`

**Interfaces:**
- Consumes: `CanvasScene`, `projectVisibleDocument`, `ConnectorController`.
- Produces: `renderPDF(scene, options?): Uint8Array` and
  `exportPDFDataURL(scene, options?): string`.

- [ ] **Step 1: Write failing PDF tests**

```ts
expect(new TextDecoder().decode(renderPDF(scene))).toMatch(/^%PDF-1\.4/)
expect(renderPDF(scene)).toEqual(renderPDF(scene))
expect(exportPDFDataURL(scene)).toMatch(/^data:application\/pdf;base64,/)
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `node_modules/.bin/vitest run packages/renderer-pdf/test/pdf-renderer.test.ts`
Expected: FAIL because the package and exports do not exist.

- [ ] **Step 3: Implement the minimal writer**

```ts
export function renderPDF(scene: CanvasScene, options: PDFRenderOptions = {}): Uint8Array {
  const content = renderContentStream(scene, resolveOptions(options))
  return writeDocument(content)
}
export function exportPDFDataURL(scene: CanvasScene, options?: PDFRenderOptions): string {
  return `data:application/pdf;base64,${toBase64(renderPDF(scene, options))}`
}
```

Implement catalog/pages/page/font/content objects, byte offsets, xref, trailer,
PDF string escaping, and fixed decimal formatting. Create the package manifest
with only `@canvaskit/core` workspace dependency.

- [ ] **Step 4: Run focused tests and package build**

Run: `node_modules/.bin/vitest run packages/renderer-pdf/test/pdf-renderer.test.ts && node_modules/.bin/tsc -p packages/renderer-pdf/tsconfig.json --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/renderer-pdf pnpm-workspace.yaml
git commit -m "feat: add deterministic PDF renderer"
```

### Task 2: Render V2 primitives in PDF

**Files:**
- Modify: `packages/renderer-pdf/src/pdf-renderer.ts`
- Test: `packages/renderer-pdf/test/pdf-renderer.test.ts`

**Interfaces:**
- Consumes: `renderPDF` from Task 1 and Core visible projection/routing.
- Produces: visible-node and connector vector operators in the PDF content stream.

- [ ] **Step 1: Write failing primitive tests**

```ts
expect(pdfText(sceneWithHiddenLayer)).not.toContain('hidden-node')
expect(pdfText(sceneWithConnector)).toContain(' m\n')
expect(pdfText(sceneWithImage)).toContain('Image: logo')
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `node_modules/.bin/vitest run packages/renderer-pdf/test/pdf-renderer.test.ts`
Expected: FAIL because the first writer emits no primitive-specific content.

- [ ] **Step 3: Implement vector renderers**

```ts
for (const node of projectVisibleDocument(scene).nodes) {
  if (node.type === 'rectangle') drawRectangle(stream, node)
  else if (node.type === 'circle') drawCircle(stream, node)
  else if (node.type === 'image') drawImagePlaceholder(stream, node)
  else drawText(stream, node)
}
```

Convert world points with the viewport and PDF Y-axis inversion. Use
`ConnectorController.route` before emitting each visible connector path.

- [ ] **Step 4: Run focused tests and full unit suite**

Run: `node_modules/.bin/vitest run`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/renderer-pdf
git commit -m "feat: render scene primitives to PDF"
```

### Task 3: Create the accessibility package and semantic snapshot

**Files:**
- Create: `packages/accessibility/package.json`
- Create: `packages/accessibility/tsconfig.json`
- Create: `packages/accessibility/src/index.ts`
- Create: `packages/accessibility/src/snapshot.ts`
- Test: `packages/accessibility/test/snapshot.test.ts`

**Interfaces:**
- Consumes: `CanvasScene`, visible projection, optional selected IDs.
- Produces: `createAccessibilitySnapshot(scene, selectedIds?): AccessibilitySnapshot`.

- [ ] **Step 1: Write failing snapshot tests**

```ts
expect(createAccessibilitySnapshot(scene, ['title']).items).toEqual([
  expect.objectContaining({ id: 'title', label: 'Text: Launch', selected: true }),
])
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `node_modules/.bin/vitest run packages/accessibility/test/snapshot.test.ts`
Expected: FAIL because the package does not exist.

- [ ] **Step 3: Implement immutable semantics**

```ts
export interface AccessibilityItem { id: string; role: 'graphics-symbol' | 'listitem'; label: string; selected: boolean }
export function createAccessibilitySnapshot(scene: CanvasScene, selectedIds: readonly string[] = []): AccessibilitySnapshot {
  return { items: projectVisibleDocument(scene).nodes.map((node) => toItem(node, selectedIds)) }
}
```

Use stable, human-readable labels for each node type and append visible
connectors after nodes.

- [ ] **Step 4: Run focused tests and typecheck**

Run: `node_modules/.bin/vitest run packages/accessibility/test/snapshot.test.ts && node_modules/.bin/tsc -p packages/accessibility/tsconfig.json --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/accessibility
git commit -m "feat: add accessibility snapshot API"
```

### Task 4: Implement the DOM ARIA mirror

**Files:**
- Create: `packages/accessibility/src/mirror.ts`
- Modify: `packages/accessibility/src/index.ts`
- Test: `packages/accessibility/test/mirror.test.ts`

**Interfaces:**
- Consumes: `AccessibilitySnapshot` from Task 3.
- Produces: `new CanvasAccessibilityMirror(host, options)` with `update` and `destroy`.

- [ ] **Step 1: Write failing JSDOM tests**

```ts
const mirror = new CanvasAccessibilityMirror(host, { label: 'Project canvas' })
mirror.update(snapshot)
expect(host.getByRole('list', { name: 'Project canvas' })).toBeTruthy()
mirror.destroy()
expect(host.querySelector('[data-canvaskit-a11y]')).toBeNull()
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `node_modules/.bin/vitest run packages/accessibility/test/mirror.test.ts`
Expected: FAIL because no mirror exists.

- [ ] **Step 3: Implement DOM reconciliation**

```ts
update(snapshot: AccessibilitySnapshot): void {
  this.list.replaceChildren(...snapshot.items.map((item) => this.createItem(item)))
  this.status.textContent = `${snapshot.items.length} canvas items available.`
}
```

Create one hidden container with a labelled list and polite status node. Mark
selected entries with `aria-selected`; do not mutate scene data or host canvas.

- [ ] **Step 4: Run focused tests and full unit suite**

Run: `node_modules/.bin/vitest run`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/accessibility
git commit -m "feat: add ARIA canvas mirror"
```

### Task 5: Integrate the example, docs, and release candidate

**Files:**
- Modify: `examples/basic-canvas/package.json`
- Modify: `examples/basic-canvas/src/main.ts`
- Modify: `examples/basic-canvas/e2e/canvas.spec.ts`
- Create: `docs/api/export-accessibility.md`
- Create: `docs/guides/export-accessibility.md`
- Create: `docs/architecture/v2-export-accessibility.md`
- Create: `docs/release-notes-v2-6.md`
- Create: `docs/release-assets-v2-6.md`
- Modify: `docs/.vitepress/config.mts`, `docs/migrations.md`, `README.md`, `.github/RELEASE_CHECKLIST.md`

**Interfaces:**
- Consumes: `exportPDFDataURL`, `CanvasAccessibilityMirror`, `createAccessibilitySnapshot`.
- Produces: accessible V2.6 basic-canvas workflow and release-ready documentation.

- [ ] **Step 1: Write the failing browser test**

```ts
await page.getByRole('button', { name: 'Export PDF' }).click()
await expect(page.getByTestId('export-preview')).toHaveValue(/^data:application\/pdf;base64,/)
await expect(page.getByRole('list', { name: 'Canvas content' })).toContainText('Rectangle: webhook')
```

- [ ] **Step 2: Run browser test and verify failure**

Run: `./node_modules/.bin/playwright test examples/basic-canvas/e2e/canvas.spec.ts --workers=1`
Expected: FAIL because the PDF control and semantic mirror do not exist.

- [ ] **Step 3: Implement integration and docs**

Import the two packages through public exports, initialize/update/destroy the
mirror with existing scene subscriptions, add a labelled `Export PDF` button,
and write API/guide/architecture/release artifacts. Document that V2.6 keeps
Scene V6 unchanged and has no migration.

- [ ] **Step 4: Verify the candidate**

Run: `node_modules/.bin/vitest run && node_modules/.bin/vitepress build docs && ./node_modules/.bin/playwright test examples/basic-canvas/e2e/canvas.spec.ts --workers=1`
Expected: all commands PASS.

- [ ] **Step 5: Commit**

```bash
git add examples/basic-canvas docs README.md .github/RELEASE_CHECKLIST.md
git commit -m "docs: document V2.6 export accessibility"
```
