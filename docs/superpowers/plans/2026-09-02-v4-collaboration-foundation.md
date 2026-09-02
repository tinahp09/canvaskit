# CanvasKit V4 Collaboration Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a transport-agnostic collaboration runtime that records,
validates, replays, and converges CanvasKit Scene V7 operations.

**Architecture:** Core remains the owner of immutable scene state. A new
`CollaborationRuntime` owns serializable full-scene operation envelopes,
Lamport ordering, duplicate/stale rejection, and ephemeral presence. CanvasKit
adapts successful local scene changes and remote runtime results to its
subscription and history model; transports remain host-provided.

**Tech Stack:** TypeScript, Vitest, Playwright, Vite, VitePress.

**Spec:** `docs/superpowers/specs/2026-09-02-v4-collaboration-foundation-design.md`

## Global Constraints

- Preserve immutable Scene V7 data and framework/renderer neutrality.
- Do not add a network dependency, backend, WebSocket server, or CRDT package.
- Validate every incoming operation before it affects scene, history, clock, or presence.
- Remote operations never create undo entries; local operations remain history-backed.
- Use red/green tests before each behavior change.
- Do not stage generated caches, build output, or test-result artifacts.
- Public publishing, git tags, GitHub Releases, and posts require explicit user approval.

---

### Task 1: Phase 0 — Collaboration operation model and validation

**Files:**
- Create: `packages/core/src/collaboration.ts`
- Create: `packages/core/test/collaboration.test.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Produces `CollaborationOperation`, `CollaborationApplyResult`,
  `PresenceSnapshot`, `CollaborationTransport`, and `validateCollaborationOperation`.

- [ ] **Step 1: Write failing validation tests**

```ts
import { validateCollaborationOperation } from '../src/collaboration.js'

it('accepts a canonical Scene V7 operation', () => {
  expect(validateCollaborationOperation({
    id: 'ada:1', actorId: 'ada', clock: 1, target: 'scene', kind: 'scene', scene: createScene(),
  })).toMatchObject({ id: 'ada:1', actorId: 'ada', clock: 1 })
})

it.each([
  [{ id: '', actorId: 'ada', clock: 1 }],
  [{ id: 'ada:1', actorId: 'ada', clock: -1 }],
])('rejects malformed collaboration operation %o', (value) => {
  expect(() => validateCollaborationOperation(value)).toThrow('Invalid collaboration operation')
})
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `node_modules/.bin/vitest run packages/core/test/collaboration.test.ts`

Expected: FAIL because the collaboration module and validator do not exist.

- [ ] **Step 3: Implement the data-only operation types and validator**

```ts
export interface CollaborationOperation {
  id: string
  actorId: string
  clock: number
  target: string
  kind: 'scene'
  scene: CanvasScene
}

export function validateCollaborationOperation(value: unknown): CollaborationOperation {
  // Validate envelope fields, import/export the scene through existing canonical parsing,
  // and return a fresh serializable operation object.
}
```

- [ ] **Step 4: Re-run focused and Core tests**

Run: `node_modules/.bin/vitest run packages/core/test/collaboration.test.ts packages/core/test/serialization.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/collaboration.ts packages/core/src/index.ts packages/core/test/collaboration.test.ts
git commit -m "feat(core): add collaboration operation model"
```

### Task 2: Phase 1 — Lamport runtime, replay, and presence

**Files:**
- Modify: `packages/core/src/collaboration.ts`
- Modify: `packages/core/test/collaboration.test.ts`

**Interfaces:**
- Produces `CollaborationRuntime(actorId, options?)`, `recordLocal(scene, target?)`,
  `applyRemote(operation, scene)`, `getClock()`, `setPresence`, `removePresence`,
  and `getPresence`.

- [ ] **Step 1: Write failing convergence and presence tests**

```ts
it('ignores duplicate and stale remote operations without changing the scene', () => {
  const runtime = new CollaborationRuntime('ada')
  const remote = operation('bea:2', 'bea', 2, sceneWithFill('#38bdf8'))
  expect(runtime.applyRemote(remote, createScene()).applied).toBe(true)
  expect(runtime.applyRemote(remote, sceneWithFill('#38bdf8'))).toMatchObject({ applied: false, reason: 'duplicate' })
  expect(runtime.applyRemote(operation('bea:1', 'bea', 1, createScene()), sceneWithFill('#38bdf8'))).toMatchObject({ applied: false, reason: 'stale' })
})

it('orders equal clocks by actor ID and preserves presence outside the scene', () => {
  const runtime = new CollaborationRuntime('ada')
  runtime.setPresence({ actorId: 'bea', updatedAt: 10, selection: ['node'] })
  expect(runtime.getPresence()).toEqual([{ actorId: 'bea', updatedAt: 10, selection: ['node'] }])
})
```

- [ ] **Step 2: Run focused tests and confirm they fail**

Run: `node_modules/.bin/vitest run packages/core/test/collaboration.test.ts`

Expected: FAIL because the runtime methods are absent.

- [ ] **Step 3: Implement deterministic ordering and presence isolation**

```ts
const compareOperationOrder = (left: CollaborationOperation, right: CollaborationOperation) =>
  left.clock - right.clock || left.actorId.localeCompare(right.actorId) || left.id.localeCompare(right.id)

applyRemote(operation, scene) {
  const next = validateCollaborationOperation(operation)
  // Advance local clock, reject seen IDs, compare only within target, then return immutable result.
}
```

- [ ] **Step 4: Run focused and full Core tests**

Run: `node_modules/.bin/vitest run packages/core/test/collaboration.test.ts packages/core/test`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/collaboration.ts packages/core/test/collaboration.test.ts
git commit -m "feat(core): add collaboration convergence runtime"
```

### Task 3: Phase 2 — CanvasKit local/remote bridge and transport lifecycle

**Files:**
- Modify: `packages/core/src/canvas-kit.ts`
- Modify: `packages/core/src/index.ts`
- Modify: `packages/core/test/canvas-kit.test.ts`
- Modify: `packages/core/test/collaboration.test.ts`

**Interfaces:**
- Extends `CanvasKitOptions` with `collaboration?: { actorId: string; target?: string }`.
- Produces optional `kit.collaboration`, `kit.connectCollaboration(transport)`, and
  `kit.applyRemoteOperation(operation): CollaborationApplyResult`.

- [ ] **Step 1: Write failing CanvasKit bridge tests**

```ts
it('publishes one operation after a successful local scene command', () => {
  const kit = new CanvasKit({ collaboration: { actorId: 'ada' } })
  const published: CollaborationOperation[] = []
  kit.connectCollaboration({ publish: (operation) => published.push(operation), subscribe: () => () => undefined })
  kit.execute({ label: 'add', execute: (scene) => addRectangle(scene, rectangle), undo: (scene) => scene })
  expect(published).toHaveLength(1)
})

it('applies remote operation without adding an undo entry', () => {
  const kit = new CanvasKit({ collaboration: { actorId: 'ada' } })
  kit.applyRemoteOperation(operation('bea:1', 'bea', 1, sceneWithFill('#34d399')))
  expect(kit.undo()).toEqual(kit.getScene())
})
```

- [ ] **Step 2: Run tests and confirm they fail**

Run: `node_modules/.bin/vitest run packages/core/test/canvas-kit.test.ts packages/core/test/collaboration.test.ts`

Expected: FAIL because no CanvasKit collaboration bridge exists.

- [ ] **Step 3: Implement bridge at the scene-change boundary**

```ts
private publishLocalCollaboration(scene: CanvasScene): void {
  const operation = this.collaboration?.recordLocal(scene)
  if (operation) void this.transport?.publish(operation)
}
```

Call this only after a successful local scene change. Apply remote operations
through `applyScene`, clear redo without recording an undo command, and notify
subscribers once. Make disconnect idempotent.

- [ ] **Step 4: Re-run focused and full Core tests**

Run: `node_modules/.bin/vitest run packages/core/test/canvas-kit.test.ts packages/core/test/collaboration.test.ts && node_modules/.bin/vitest run packages/core/test`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/canvas-kit.ts packages/core/src/index.ts packages/core/test/canvas-kit.test.ts packages/core/test/collaboration.test.ts
git commit -m "feat(core): bridge CanvasKit collaboration"
```

### Task 4: Phase 3 — Two-client collaboration reference example

**Files:**
- Create: `examples/collaboration/package.json`
- Create: `examples/collaboration/index.html`
- Create: `examples/collaboration/vite.config.ts`
- Create: `examples/collaboration/src/main.ts`
- Create: `examples/collaboration/src/style.css`
- Create: `examples/collaboration/e2e/collaboration.spec.ts`
- Modify: `playwright.config.ts`, `docs/.vitepress/config.mts`, `docs/examples.md`

**Interfaces:**
- Uses public `CanvasKit`, `CollaborationRuntime`, and `CollaborationTransport` APIs only.
- Provides an in-memory delayed transport test double inside the example.

- [ ] **Step 1: Write failing browser workflow tests**

```ts
test('syncs an edit from Ada to Bea and exposes remote presence', async ({ page }) => {
  await page.goto('http://127.0.0.1:4181')
  await page.getByRole('button', { name: 'Ada: add rectangle' }).click()
  await expect(page.getByRole('status')).toHaveText('Ada operation delivered to Bea.')
  await expect(page.getByRole('list', { name: 'Bea canvas content' }).getByRole('listitem')).toHaveText(['Rectangle: ada-rectangle'])
  await expect(page.getByRole('list', { name: 'Active collaborators' })).toContainText('Ada')
})
```

- [ ] **Step 2: Run the focused E2E test and confirm it fails**

Run: `node_modules/.bin/playwright test examples/collaboration/e2e/collaboration.spec.ts`

Expected: FAIL because the example and local server are missing.

- [ ] **Step 3: Build the glassy two-client reference app**

Create two CanvasKit instances connected through an explicit in-memory adapter.
Show each client’s canvas, operation log, delivery controls, and labelled
presence list. Include deliberate out-of-order delivery and reconnect replay
controls. Do not import private Core modules.

- [ ] **Step 4: Run focused browser tests, example build, and docs build**

Run: `node_modules/.bin/playwright test examples/collaboration/e2e/collaboration.spec.ts`

Run: `node /Users/product/.cache/node/corepack/v1/pnpm/10.0.0/bin/pnpm.cjs --filter @canvaskit/collaboration-example build`

Run: `node /Users/product/.cache/node/corepack/v1/pnpm/10.0.0/bin/pnpm.cjs docs:build`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add examples/collaboration playwright.config.ts docs/.vitepress/config.mts docs/examples.md
git commit -m "feat(example): add collaboration runtime demo"
```

### Task 5: Phase 4 — V4 documentation and release-quality gate

**Files:**
- Modify: `README.md`, `CHANGELOG.md`, `docs/api/core.md`, `docs/migrations.md`, `.github/RELEASE_CHECKLIST.md`
- Create: `docs/architecture/v4-collaboration-runtime.md`, `docs/release-notes-v4.md`, `docs/release-assets-v4.md`
- Modify: relevant package version metadata and release verifier fixtures only when V4 is feature-complete.

**Interfaces:**
- Documents operation schema, transport adapter ownership, local/remote history behavior, and explicit non-goals.

- [ ] **Step 1: Write failing documentation/release verifier tests where versioned tooling changes**

```ts
test('uses the V4 stable version for packed manifests by default', () => {
  assert.deepEqual(verifyPackedManifest('@canvaskit/core', stableCoreManifest({ version: '4.0.0' })), [])
})
```

- [ ] **Step 2: Run the relevant verifier test and confirm it fails**

Run: `node --test scripts/release-readiness.test.mjs scripts/package-smoke.test.mjs`

Expected: FAIL after the V4 expectation is added and before release metadata changes.

- [ ] **Step 3: Freeze features and complete release artifacts**

Document Problem, Challenge, Decision, Architecture, and Trade-offs. Capture
three distinct screenshots plus a 5–15 second GIF from the passing
collaboration example. Store binary media only in an approved asset location.
Update version metadata and release tooling to `4.0.0` after all code is frozen.

- [ ] **Step 4: Run complete release validation**

Run: `node_modules/.bin/vitest run`

Run: `node_modules/.bin/playwright test --reporter=dot`

Run: `node /Users/product/.cache/node/corepack/v1/pnpm/10.0.0/bin/pnpm.cjs docs:build`

Run: `node scripts/bundle-size.mjs`

Run: `env CANVASKIT_PNPM_BIN=/Users/product/.cache/node/corepack/v1/pnpm/10.0.0/bin/pnpm.cjs node scripts/package-smoke.mjs`

Run: `node scripts/release-readiness.mjs`

Expected: every command exits 0; record actual test counts and bundle sizes.

- [ ] **Step 5: Commit**

```bash
git add README.md CHANGELOG.md docs .github/RELEASE_CHECKLIST.md packages pnpm-lock.yaml scripts
git commit -m "release: prepare CanvasKit v4.0.0"
```

## Plan self-review

- Each V4 spec milestone maps to one task with a testable developer outcome.
- All runtime interfaces used by later tasks are defined in Tasks 1–3.
- The plan has explicit red/green commands, validation constraints, and commits.
- No server, CRDT dependency, unapproved publication, or generated artifact is in scope.
