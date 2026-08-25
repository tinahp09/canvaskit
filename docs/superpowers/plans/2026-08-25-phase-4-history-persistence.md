# Phase 4 History and Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Release `0.4.0` with command-based editing history, transactions, internal copy/paste/duplicate, and safely migrated versioned scene import/export.

**Architecture:** `@canvaskit/core` owns immutable scene commands, a history controller, and an in-memory clipboard independent of browser APIs. Scene JSON advances to schema version 2; the importer migrates valid schema-version-1 scenes before validating the canonical v2 structure. The workflow example uses `CanvasKit` methods, so its controls contain no private history logic.

**Tech Stack:** TypeScript strict mode, Vitest, Playwright with system Chrome, Canvas 2D, Vite, Changesets.

**Spec:** `docs/superpowers/specs/2026-08-23-canvaskit-v1-roadmap-design.md`

## Global Constraints

- Core remains framework- and browser-agnostic; clipboard state must not depend on `navigator.clipboard`.
- Scene import must reject malformed input with an `InvalidSceneError` and preserve source `CanvasKit` state on failure.
- Every v1 scene that was supported in Phase 3 migrates to canonical v2 data.
- Undo, redo, and transaction operations replace scenes immutably and clear redo after a new command.
- Every public behavior has red/green tests and a runnable example validates the user flow.

---

### Task 1: Versioned import/export and scene migration

**Files:**
- Create: `packages/core/src/migrations.ts`
- Modify: `packages/core/src/model.ts`, `packages/core/src/serialization.ts`, `packages/core/src/index.ts`
- Test: `packages/core/test/serialization.test.ts`
- Modify: `docs/migrations.md`

**Interfaces:**
- Produces `SCENE_VERSION = 2`, `InvalidSceneError`, `exportScene(scene): string`, `importScene(json): CanvasScene`, and `migrateScene(value: unknown): unknown`.
- Consumes the existing v1 `nodes`, optional `edges` and optional `groups` document shape.

- [x] **Step 1: Write failing migration and validation tests**

```ts
it('migrates a Phase 3 version 1 scene into version 2', () => {
  expect(importScene('{"version":1,"nodes":[],"viewport":{"x":0,"y":0,"zoom":1},"metadata":{}}')).toMatchObject({ version: 2, edges: [], groups: [] })
})

it('rejects malformed imported JSON with a typed error', () => {
  expect(() => importScene('{"version":2,"nodes":"bad"}')).toThrow(InvalidSceneError)
})
```

- [x] **Step 2: Run focused test to verify it fails**

Run: `pnpm exec vitest run packages/core/test/serialization.test.ts`

Expected: failure because v2 import/export, typed errors, and migration do not yet exist.

- [x] **Step 3: Implement canonical v2 import/export**

```ts
export const SCENE_VERSION = 2 as const
export class InvalidSceneError extends Error {}
export function exportScene(scene: CanvasScene): string { return JSON.stringify(scene) }
export function importScene(json: string): CanvasScene { return parseCanonicalScene(migrateScene(JSON.parse(json))) }
```

Migrate version 1 by adding missing graph arrays and setting `version: 2`; validate every node, edge, group, viewport, and metadata field after migration. Preserve `loadScene` and `serializeScene` as aliases for compatibility.

- [x] **Step 4: Verify focused tests and Core typecheck**

Run: `pnpm exec vitest run packages/core/test/serialization.test.ts && ./node_modules/.bin/tsc -p packages/core/tsconfig.json`

Expected: pass.

- [x] **Step 5: Document the v1 → v2 migration and commit**

```bash
git add packages/core/src/model.ts packages/core/src/migrations.ts packages/core/src/serialization.ts packages/core/src/index.ts packages/core/test/serialization.test.ts docs/migrations.md
git commit -m "feat: add versioned scene migrations"
```

### Task 2: Command history, undo/redo, and transactions

**Files:**
- Create: `packages/core/src/history.ts`
- Modify: `packages/core/src/canvas-kit.ts`, `packages/core/src/index.ts`
- Test: `packages/core/test/history.test.ts`, `packages/core/test/canvas-kit.test.ts`

**Interfaces:**
- Produces `SceneCommand`, `HistoryController`, `CanvasKit.execute(command)`, `undo()`, `redo()`, `beginTransaction(label)`, and `commitTransaction()`.
- A `SceneCommand` is `{ label: string; execute(scene: CanvasScene): CanvasScene; undo(scene: CanvasScene): CanvasScene }`.

- [x] **Step 1: Write failing command-history tests**

```ts
it('undoes then redoes an executed scene command', () => {
  const kit = new CanvasKit()
  const before = kit.getScene()
  kit.execute({ label: 'add', execute: (scene) => addRectangle(scene, { id: 'a', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff' }), undo: () => before })
  expect(kit.undo().nodes).toEqual([])
  expect(kit.redo().nodes).toHaveLength(1)
})

it('undoes a transaction as one history entry', () => {
  const before = kit.getScene()
  const add = (id: string) => ({ label: `add ${id}`, execute: (scene: CanvasScene) => addRectangle(scene, { id, position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, fill: '#fff' }), undo: () => before })
  kit.beginTransaction('build workflow')
  kit.execute(add('a')); kit.execute(add('b')); kit.commitTransaction()
  expect(kit.undo().nodes).toEqual([])
})
```

- [x] **Step 2: Run the focused tests to verify failure**

Run: `pnpm exec vitest run packages/core/test/history.test.ts packages/core/test/canvas-kit.test.ts`

Expected: failure because history APIs do not exist.

- [x] **Step 3: Implement history state and CanvasKit integration**

`HistoryController` maintains undo/redo stacks, clears redo after a new command, and batches commands inside a transaction into a composite command that undoes in reverse order. `CanvasKit.execute` updates the scene through history; `setScene` remains a direct, non-history state replacement for imports and initialization.

- [x] **Step 4: Verify unit tests and typecheck**

Run: `pnpm exec vitest run packages/core/test/history.test.ts packages/core/test/canvas-kit.test.ts && ./node_modules/.bin/tsc -p packages/core/tsconfig.json`

Expected: pass.

- [x] **Step 5: Commit the independently usable history API**

```bash
git add packages/core/src/history.ts packages/core/src/canvas-kit.ts packages/core/src/index.ts packages/core/test/history.test.ts packages/core/test/canvas-kit.test.ts
git commit -m "feat: add command history and transactions"
```

### Task 3: Internal clipboard, copy/paste, and duplicate

**Files:**
- Create: `packages/core/src/clipboard.ts`
- Modify: `packages/core/src/canvas-kit.ts`, `packages/core/src/index.ts`, `packages/core/src/scene.ts`
- Test: `packages/core/test/clipboard.test.ts`

**Interfaces:**
- Produces `SceneClipboard`, `copySelection(scene, ids)`, `pasteSelection(scene, clipboard, offset)`, and `CanvasKit.copy()`, `paste()`, `duplicate()`.
- Clipboard payload includes selected nodes plus edges and groups whose referenced node ids are wholly selected; paste returns a fresh scene and the ids of inserted nodes.

- [x] **Step 1: Write failing clipboard tests**

```ts
it('pastes copied nodes with fresh ids and an offset', () => {
  const copied = copySelection(scene, ['a'])
  const result = pasteSelection(scene, copied, { x: 20, y: 20 })
  expect(result.scene.nodes).toHaveLength(2)
  expect(result.scene.nodes[1]?.position).toEqual({ x: 20, y: 20 })
})

it('duplicates an internal edge when both endpoints are copied', () => {
  expect(pasteSelection(graph, copySelection(graph, ['a', 'b']), { x: 10, y: 0 }).scene.edges).toHaveLength(2)
})
```

- [x] **Step 2: Run focused test to verify failure**

Run: `pnpm exec vitest run packages/core/test/clipboard.test.ts`

Expected: failure because clipboard functions are absent.

- [x] **Step 3: Implement deterministic internal copy/paste**

Clone nodes with generated collision-free ids, translate position fields by the supplied offset, remap copied edges and group membership to the new ids, and expose the inserted ids. `CanvasKit.paste` must record the mutation as one command and select the inserted nodes; `duplicate` is copy plus paste with a 20px offset.

- [x] **Step 4: Verify focused tests and all Core tests**

Run: `pnpm exec vitest run packages/core/test/clipboard.test.ts packages/core/test && ./node_modules/.bin/tsc -p packages/core/tsconfig.json`

Expected: pass.

- [x] **Step 5: Commit clipboard behavior**

```bash
git add packages/core/src/clipboard.ts packages/core/src/canvas-kit.ts packages/core/src/index.ts packages/core/src/scene.ts packages/core/test/clipboard.test.ts
git commit -m "feat: add internal copy paste and duplicate"
```

### Task 4: Durable editing example, documentation, and release validation

**Files:**
- Modify: `examples/basic-canvas/src/main.ts`, `examples/basic-canvas/e2e/canvas.spec.ts`, `README.md`, `docs/getting-started.md`
- Create: `.changeset/phase-four.md`

**Interfaces:**
- Consumes `CanvasKit.undo`, `redo`, `copy`, `paste`, `duplicate`, `exportScene`, and `importScene`.
- Produces a runnable Phase 4 editing example and release metadata for `@canvaskit/core`.

- [x] **Step 1: Write a failing browser test for durable editing**

```ts
test('duplicates, undoes, redoes, exports, and imports a scene', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Duplicate' }).click()
  await page.getByRole('button', { name: 'Undo' }).click()
  await page.getByRole('button', { name: 'Redo' }).click()
  await page.getByRole('button', { name: 'Export scene' }).click()
  await expect(page.getByTestId('scene-json')).toHaveValue(/"version":2/)
  await page.getByRole('button', { name: 'Import scene' }).click()
})
```

- [x] **Step 2: Run the E2E test to verify failure**

Run: `pnpm exec playwright test examples/basic-canvas/e2e/canvas.spec.ts -g 'duplicates' --reporter=list`

Expected: failure because Phase 4 controls do not exist.

- [x] **Step 3: Wire the public APIs into the example and docs**

Add Undo, Redo, Copy, Paste, Duplicate, Export scene, and Import scene controls. Import errors must be shown accessibly in the example and must leave the currently rendered scene unchanged. Explain the keyboard-independent API and v1 migration path in documentation.

- [x] **Step 4: Run full release verification**

Run:

```bash
./node_modules/.bin/tsc -p packages/geometry/tsconfig.json &&
./node_modules/.bin/tsc -p packages/core/tsconfig.json &&
./node_modules/.bin/tsc -p packages/renderer-canvas/tsconfig.json &&
pnpm --filter @canvaskit/basic-canvas exec vite build &&
pnpm exec vitest run &&
pnpm exec playwright test --reporter=list
```

Expected: all checks pass.

- [x] **Step 5: Add a minor changeset and commit the release slice**

```bash
git add examples/basic-canvas/src/main.ts examples/basic-canvas/e2e/canvas.spec.ts README.md docs/getting-started.md .changeset/phase-four.md
git commit -m "feat: release durable editing workflow"
```

## Plan Self-Review

- Task 1 implements the required stable versioned JSON import/export, migration path, and validation.
- Task 2 implements the command system, undo/redo, and transactions.
- Task 3 implements framework-independent copy/paste and duplicate with graph integrity.
- Task 4 supplies the runnable durable-editing example, migration documentation, changeset, and complete unit/build/browser validation.
- No roadmap Phase 4 requirement is omitted; plugins, SVG export, and framework adapters remain out of scope for Phase 5 and Phase 6.
