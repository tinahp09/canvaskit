# CanvasKit V6 Editor Session & Commands Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship headless multi-document editor sessions and an extensible command/keybinding layer for professional CanvasKit hosts.

**Architecture:** `EditorSession` owns document identity, active-document state, saved baselines, and subscriptions around independent `CanvasKit` instances. `CommandRegistry` is a separate pure Core primitive that resolves normalized shortcuts and invokes built-in or host commands using an active-document context.

**Tech Stack:** TypeScript, CanvasKit Core, Vitest, Vite, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-02-v6-editor-session-commands-design.md`

## Global Constraints

- No scene schema change, filesystem, browser-tab API, storage, backend, auth, autosave, CRDT, or cross-document transactions.
- New Core APIs must be root exports and immutable at their public boundaries.
- Dirty state compares canonical serialized scenes with a saved baseline.
- Keyboard normalization is platform-neutral; event listener attachment remains host-owned.
- Use red/green tests before every behavior change; never stage `dist`, `.turbo`, `.pnpm-store`, or test results.

### Task 1: Command registry

**Files:** Create `packages/core/src/command-registry.ts`, `packages/core/test/command-registry.test.ts`; modify `packages/core/src/index.ts`.

**Produces:** `CommandRegistry`, `EditorCommandDefinition`, `CommandContext`, `CommandResult`, `normalizeShortcut`.

- [ ] **Step 1: Write failing tests** for duplicate ID rejection, deterministic title-sorted listing, disabled command results, `Mod+Shift+K` normalization, and shortcut lookup.
- [ ] **Step 2: Verify red** with `node_modules/.bin/vitest run packages/core/test/command-registry.test.ts`.
- [ ] **Step 3: Implement minimal registry** with `register`, `unregister`, `getSnapshot`, `findByShortcut`, and `execute`; return `{ executed: false, reason: 'missing' | 'disabled' }` rather than throw for execution failure.
- [ ] **Step 4: Verify green** with the focused test and Core typecheck.
- [ ] **Step 5: Commit** `feat(core): add command registry`.

### Task 2: Editor session lifecycle and dirty state

**Files:** Create `packages/core/src/editor-session.ts`, `packages/core/test/editor-session.test.ts`; modify `packages/core/src/index.ts`.

**Produces:** `EditorSession`, `EditorSessionSnapshot`, `EditorDocumentSnapshot`, `CloseDocumentResult`.

- [ ] **Step 1: Write failing tests** for opening/activating documents, duplicate IDs, dirty transition after `kit.execute`, save baseline reset, non-forced dirty close returning `requiresConfirmation`, forced close, and detached subscriptions after close.
- [ ] **Step 2: Verify red** with `node_modules/.bin/vitest run packages/core/test/editor-session.test.ts`.
- [ ] **Step 3: Implement `EditorSession`**: retain `{ id, title, kit, baseline, unsubscribe }`, subscribe through `kit.subscribe`, compare `serializeScene(kit.getScene())`, and emit frozen snapshots sorted by document open order.
- [ ] **Step 4: Verify green** with focused session and existing CanvasKit tests.
- [ ] **Step 5: Commit** `feat(core): add editor session lifecycle`.

### Task 3: Built-in command bridge

**Files:** Modify `packages/core/src/editor-session.ts`, `packages/core/test/editor-session.test.ts`.

**Produces:** `session.commands` preloaded with definitions that call active `kit.executeCommand` and expose only enabled commands in snapshots.

- [ ] **Step 1: Write failing tests** that palette command `select-all` mutates only the active document and `delete-selection` is disabled when selection is empty.
- [ ] **Step 2: Verify red** with the session focused test.
- [ ] **Step 3: Register built-ins** from `EditorCommand`, with availability predicates based on active kit selection and `execute` delegating to `kit.executeCommand`.
- [ ] **Step 4: Verify green** with all Core tests.
- [ ] **Step 5: Commit** `feat(core): bridge session commands to CanvasKit`.

### Task 4: Reference editor and browser proof

**Files:** Create `examples/editor-session/*`; modify `playwright.config.ts`, `docs/examples.md`.

**Produces:** Glassy two-document demo with tab buttons, dirty indicator, command-palette dialog, and accessible status text.

- [ ] **Step 1: Write failing Playwright scenarios**: switching tabs preserves independent scenes; adding a rectangle marks only its tab dirty; command-palette `Select all` acts on active tab.
- [ ] **Step 2: Verify red** using the focused new E2E spec.
- [ ] **Step 3: Implement demo** using only Core root exports; use a host DOM key listener for `Mod+K` and no new dependencies.
- [ ] **Step 4: Verify green** with example build and focused E2E.
- [ ] **Step 5: Commit** `feat(example): add editor session demo`.

### Task 5: V6 release candidate

**Files:** Modify `README.md`, `CHANGELOG.md`, docs navigation, release tooling, all package metadata and lockfile; create V6 API, architecture, release notes/assets, and release media.

- [ ] **Step 1: Add failing release-version tests** expecting `6.0.0` and the current public package set.
- [ ] **Step 2: Verify red** via release-tool tests.
- [ ] **Step 3: Feature-freeze and document** the session/command boundary, no-storage constraint, migration status, architecture trade-offs, screenshots, and a 5–15 second GIF.
- [ ] **Step 4: Update versions and run full gates**: release build, typecheck, unit tests, all E2E, docs build, bundle check, fresh-consumer smoke, and release verifier.
- [ ] **Step 5: Commit** `release: prepare CanvasKit v6.0.0`.

## Self-review

Task 1 covers deterministic command data and shortcut lookup; Tasks 2–3 cover all session, dirty-state, close-policy, and active-command behavior; Task 4 proves host integration; Task 5 covers release requirements. No schema, persistence, or backend work is included.
