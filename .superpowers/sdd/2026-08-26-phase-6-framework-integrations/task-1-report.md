# Phase 6 — Task 1 Report

## Outcome

Added the public `CanvasKit.subscribe(listener)` scene subscription contract. Subscribers receive the current `kit.getScene()` snapshot after scene replacement, commands, undo/redo, loading, and viewport navigation. The returned unsubscribe closure is idempotent.

## Files changed

- `packages/core/src/scene-subscription.ts` — minimal listener registry and exported `SceneListener` type.
- `packages/core/src/canvas-kit.ts` — public `subscribe` method and a private snapshot notifier wired to all required mutations.
- `packages/core/src/index.ts` — re-exports `SceneListener`.
- `packages/core/test/scene-subscription.test.ts` — regression coverage for snapshot delivery after `setScene` and idempotent unsubscribe behavior.

## TDD evidence

### RED

Command:

```sh
./node_modules/.bin/vitest run packages/core/test/scene-subscription.test.ts
```

Result: 1 failed test with the expected failure: `TypeError: kit.subscribe is not a function`.

### GREEN

Command:

```sh
./node_modules/.bin/vitest run packages/core/test/scene-subscription.test.ts && ./node_modules/.bin/tsc -p packages/core/tsconfig.json
```

Result: focused test passed (1/1) and Core TypeScript compilation exited successfully.

## Final verification

```sh
./node_modules/.bin/vitest run
./node_modules/.bin/tsc -p packages/core/tsconfig.json
git diff --check
```

Result: 22 test files / 92 tests passed, Core TypeScript compilation passed, and the diff has no whitespace errors.

`pnpm test` was not used for final verification because its wrapper attempted a non-interactive `node_modules` purge and aborted (`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`). The installed Vitest binary ran the same workspace suite successfully without modifying dependencies.

## Concerns

None. Existing unrelated `.DS_Store`, `.turbo/`, and Phase 6 planning-file changes were not included.
