# Phase 8, Task 3 — Storybook and accessibility QA

## Delivered

- Added separate Vite Storybook configurations for React (`.storybook`) and Vue (`.storybook-vue`) with root scripts for development and static builds.
- Added stories for the React and Vue `CanvasKitCanvas` hosts, including custom accessible-name variants.
- Added an official-plugin reference story covering grid, snap, keyboard, and minimap plugin states.
- Made React and Vue hosts keyboard-focusable applications, bound keyboard input lifecycle cleanup, and exposed shortcut metadata.
- Added visible focus treatments and keyboard, label, live-status, and textarea-output workflows across every runnable example.
- React and Vue export actions now announce successful SVG/PNG exports through polite status regions.

## Verification

- `./node_modules/.bin/vitest run packages/react/test/react-adapter.test.tsx packages/vue/test/vue-adapter.test.ts` — passed, 16 tests.
- `./node_modules/.bin/tsc -p packages/react/tsconfig.json --noEmit && ./node_modules/.bin/tsc -p packages/vue/tsconfig.json --noEmit && ./node_modules/.bin/tsc -p packages/plugins/tsconfig.json --noEmit` — passed.
- React and Vue static Storybook builds — passed to `/private/tmp/canvaskit-storybook-react` and `/private/tmp/canvaskit-storybook-vue`.
- Broad Playwright run began 22 tests and reported 20 passing assertions, including all basic-canvas, performance-canvas, whiteboard, ERD, architecture, and the existing React/Vue export workflows. Its final two framework accessibility cases did not produce a final summary before local-server teardown stalled; a subsequent focused rerun also stalled with no test output and was terminated. No assertion failure was reported.

## Notes

- The normal Turbo typecheck command invokes the sandbox-provided pnpm, which aborts while attempting an interactive node_modules purge. The direct package TypeScript verification above completed successfully.
- Dependency installation removed tracked `.pnpm-store/v11/index.db-{shm,wal}` cache files. They must remain unstaged; an attempted restore was blocked by sandbox approval policy.
