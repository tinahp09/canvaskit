# V9 Autosave and Recovery Journal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add host-injected autosave and crash-recovery journal primitives to CanvasKit V9.

**Architecture:** Keep V7 durable document persistence unchanged. Add a journal storage port, a recovery controller that explicitly reads/restores/discards journal records, and an autosave controller that journals a canonical snapshot before delegating the durable save to `PersistentEditorSession`.

**Tech Stack:** TypeScript, Vitest, Playwright, Vite, pnpm workspaces.

**Spec:** `docs/superpowers/specs/2026-09-08-v9-autosave-recovery-journal-design.md`

## Global Constraints

- All storage remains host-injected; Core must not use browser storage, filesystem APIs, or network clients.
- Default autosave delay is exactly `800` milliseconds.
- V9 does not implement cloud sync, queues, merge, CRDTs, or conflict UI.
- Public packages move together to `9.0.0`; Scene V7 remains unchanged.

---

### Task 1: Recovery journal contracts and controller

**Files:**
- Create: `packages/core/src/recovery-journal.ts`
- Create: `packages/core/test/recovery-journal.test.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Produces `RecoveryJournalEntry`, `RecoveryJournalStorageAdapter`, and `RecoveryJournalController`.
- Consumes `PersistentEditorSession` and V7 `StoredDocument`.

- [ ] **Step 1: Write failing recovery tests**

```ts
await expect(controller.hasRecovery('brief')).resolves.toBe(true)
await expect(controller.restoreRecovery('brief')).resolves.toBe(true)
await expect(controller.discardRecovery('brief')).resolves.toBe(true)
```

- [ ] **Step 2: Run focused test**

Run: `pnpm --filter @canvaskit/core exec vitest run test/recovery-journal.test.ts`

Expected: failure because journal contracts are not exported.

- [ ] **Step 3: Implement journal API**

```ts
export interface RecoveryJournalStorageAdapter {
  load(documentId: string): Promise<RecoveryJournalEntry | undefined>
  save(entry: RecoveryJournalEntry): Promise<void>
  remove(documentId: string): Promise<void>
}
```

Validate journal scene data through V7 loading before replacing an open document.

- [ ] **Step 4: Run focused test**

Run: `pnpm --filter @canvaskit/core exec vitest run test/recovery-journal.test.ts`

Expected: pass.

### Task 2: Debounced autosave controller

**Files:**
- Create: `packages/core/src/autosave.ts`
- Create: `packages/core/test/autosave.test.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Consumes `PersistentEditorSession` and `RecoveryJournalStorageAdapter` from Task 1.
- Produces `AutosaveController`, `AutosaveSnapshot`, and per-document statuses.

- [ ] **Step 1: Write failing fake-timer tests**

```ts
vi.advanceTimersByTime(800)
await expect(flushPromises()).resolves.toBeUndefined()
expect(storage.save).toHaveBeenCalledOnce()
expect(journal.remove).toHaveBeenCalledWith('brief')
```

Cover replacement debounce, journal-write failure, durable-save failure retaining recovery, stale edits scheduling a next save, and disposal cancelling a pending timer.

- [ ] **Step 2: Run focused test**

Run: `pnpm --filter @canvaskit/core exec vitest run test/autosave.test.ts`

Expected: failure because `AutosaveController` is absent.

- [ ] **Step 3: Implement autosave API**

Use `session.subscribe`, canonical serialization, one timer per id, and frozen snapshots. Journal before `session.saveDocument(id)`; remove only if the document is no longer dirty after a successful save.

- [ ] **Step 4: Run focused test**

Run: `pnpm --filter @canvaskit/core exec vitest run test/autosave.test.ts`

Expected: pass.

### Task 3: Browser demo and E2E evidence

**Files:**
- Modify: `examples/editor-session/src/main.ts`
- Modify: `examples/editor-session/e2e/editor-session.spec.ts`

- [ ] **Step 1: Add a failing browser test**

```ts
await page.getByRole('button', { name: 'Add rectangle' }).click()
await expect(page.getByLabel('Autosave status')).toHaveText('Saved')
await page.getByRole('button', { name: 'Recover changes' }).click()
```

- [ ] **Step 2: Run example E2E**

Run: `pnpm exec playwright test examples/editor-session/e2e/editor-session.spec.ts`

Expected: failure because V9 controls do not exist.

- [ ] **Step 3: Implement in-memory V9 demo adapters and controls**

Expose autosave state, recovery availability, simulated durable-save failure, recover, and discard controls. Preserve existing V7/V8 workflows.

- [ ] **Step 4: Run example E2E**

Run: `pnpm exec playwright test examples/editor-session/e2e/editor-session.spec.ts`

Expected: pass.

### Task 4: V9 release preparation and verification

**Files:**
- Create: `docs/api/autosave-recovery.md`
- Create: `docs/architecture/v9-autosave-recovery.md`
- Create: `docs/release-notes-v9.md`
- Create: `docs/release-assets-v9.md`
- Create: `docs/public/releases/v9/`
- Modify: `README.md`, `CHANGELOG.md`, `.github/RELEASE_CHECKLIST.md`, `docs/.vitepress/config.mts`
- Modify: all public package manifests, `pnpm-lock.yaml`, release scripts and tests.

- [ ] **Step 1: Document the verified public contracts and architecture**

Include explicit scope exclusions and error policy.

- [ ] **Step 2: Capture release evidence**

Create overview, autosave-status, recovery-action screenshots and a 5–15 second GIF from the V9 demo.

- [ ] **Step 3: Bump versions and release gates to 9.0.0**

Update every public package and internal published range together.

- [ ] **Step 4: Run full verification**

Run: `pnpm test`, `pnpm typecheck`, `pnpm docs:build`, `pnpm test:release`, `pnpm test:pack`, `pnpm verify:release-quality`, and `pnpm test:e2e`.

Expected: all commands exit zero.

## Plan Self-Review

Task 1 covers explicit journal lifecycle, Task 2 covers safe debounced persistence, Task 3 provides browser proof, and Task 4 covers V9 documentation, media, versioning, and release gates. The plan contains no concrete storage or cloud-sync implementation.
