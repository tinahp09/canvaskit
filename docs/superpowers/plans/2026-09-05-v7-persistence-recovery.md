# V7 Persistence and Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give host applications a storage-neutral, asynchronous document save, load, restore, retry, and status API on top of V6 editor sessions.

**Architecture:** Keep `EditorSession` synchronous and storage-free. Add a small `DocumentStorageAdapter` port plus `PersistentEditorSession`, which owns asynchronous adapter calls and projects persistence state into frozen snapshots. The V7 demo supplies an in-memory, REST-shaped adapter only as an example implementation.

**Tech Stack:** TypeScript, Vitest, Vite, Playwright, VitePress, pnpm workspaces.

**Spec:** `docs/superpowers/specs/2026-09-05-v7-persistence-recovery-design.md`

## Global Constraints

- Core must remain browser-, filesystem-, network-, auth-, CRDT-, and backend-agnostic.
- `DocumentStorageAdapter` is injected by the host; no storage implementation is exported from Core.
- Persisted scene strings must be validated with `loadScene` before a CanvasKit is opened.
- A successful earlier save must never clean a scene that changed while the save was pending.
- All public snapshots and document entries are immutable.
- Do not stage generated `.turbo`, `.pnpm-store`, or `storybook-static` files.
- Use test-first red/green cycles for every production behavior.

---

## File Structure

- Create `packages/core/src/document-storage.ts`: public adapter types.
- Create `packages/core/src/persistent-editor-session.ts`: async storage orchestration around an internal `EditorSession`.
- Modify `packages/core/src/editor-session.ts`: captured-save baseline method with no mutable state exposure.
- Modify `packages/core/src/index.ts`: root exports.
- Create `packages/core/test/persistent-editor-session.test.ts`: adapter-driven unit coverage.
- Modify `examples/editor-session/src/main.ts`, `style.css`, and E2E tests for the usable V7 demo.
- Add API/architecture/release documentation, release media, version metadata, and release checks after behavior passes.

### Task 1: Storage port and captured-save baseline

**Files:**
- Create: `packages/core/src/document-storage.ts`
- Modify: `packages/core/src/editor-session.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/test/persistent-editor-session.test.ts`

**Interfaces:**
- Produces: `StoredDocument`, `DocumentStorageAdapter`, `DocumentPersistenceStatus`, and `EditorSession.markDocumentSaved(id, serializedScene): boolean`.
- Consumes: `serializeScene` and existing V6 document ids.

- [ ] **Step 1: Write the failing contract test**

```ts
import { CanvasKit, EditorSession, type DocumentStorageAdapter } from '../src/index.js'

it('accepts a captured scene as clean only when it is still current', () => {
  const session = new EditorSession()
  const kit = new CanvasKit()
  session.openDocument({ id: 'brief', title: 'Brief', kit })
  const captured = JSON.stringify(kit.getScene())

  expect(session.markDocumentSaved('brief', captured)).toBe(true)
  expect(session.getSnapshot().documents[0]?.isDirty).toBe(false)

  const adapter: DocumentStorageAdapter = {
    list: async () => [], load: async () => undefined, save: async (document) => document,
  }
  expect(adapter).toBeDefined()
})
```

- [ ] **Step 2: Run the test and verify it fails because exports and method are missing**

Run: `pnpm --filter @canvaskit/core exec vitest run test/persistent-editor-session.test.ts`

Expected: TypeScript or runtime failure identifying `markDocumentSaved` and/or `DocumentStorageAdapter`.

- [ ] **Step 3: Implement the minimal public contracts**

```ts
export interface StoredDocument {
  readonly id: string
  readonly title: string
  readonly scene: string
  readonly updatedAt: string
  readonly revision?: string
}

export interface DocumentStorageAdapter {
  list(): Promise<readonly StoredDocument[]>
  load(id: string): Promise<StoredDocument | undefined>
  save(document: StoredDocument): Promise<StoredDocument>
}

export type DocumentPersistenceStatus = 'idle' | 'loading' | 'saving' | 'saved' | 'error'
```

Implement `markDocumentSaved` to compare `serializeScene(document.kit.getScene())` to the captured string; only then update baseline and notify. Export all public names from Core.

- [ ] **Step 4: Run the focused test and typecheck**

Run: `pnpm --filter @canvaskit/core exec vitest run test/persistent-editor-session.test.ts && pnpm --filter @canvaskit/core typecheck`

Expected: test passes and Core reports no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/document-storage.ts packages/core/src/editor-session.ts packages/core/src/index.ts packages/core/test/persistent-editor-session.test.ts
git commit -m "feat(core): add document storage contracts"
```

### Task 2: Persistent editor-session lifecycle

**Files:**
- Create: `packages/core/src/persistent-editor-session.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/test/persistent-editor-session.test.ts`

**Interfaces:**
- Consumes: Task 1 contracts, `EditorSession`, `CanvasKit`, and `loadScene`.
- Produces: `PersistentEditorSession`, `PersistentEditorSessionSnapshot`, and `PersistentEditorDocumentSnapshot`.

- [ ] **Step 1: Write failing restore and missing-record tests**

```ts
it('restores listed records in adapter order and activates the first document', async () => {
  const session = new PersistentEditorSession({ storage: createMemoryStorage([stored('brief'), stored('poster')]) })

  await expect(session.restore()).resolves.toBe(true)
  expect(session.getSnapshot()).toMatchObject({
    activeDocumentId: 'brief', isRestoring: false,
    documents: [{ id: 'brief', persistence: 'saved' }, { id: 'poster', persistence: 'saved' }],
  })
})

it('returns false when an adapter load has no record', async () => {
  const session = new PersistentEditorSession({ storage: createMemoryStorage([]) })
  await expect(session.loadDocument('missing')).resolves.toBe(false)
})
```

- [ ] **Step 2: Run the focused test and verify `PersistentEditorSession` is missing**

Run: `pnpm --filter @canvaskit/core exec vitest run test/persistent-editor-session.test.ts`

Expected: test failure resolving `PersistentEditorSession`.

- [ ] **Step 3: Implement the lifecycle wrapper**

```ts
export interface PersistentEditorSessionOptions {
  readonly storage: DocumentStorageAdapter
  readonly createCanvasKit?: (document: StoredDocument) => CanvasKit
}

export class PersistentEditorSession {
  constructor(options: PersistentEditorSessionOptions)
  restore(): Promise<boolean>
  loadDocument(id: string): Promise<boolean>
  getDocument(id: string): CanvasKit | undefined
  getActiveDocument(): CanvasKit | undefined
  activateDocument(id: string): boolean
  getSnapshot(): PersistentEditorSessionSnapshot
  subscribe(listener: (snapshot: PersistentEditorSessionSnapshot) => void): () => void
  dispose(): void
}
```

Call `loadScene(record.scene)` before a default `new CanvasKit({ scene })`. Freeze copied records. On adapter/deserialization failure retain opened documents, set status to `error`, and expose `error instanceof Error ? error.message : 'Unable to load document.'`.

- [ ] **Step 4: Run focused tests and typecheck**

Run: `pnpm --filter @canvaskit/core exec vitest run test/persistent-editor-session.test.ts && pnpm --filter @canvaskit/core typecheck`

Expected: lifecycle tests pass and typecheck exits 0.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/persistent-editor-session.ts packages/core/src/index.ts packages/core/test/persistent-editor-session.test.ts
git commit -m "feat(core): add persistent editor session"
```

### Task 3: Save, failure, retry, and stale-save protection

**Files:**
- Modify: `packages/core/src/persistent-editor-session.ts`
- Test: `packages/core/test/persistent-editor-session.test.ts`

**Interfaces:**
- Consumes: Tasks 1–2.
- Produces: `saveDocument(id?)`, `retrySave(id?)`, status transitions, metadata updates, and concurrent-save protection.

- [ ] **Step 1: Write failing save behavior tests**

```ts
it('keeps a document dirty when it changes while an earlier save is pending', async () => {
  const pending = deferred<StoredDocument>()
  const session = openPersistentSession({ save: async () => pending.promise })
  addTestRectangle(session.getActiveDocument()!, 'one')
  const saving = session.saveDocument()
  addTestRectangle(session.getActiveDocument()!, 'two')
  pending.resolve(stored('brief', session.getActiveDocument()!))

  await saving
  expect(session.getSnapshot().documents[0]).toMatchObject({ persistence: 'saved', isDirty: true })
})

it('retains a dirty document after failure and retries from its current scene', async () => {
  const save = vi.fn().mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce(stored('brief'))
  const session = openPersistentSession({ save })
  addTestRectangle(session.getActiveDocument()!, 'one')

  await expect(session.saveDocument()).resolves.toBe(false)
  expect(session.getSnapshot().documents[0]).toMatchObject({ persistence: 'error', error: 'Offline', isDirty: true })
  await expect(session.retrySave()).resolves.toBe(true)
  expect(session.getSnapshot().documents[0]).toMatchObject({ persistence: 'saved', isDirty: false })
})
```

- [ ] **Step 2: Run focused tests and verify save methods are missing**

Run: `pnpm --filter @canvaskit/core exec vitest run test/persistent-editor-session.test.ts`

Expected: failure resolving `saveDocument` and `retrySave`.

- [ ] **Step 3: Implement captured-save semantics**

At save start return `false` for no target, a missing document, or an existing `saving` state. Capture `serializeScene(kit.getScene())`, set status `saving`, then call:

```ts
const persisted = await storage.save({
  id: document.id,
  title: document.title,
  scene: capturedScene,
  updatedAt: document.updatedAt ?? new Date().toISOString(),
  ...(document.revision === undefined ? {} : { revision: document.revision }),
})
```

On success update metadata, set `saved`, and call `session.markDocumentSaved(id, capturedScene)`. On failure set `error` without changing the V6 baseline. `retrySave` creates a fresh `saveDocument`.

- [ ] **Step 4: Run focused tests and all Core tests**

Run: `pnpm --filter @canvaskit/core exec vitest run test/persistent-editor-session.test.ts && pnpm --filter @canvaskit/core exec vitest run`

Expected: V7 and existing Core tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/persistent-editor-session.ts packages/core/test/persistent-editor-session.test.ts
git commit -m "feat(core): persist editor session documents"
```

### Task 4: V7 reference demo and browser evidence

**Files:**
- Modify: `examples/editor-session/src/main.ts`
- Modify: `examples/editor-session/src/style.css`
- Modify: `examples/editor-session/e2e/editor-session.spec.ts`

**Interfaces:**
- Consumes: `PersistentEditorSession` and `DocumentStorageAdapter`.
- Produces: visible restore, save status, simulated error, and retry workflows.

- [ ] **Step 1: Write failing Playwright tests**

```ts
test('saves and restores the active document through the V7 adapter', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'Add rectangle' }).click()
  await page.getByRole('button', { name: 'Save active' }).click()
  await expect(page.getByLabel('Creative brief persistence')).toHaveText('Saved')
  await page.getByRole('button', { name: 'Restore workspace' }).click()
  await expect(page.getByRole('tabpanel')).toContainText('1 rectangle')
})

test('shows adapter failure and retries the current save', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'Simulate save failure' }).click()
  await page.getByRole('button', { name: 'Save active' }).click()
  await expect(page.getByLabel('Creative brief persistence')).toHaveText('Error')
  await page.getByRole('button', { name: 'Retry save' }).click()
  await expect(page.getByLabel('Creative brief persistence')).toHaveText('Saved')
})
```

- [ ] **Step 2: Run E2E and verify missing V7 controls fail**

Run: `pnpm --filter @canvaskit/editor-session-example build && pnpm exec playwright test examples/editor-session/e2e/editor-session.spec.ts`

Expected: browser tests fail because Restore, failure, and retry controls do not exist.

- [ ] **Step 3: Add the example-only memory adapter and controls**

Create a module-local `Map<string, StoredDocument>` adapter with short async delay. Seed documents once, create `PersistentEditorSession`, and render accessible `Restore workspace`, `Save active`, `Simulate save failure`, and `Retry save` buttons. Tabs expose `aria-label="${title} persistence"`; inspector shows error and `updatedAt`. Keep V6 glass design and command palette.

- [ ] **Step 4: Run demo build and browser suite**

Run: `pnpm --filter @canvaskit/editor-session-example build && pnpm exec playwright test examples/editor-session/e2e/editor-session.spec.ts`

Expected: V6 regressions and the new V7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add examples/editor-session/src/main.ts examples/editor-session/src/style.css examples/editor-session/e2e/editor-session.spec.ts
git commit -m "feat(example): demonstrate V7 persistence"
```

### Task 5: Release documentation, media, metadata, and validation

**Files:**
- Create: `docs/api/persistent-editor-session.md`, `docs/architecture/v7-persistence-recovery.md`, `docs/release-notes-v7.md`, `docs/release-assets-v7.md`
- Create: `docs/public/releases/v7/v7.0-overview.png`, `v7.0-save-status.png`, `v7.0-retry.png`, `v7.0-persistence.gif`
- Modify: `README.md`, `CHANGELOG.md`, `docs/.vitepress/config.mts`, `.github/RELEASE_CHECKLIST.md`, publishable package manifests, `pnpm-lock.yaml`, and release-readiness expectations.
- Test: release readiness scripts and full quality gates.

**Interfaces:**
- Consumes: verified public API and browser behavior.
- Produces: versioned 7.0.0 release artifacts and developer guidance.

- [ ] **Step 1: Document API and architecture**

Document adapter methods, persistent session lifecycle, metadata/status snapshots, stale-save behavior, error/retry policy, and V7 non-goals. Architecture document answers Problem, Challenge, Decision, Architecture, and Trade-offs.

- [ ] **Step 2: Capture release evidence**

Capture three screenshots (workspace overview, save status, error/retry) and a 5–15 second GIF (add rectangle → save → restore → simulated error → retry). Add captions and alt text in `docs/release-assets-v7.md`.

- [ ] **Step 3: Prepare feature-freeze metadata**

Bump every publishable package and workspace dependency reference from `6.0.0` to `7.0.0`; update lockfile; add changelog and release notes; check Code, Documentation, and Media items only after evidence exists.

- [ ] **Step 4: Run full release verification**

```bash
pnpm typecheck
pnpm test
pnpm docs:build
pnpm test:release
pnpm build:release
pnpm test:bundle-size
pnpm bundle:size
pnpm test:pack
pnpm test:e2e
```

Expected: every command exits 0. Generated cache output stays untracked.

- [ ] **Step 5: Commit**

```bash
git add README.md CHANGELOG.md .github/RELEASE_CHECKLIST.md docs packages package.json pnpm-lock.yaml scripts examples/editor-session
git commit -m "release: prepare CanvasKit v7.0.0"
```

## Plan Self-Review

- Spec coverage: Tasks 1–3 cover storage neutrality, validation, lifecycle, immutable status, stale-save protection, errors, retry, and future conflict metadata. Task 4 provides browser proof. Task 5 covers all release evidence and gates.
- Placeholder scan: no incomplete requirements appear; autosave, offline replication, merging, and concrete backend adapters are deliberately stated V7 non-goals.
- Type consistency: `DocumentStorageAdapter`, `StoredDocument`, `PersistentEditorSession`, `saveDocument`, `retrySave`, and `markDocumentSaved` use the same names and contracts throughout.
