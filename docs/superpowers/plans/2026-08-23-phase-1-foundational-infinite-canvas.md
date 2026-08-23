# Phase 1 Foundational Infinite Canvas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** Publish \`0.1.0\` of CanvasKit: a framework-agnostic Canvas 2D infinite canvas that renders rectangle nodes, pans/zooms, emits pointer events, and persists a versioned scene.

**Architecture:** \`@canvaskit/geometry\` owns coordinate maths. \`@canvaskit/core\` owns scene state, serialization, viewport state and DOM input without importing a renderer. \`@canvaskit/renderer-canvas\` draws the public core model, and a Vite example validates integration.

**Tech Stack:** TypeScript strict mode, pnpm workspaces, Turborepo, Vitest, Playwright, Vite, Canvas 2D.

**Spec:** \`docs/superpowers/specs/2026-08-23-canvaskit-v1-roadmap-design.md\`

## Global Constraints

- Core must remain framework- and renderer-agnostic.
- Coordinates are world coordinates unless explicitly named \`screen\`.
- Scene schema version is exactly \`1\`; unsupported versions throw a typed error.
- Zoom is clamped to \`[0.1, 4]\` and retains the world point under the pointer.
- Every public API has a unit test and documented example usage.

---

## File Structure

- \`package.json\`, \`pnpm-workspace.yaml\`, \`turbo.json\`, \`tsconfig.base.json\`: workspace tooling.
- \`packages/geometry/src/*\`: public points, sizes, transforms, and bounds helpers.
- \`packages/core/src/*\`: scene model, persistence, viewport, facade, and input routing.
- \`packages/renderer-canvas/src/*\`: Canvas 2D renderer.
- \`examples/basic-canvas/*\`: Vite demo and Playwright test.
- \`README.md\`, \`docs/getting-started.md\`: installation and API usage.

### Task 1: Scaffold the buildable workspace

**Files:**
- Create: \`package.json\`, \`pnpm-workspace.yaml\`, \`turbo.json\`, \`tsconfig.base.json\`, \`vitest.workspace.ts\`, \`.gitignore\`
- Create: \`packages/{geometry,core,renderer-canvas}/{package.json,tsconfig.json,src/index.ts}\`
- Test: \`packages/geometry/test/workspace.test.ts\`

**Produces:** Packages named \`@canvaskit/geometry\`, \`@canvaskit/core\`, and \`@canvaskit/renderer-canvas\`, each with \`build\` and \`typecheck\` scripts.

- [ ] **Step 1: Write the failing workspace test**

\`\`\`ts
import { expect, it } from 'vitest'
import { PACKAGE_NAME } from '../src/index'

it('exposes geometry package identity', () => {
  expect(PACKAGE_NAME).toBe('@canvaskit/geometry')
})
\`\`\`

- [ ] **Step 2: Verify it fails**

Run: \`pnpm exec vitest run packages/geometry/test/workspace.test.ts\`

Expected: FAIL because no workspace or source module exists.

- [ ] **Step 3: Implement workspace configuration**

Create a private root package with \`pnpm@10.0.0\`, scripts \`build: turbo run build\`, \`test: vitest run\`, \`typecheck: turbo run typecheck\`, and \`test:e2e: playwright test\`; add dev dependencies \`typescript\`, \`vitest\`, \`vite\`, \`turbo\`, and \`@playwright/test\`. Include \`packages/*\` and \`examples/*\` in \`pnpm-workspace.yaml\`. Every package uses ESM, emits \`dist\`, and exports its \`dist/index.js\` and declaration file. Start each entry with its exact \`PACKAGE_NAME\` constant.

- [ ] **Step 4: Validate and commit**

Run: \`pnpm install && pnpm test && pnpm typecheck && pnpm build\`

Expected: PASS.

\`\`\`bash
git add package.json pnpm-workspace.yaml turbo.json tsconfig.base.json vitest.workspace.ts .gitignore packages
git commit -m "chore: initialize CanvasKit monorepo"
\`\`\`

### Task 2: Add typed geometry and transforms

**Files:**
- Create: \`packages/geometry/src/types.ts\`, \`packages/geometry/src/transform.ts\`, \`packages/geometry/src/rect.ts\`
- Modify: \`packages/geometry/src/index.ts\`
- Test: \`packages/geometry/test/transform.test.ts\`, \`packages/geometry/test/rect.test.ts\`

**Produces:** \`Point\`, \`Size\`, \`Rect\`, \`ViewportTransform\`, \`worldToScreen\`, \`screenToWorld\`, and \`rectContainsPoint\`.

- [ ] **Step 1: Write the failing transform tests**

\`\`\`ts
import { expect, it } from 'vitest'
import { screenToWorld, worldToScreen } from '../src/index'

it('maps world coordinates to screen coordinates and back', () => {
  const transform = { x: 100, y: 50, zoom: 2 }
  expect(worldToScreen({ x: 10, y: 20 }, transform)).toEqual({ x: 120, y: 90 })
  expect(screenToWorld({ x: 120, y: 90 }, transform)).toEqual({ x: 10, y: 20 })
})
\`\`\`

- [ ] **Step 2: Verify it fails**

Run: \`pnpm exec vitest run packages/geometry/test/transform.test.ts\`

Expected: FAIL because the functions are not exported.

- [ ] **Step 3: Implement the exact transform API**

\`\`\`ts
export interface Point { x: number; y: number }
export interface Size { width: number; height: number }
export interface Rect extends Point, Size {}
export interface ViewportTransform { x: number; y: number; zoom: number }

export const worldToScreen = (point: Point, t: ViewportTransform): Point =>
  ({ x: point.x * t.zoom + t.x, y: point.y * t.zoom + t.y })
export const screenToWorld = (point: Point, t: ViewportTransform): Point =>
  ({ x: (point.x - t.x) / t.zoom, y: (point.y - t.y) / t.zoom })
\`\`\`

Implement \`rectContainsPoint\` with inclusive left/top and exclusive right/bottom bounds, then re-export all public values from \`index.ts\`.

- [ ] **Step 4: Validate and commit**

Run: \`pnpm exec vitest run packages/geometry/test && pnpm --filter @canvaskit/geometry typecheck\`

Expected: PASS.

\`\`\`bash
git add packages/geometry
git commit -m "feat: add geometry primitives and transforms"
\`\`\`

### Task 3: Implement the scene model and persistence

**Files:**
- Create: \`packages/core/src/model.ts\`, \`packages/core/src/scene.ts\`, \`packages/core/src/serialization.ts\`
- Modify: \`packages/core/package.json\`, \`packages/core/src/index.ts\`
- Test: \`packages/core/test/scene.test.ts\`, \`packages/core/test/serialization.test.ts\`

**Consumes:** \`Point\`, \`Size\`, and \`ViewportTransform\` from \`@canvaskit/geometry\`.

**Produces:** \`RectangleNode\`, \`CanvasScene\`, \`createScene\`, \`addRectangle\`, \`serializeScene\`, \`loadScene\`, \`UnsupportedSceneVersionError\`.

- [ ] **Step 1: Write the failing round-trip test**

\`\`\`ts
import { expect, it } from 'vitest'
import { addRectangle, createScene, loadScene, serializeScene } from '../src/index'

it('restores a serialized rectangle scene', () => {
  const scene = addRectangle(createScene(), {
    id: 'welcome', position: { x: -20, y: 40 }, size: { width: 180, height: 80 }, fill: '#7C7FF2'
  })
  expect(loadScene(serializeScene(scene))).toEqual(scene)
})
\`\`\`

- [ ] **Step 2: Verify it fails**

Run: \`pnpm exec vitest run packages/core/test/scene.test.ts packages/core/test/serialization.test.ts\`

Expected: FAIL because the scene API does not exist.

- [ ] **Step 3: Implement scene and validation**

Implement \`RectangleNode\` with \`id\`, \`type: 'rectangle'\`, \`position\`, \`size\`, and \`fill\`; implement \`CanvasScene\` with \`version: 1\`, \`nodes\`, \`viewport\`, and \`metadata\`. \`createScene\` returns an empty scene with \`{ x: 0, y: 0, zoom: 1 }\`. \`addRectangle\` returns an immutable updated scene and rejects duplicate ids with \`Error('A node with id "<id>" already exists.')\`. \`loadScene\` validates JSON, version, every field and numeric coordinate; it throws \`UnsupportedSceneVersionError\` for non-1 versions.

- [ ] **Step 4: Validate and commit**

Run: \`pnpm exec vitest run packages/core/test && pnpm --filter @canvaskit/core typecheck\`

Expected: PASS.

\`\`\`bash
git add packages/core
git commit -m "feat: add versioned rectangle scene model"
\`\`\`

### Task 4: Build pointer-centered viewport and CanvasKit facade

**Files:**
- Create: \`packages/core/src/viewport.ts\`, \`packages/core/src/canvas-kit.ts\`, \`packages/core/src/pointer-input.ts\`
- Modify: \`packages/core/src/index.ts\`
- Test: \`packages/core/test/viewport.test.ts\`, \`packages/core/test/canvas-kit.test.ts\`, \`packages/core/test/pointer-input.test.ts\`

**Consumes:** Scene model and geometry transform API.

**Produces:** \`ViewportController\`, \`CanvasKit\`, \`CanvasPointerEvent\`, and \`attachPointerInput\`.

- [ ] **Step 1: Write the failing zoom-invariant test**

\`\`\`ts
import { expect, it } from 'vitest'
import { screenToWorld } from '@canvaskit/geometry'
import { ViewportController } from '../src/index'

it('keeps the pointer world point fixed during zoom', () => {
  const viewport = new ViewportController({ x: 0, y: 0, zoom: 1 })
  const pointer = { x: 300, y: 200 }
  const before = screenToWorld(pointer, viewport.getTransform())
  viewport.zoomAt(pointer, 2)
  expect(screenToWorld(pointer, viewport.getTransform())).toEqual(before)
})
\`\`\`

- [ ] **Step 2: Verify it fails**

Run: \`pnpm exec vitest run packages/core/test/viewport.test.ts\`

Expected: FAIL because \`ViewportController\` is missing.

- [ ] **Step 3: Implement navigation and input**

\`ViewportController\` exposes \`getTransform\`, \`panBy\`, \`zoomAt\`, \`setZoom\`, and \`reset\`. Clamp zoom to \`0.1\`–\`4\`; calculate the pre-zoom world point and set the next translation so it maps to the original screen point. \`CanvasKit\` exposes \`getScene\`, \`setScene\`, \`toJSON\`, \`load\`, \`viewport\`, \`onPointer\`, and \`createPointerEvent\`; events contain \`type\`, \`screen\`, and \`world\`. \`attachPointerInput\` maps client coordinates through \`getBoundingClientRect\`, emits down/move/up, middle-button pans by screen delta, and wheel zooms using \`Math.exp(-deltaY * 0.001)\` with \`preventDefault()\`.

- [ ] **Step 4: Validate and commit**

Run: \`pnpm exec vitest run packages/core/test && pnpm --filter @canvaskit/core typecheck\`

Expected: PASS.

\`\`\`bash
git add packages/core
git commit -m "feat: add CanvasKit navigation and pointer input"
\`\`\`

### Task 5: Add Canvas 2D rendering, browser example, and release checks

**Files:**
- Create: \`packages/renderer-canvas/src/canvas-renderer.ts\`, \`packages/renderer-canvas/test/canvas-renderer.test.ts\`
- Modify: \`packages/renderer-canvas/package.json\`, \`packages/renderer-canvas/src/index.ts\`
- Create: \`examples/basic-canvas/{package.json,index.html,vite.config.ts,src/main.ts,src/style.css,e2e/canvas.spec.ts}\`
- Create: \`README.md\`, \`docs/getting-started.md\`, \`.changeset/phase-one.md\`

**Consumes:** all Phase 1 public package APIs.

**Produces:** \`CanvasRenderer\` and a testable getting-started application.

- [ ] **Step 1: Write failing renderer and browser tests**

\`\`\`ts
import { expect, it, vi } from 'vitest'
import { CanvasRenderer } from '../src/index'

it('draws a transformed rectangle', () => {
  const fillRect = vi.fn()
  const context = { setTransform: vi.fn(), clearRect: vi.fn(), fillRect, fillStyle: '' } as unknown as CanvasRenderingContext2D
  const element = { getContext: () => context, width: 800, height: 600 } as unknown as HTMLCanvasElement
  new CanvasRenderer(element).render({ version: 1, nodes: [{ id: 'a', type: 'rectangle', position: { x: 10, y: 20 }, size: { width: 30, height: 40 }, fill: '#fff' }], viewport: { x: 5, y: 6, zoom: 2 }, metadata: {} })
  expect(fillRect).toHaveBeenCalledWith(25, 46, 60, 80)
})
\`\`\`

\`\`\`ts
import { expect, test } from '@playwright/test'
test('saves and loads the example scene', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Save scene' }).click()
  await expect(page.getByTestId('scene-json')).not.toHaveValue('')
  await page.getByRole('button', { name: 'Load scene' }).click()
})
\`\`\`

- [ ] **Step 2: Verify tests fail**

Run: \`pnpm exec vitest run packages/renderer-canvas/test/canvas-renderer.test.ts && pnpm exec playwright test examples/basic-canvas/e2e/canvas.spec.ts\`

Expected: FAIL because the renderer and example do not exist.

- [ ] **Step 3: Implement renderer, example, and docs**

\`CanvasRenderer\` requires a 2D context and throws \`Error('Canvas 2D is not available.')\` if absent. \`render\` clears the backing store and draws every rectangle using the scene transform. Its \`ResizeObserver\` uses \`devicePixelRatio\` for sharp output and \`destroy\` disconnects it. The dark Vite example starts with one rectangle, attaches pointer input, re-renders after input, and provides \`Save scene\`/\`Load scene\` buttons plus a \`data-testid="scene-json"\` textarea. The README and Getting Started guide must show installation, creation, mounting, rectangle serialization, and Phase 1 limitations. The changeset publishes all three packages as minor releases.

- [ ] **Step 4: Run complete verification and commit**

Run: \`pnpm test && pnpm typecheck && pnpm build && pnpm test:e2e\`

Expected: PASS.

\`\`\`bash
git add packages/renderer-canvas examples/basic-canvas README.md docs/getting-started.md .changeset package.json
git commit -m "feat: release foundational CanvasKit canvas"
\`\`\`

## Plan Self-Review

- Tasks 1–5 cover every Phase 1 requirement: build tooling, canvas/scene, rectangle nodes, Canvas 2D rendering, coordinate transforms, pan/zoom, pointer events, JSON persistence, example, documentation, and end-to-end validation.
- Selection, edges, history, plugins, framework adapters, and performance indexing remain intentionally in later approved roadmap phases.
- Package names, public types, and methods are introduced before their consumers use them.
