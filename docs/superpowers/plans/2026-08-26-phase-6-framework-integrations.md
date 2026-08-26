# Phase 6 Framework Integrations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Release CanvasKit `0.6.0` with framework-native React and Vue 3 lifecycle adapters, runnable examples, and SSR-safe Nuxt guidance.

**Architecture:** React and Vue packages subscribe to the existing public Core API instead of owning graph state. Each exposes a provider, instance hook/composable, reactive scene reader, and canvas host that attaches the existing Canvas 2D renderer and public pointer input, then cleans up only resources it owns.

**Tech Stack:** TypeScript strict mode, pnpm workspaces, React 18+, Vue 3.3+, Vite, Vitest, Playwright system Chrome, Changesets.

**Spec:** `docs/superpowers/specs/2026-08-26-phase-6-framework-integrations-design.md`

## Global Constraints

- Core must remain framework- and renderer-agnostic.
- React and Vue are peer dependencies, never Core dependencies.
- Canvas host components use only public CanvasKit, Canvas renderer, and pointer-input APIs.
- Adapter cleanup removes subscriptions/listeners exactly once and must not dispose caller-owned CanvasKit instances.
- SVG output is displayed as text, never injected into the page as markup.
- Nuxt guidance must prevent browser-only canvas work during SSR.
- Every public API, package, example, and changeset has focused validation.

---

### Task 1: Observable scene subscription in Core

**Status:** Complete — `5986ae2`

**Files:**
- Create: `packages/core/src/scene-subscription.ts`
- Modify: `packages/core/src/canvas-kit.ts`, `packages/core/src/index.ts`
- Test: `packages/core/test/scene-subscription.test.ts`

**Interfaces:** Add `CanvasKit.subscribe(listener: (scene: CanvasScene) => void): () => void`. It returns an idempotent unsubscribe function; `execute`, `undo`, `redo`, `setScene`, `load`, and viewport navigation notify with the current snapshot. Framework packages consume this public method.

- [ ] **Step 1: Write failing subscription tests**

```ts
it('notifies subscribers and stops after unsubscribe', () => {
  const kit = new CanvasKit()
  const listener = vi.fn()
  const unsubscribe = kit.subscribe(listener)
  kit.setScene(addRectangle(kit.getScene(), rectangle))
  expect(listener).toHaveBeenCalledWith(kit.getScene())
  unsubscribe(); unsubscribe()
  kit.setScene(createScene())
  expect(listener).toHaveBeenCalledTimes(1)
})
```

- [ ] **Step 2: Run the focused test and observe the missing public API**

Run: `./node_modules/.bin/vitest run packages/core/test/scene-subscription.test.ts`  
Expected: FAIL because `subscribe` does not exist.

- [ ] **Step 3: Add the minimal observable scene mechanism**

```ts
subscribe(listener: (scene: CanvasScene) => void): () => void {
  this.sceneListeners.add(listener)
  let active = true
  return () => { if (active) { active = false; this.sceneListeners.delete(listener) } }
}
```

Route all scene and viewport mutations through a private notifier that supplies `getScene()`.

- [ ] **Step 4: Run focused Core tests and typecheck**

Run: `./node_modules/.bin/vitest run packages/core/test/scene-subscription.test.ts && ./node_modules/.bin/tsc -p packages/core/tsconfig.json`  
Expected: PASS.

- [ ] **Step 5: Commit the public subscription contract**

```bash
git add packages/core/src packages/core/test/scene-subscription.test.ts
git commit -m "feat: add CanvasKit scene subscriptions"
```

### Task 2: React lifecycle adapter

**Status:** Complete — `2e98b23`, `9733cbf`, `fdf4538`

**Files:**
- Create: `packages/react/package.json`, `packages/react/tsconfig.json`, `packages/react/vitest.config.ts`, `packages/react/src/{context,canvas-kit,scene,canvas,index}.tsx`, `packages/react/test/react-adapter.test.tsx`
- Modify: `pnpm-lock.yaml`

**Interfaces:** Export `CanvasKitProvider`, `useCanvasKit(): CanvasKit`, `useCanvasScene(): CanvasScene`, and `CanvasKitCanvas({ canvas?: CanvasKit; width?: number; height?: number; ariaLabel?: string }): JSX.Element`.

- [ ] **Step 1: Write failing React lifecycle tests**

```tsx
it('updates useCanvasScene and removes its subscription on unmount', () => {
  const kit = new CanvasKit()
  const view = render(<CanvasKitProvider canvas={kit}><SceneCount /></CanvasKitProvider>)
  kit.setScene(addRectangle(kit.getScene(), rectangle))
  expect(view.getByText('1')).toBeTruthy()
  view.unmount()
  expect(() => kit.setScene(createScene())).not.toThrow()
})
```

- [ ] **Step 2: Run the focused test and observe the missing adapter package**

Run: `./node_modules/.bin/vitest run packages/react/test/react-adapter.test.tsx`  
Expected: FAIL because `@canvaskit/react` does not exist.

- [ ] **Step 3: Implement context, hooks, and canvas host**

Use `useEffect` to subscribe/unsubscribe and create `CanvasRenderer`. `CanvasKitCanvas` sets canvas dimensions, calls `attachPointerInput`, redraws on subscription, and runs both cleanup functions in its effect cleanup. Provider only disposes an instance it created internally.

- [ ] **Step 4: Run React tests, typecheck, and package build**

Run: `./node_modules/.bin/vitest run packages/react/test/react-adapter.test.tsx && ./node_modules/.bin/tsc -p packages/react/tsconfig.json`  
Expected: PASS.

- [ ] **Step 5: Commit the React package**

```bash
git add packages/react pnpm-lock.yaml
git commit -m "feat: add React CanvasKit adapter"
```

### Task 3: Vue 3 lifecycle adapter

**Status:** Complete — `9ef38d7`, `153e191`

**Files:**
- Create: `packages/vue/package.json`, `packages/vue/tsconfig.json`, `packages/vue/vitest.config.ts`, `packages/vue/src/{context,canvas-kit,scene,canvas,index}.ts`, `packages/vue/test/vue-adapter.test.ts`
- Modify: `pnpm-lock.yaml`

**Interfaces:** Export `CanvasKitProvider`, `useCanvasKit(): CanvasKit`, `useCanvasScene(): Readonly<ShallowRef<CanvasScene>>`, and `CanvasKitCanvas` with `canvas`, `width`, `height`, and `ariaLabel` props matching the React host.

- [ ] **Step 1: Write failing Vue lifecycle tests**

```ts
it('publishes scene snapshots and removes the subscription on scope disposal', () => {
  const kit = new CanvasKit()
  const scope = effectScope()
  const scene = scope.run(() => useCanvasScene(kit))!
  kit.setScene(addRectangle(kit.getScene(), rectangle))
  expect(scene.value.nodes).toHaveLength(1)
  scope.stop()
})
```

- [ ] **Step 2: Run the focused test and observe the missing adapter package**

Run: `./node_modules/.bin/vitest run packages/vue/test/vue-adapter.test.ts`  
Expected: FAIL because `@canvaskit/vue` does not exist.

- [ ] **Step 3: Implement Vue composables, provider, and canvas host**

Use `shallowRef`, `onScopeDispose`, and `onMounted`/`onBeforeUnmount`. Canvas host subscribes and redraws like React, removes pointer bindings on unmount, and never disposes a caller-owned `CanvasKit`.

- [ ] **Step 4: Run Vue tests, typecheck, and package build**

Run: `./node_modules/.bin/vitest run packages/vue/test/vue-adapter.test.ts && ./node_modules/.bin/tsc -p packages/vue/tsconfig.json`  
Expected: PASS.

- [ ] **Step 5: Commit the Vue package**

```bash
git add packages/vue pnpm-lock.yaml
git commit -m "feat: add Vue CanvasKit adapter"
```

### Task 4: Runnable React and Vue examples

**Status:** Complete — `b7a20a2`

**Files:**
- Create: `examples/react-canvas/{package.json,tsconfig.json,index.html,src/main.tsx,src/style.css,e2e/canvas.spec.ts}`, `examples/vue-canvas/{package.json,tsconfig.json,index.html,src/main.ts,src/App.vue,src/style.css,e2e/canvas.spec.ts}`
- Modify: `pnpm-lock.yaml`

**Interfaces:** Each example imports only package roots and renders its framework `CanvasKitCanvas`. Each offers an accessible reactive node count plus SVG and PNG export controls whose output is a readonly textarea.

- [ ] **Step 1: Write failing browser tests for both examples**

```ts
test('renders an interactive canvas and exports SVG safely', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByLabel('CanvasKit canvas')).toBeVisible()
  await page.getByRole('button', { name: 'Export SVG' }).click()
  await expect(page.getByLabel('Export preview')).toHaveValue(/<svg/)
})
```

- [ ] **Step 2: Run focused browser tests and observe missing examples**

Run: `./node_modules/.bin/playwright test examples/react-canvas/e2e examples/vue-canvas/e2e --reporter=list`  
Expected: FAIL because the applications do not exist.

- [ ] **Step 3: Build equivalent framework examples**

Create a default scene with public Core functions. Render node count through `useCanvasScene`, invoke `renderSVG` and `exportPNG` from click handlers, and write export strings to a readonly `<textarea>`.

- [ ] **Step 4: Build both examples and run E2E**

Run: `cd examples/react-canvas && ../../node_modules/.bin/vite build && cd ../vue-canvas && ../../node_modules/.bin/vite build && cd ../.. && ./node_modules/.bin/playwright test examples/react-canvas/e2e examples/vue-canvas/e2e --reporter=list`  
Expected: PASS.

- [ ] **Step 5: Commit the framework examples**

```bash
git add examples/react-canvas examples/vue-canvas pnpm-lock.yaml
git commit -m "feat: add framework integration examples"
```

### Task 5: Nuxt documentation, release metadata, and verification

**Status:** Complete — `b12d84e`

**Files:**
- Create: `docs/nuxt.md`, `.changeset/phase-six.md`
- Modify: `README.md`, `docs/getting-started.md`

**Interfaces:** Nuxt documentation uses `<ClientOnly>` and imports `@canvaskit/vue`; release metadata declares minor releases for `@canvaskit/core`, `@canvaskit/react`, and `@canvaskit/vue`.

- [ ] **Step 1: Add docs assertions to example E2E where user-visible copy is introduced**

```ts
await expect(page.getByText('Nodes: 1')).toBeVisible()
await expect(page.getByLabel('Export preview')).toHaveAttribute('readonly', '')
```

- [ ] **Step 2: Run focused E2E before documentation and release wiring**

Run: `./node_modules/.bin/playwright test examples/react-canvas/e2e examples/vue-canvas/e2e --reporter=list`  
Expected: PASS after Task 4.

- [ ] **Step 3: Document installation, lifecycle, and SSR-safe Nuxt mounting**

Use an explicit `<ClientOnly><CanvasKitCanvas /></ClientOnly>` example and state that canvas construction occurs in `onMounted` or a client component. Add a `0.6.0` changeset.

- [ ] **Step 4: Run full release verification**

Run: `git diff --check && ./node_modules/.bin/tsc -p packages/geometry/tsconfig.json && ./node_modules/.bin/tsc -p packages/core/tsconfig.json && ./node_modules/.bin/tsc -p packages/renderer-canvas/tsconfig.json && ./node_modules/.bin/tsc -p packages/renderer-svg/tsconfig.json && ./node_modules/.bin/tsc -p packages/plugins/tsconfig.json && ./node_modules/.bin/tsc -p packages/react/tsconfig.json && ./node_modules/.bin/tsc -p packages/vue/tsconfig.json && ./node_modules/.bin/vitest run && ./node_modules/.bin/playwright test --reporter=list`  
Expected: PASS.

- [ ] **Step 5: Commit release completion**

```bash
git add README.md docs/getting-started.md docs/nuxt.md .changeset/phase-six.md
git commit -m "docs: release framework integrations"
```

## Plan Self-Review

- Task 1 supplies the one public reactive primitive both adapters require.
- Tasks 2 and 3 independently ship React and Vue lifecycle packages with equivalent APIs.
- Task 4 proves real developer usage through two runnable applications.
- Task 5 delivers the Nuxt 4 guide, release metadata, and end-to-end release gate.
- The plan contains no deferred implementation steps; later task signatures are defined by their producing tasks.
