# Task 2: Clipboard integrity and command API report

## Scope delivered

- Added `CanvasKit.cut()` as one history command. It snapshots the selected
  scene entities before removing nodes, dangling edges, affected group members,
  and empty groups.
- Added `EditorCommand` and `CanvasKit.executeCommand(command)` for all seven
  specified workflow commands.
- Clipboard commands report `false` if they cannot produce a visible workflow
  effect; selection commands report `true` when invoked.
- Kept clipboard data internal and serializable; no system clipboard behavior
  was introduced.

## Strict TDD evidence

### RED

After adding the focused test cases, this command was run:

```sh
./node_modules/.bin/vitest run packages/core/test/clipboard.test.ts packages/core/test/canvas-kit.test.ts packages/core/test/editor-command.test.ts
```

It failed with the expected missing-public-API errors:

- `TypeError: kit.cut is not a function` in the relation-cleanup/undo test.
- `TypeError: kit.executeCommand is not a function` in the command dispatch test.

Existing behavior already covered paste collision remapping, paste selection,
and the fixed twenty-pixel duplicate offset. The new red tests added cut
integrity/undo and command outcomes.

### GREEN

After implementing the smallest required clipboard removal helper and command
dispatcher, the focused suite passed: 3 files, 22 tests. The Core TypeScript
typecheck passed, and the full Core unit suite passed: 17 files, 86 tests.

## Verification commands

```sh
./node_modules/.bin/vitest run packages/core/test/clipboard.test.ts packages/core/test/canvas-kit.test.ts packages/core/test/editor-command.test.ts
./node_modules/.bin/tsc -p packages/core/tsconfig.json --noEmit
./node_modules/.bin/vitest run packages/core/test
git diff --check
```

All commands completed successfully. Vitest emitted its existing workspace-file
deprecation notice but no test failures or compiler errors.

## Changed files

- `packages/core/src/clipboard.ts` — immutable relation-aware selected-node removal.
- `packages/core/src/canvas-kit.ts` — cut behavior and command dispatch.
- `packages/core/src/editor-command.ts` — public command union.
- `packages/core/src/index.ts` — public `EditorCommand` type export.
- `packages/core/test/clipboard.test.ts` — cut cleanup and undo regression test.
- `packages/core/test/editor-command.test.ts` — command outcome regression test.

## Commit

Committed with message `feat: add editor clipboard and commands`.

## Concerns / handoff notes

- This task deliberately does not modify the DOM keyboard adapter; Task 3 can
  route keyboard shortcuts through `executeCommand`.
- The repository had pre-existing generated cache/log/store changes. They were
  left untouched and excluded from this commit.

## Review round 1: clipboard snapshot isolation

Review found that `copy()` and `cut()` returned the same mutable clipboard
object used later by `paste()`. The new regression tests mutate the returned
copy and cut snapshots, then assert that paste still inserts the original node
ID and position.

### RED

The focused suite failed in both new tests before the fix: after callers set the
returned node ID to `caller-modified`, `paste()` inserted
`caller-modified-copy` rather than `a-copy`.

### GREEN

`cloneClipboard()` now creates a deep-enough snapshot for every current scene
entity shape (node position, edges, and group member arrays). `copy()` and both
paths through `cut()` return that snapshot instead of the internal clipboard.

Verification after the fix:

```sh
./node_modules/.bin/vitest run packages/core/test/clipboard.test.ts packages/core/test/canvas-kit.test.ts packages/core/test/editor-command.test.ts
./node_modules/.bin/tsc -p packages/core/tsconfig.json --noEmit
./node_modules/.bin/vitest run packages/core/test
git diff --check
```

Results: focused suite 24/24 tests, full Core suite 88/88 tests, typecheck and
diff check passed. This follow-up is committed separately as
`fix: protect clipboard snapshots`.
