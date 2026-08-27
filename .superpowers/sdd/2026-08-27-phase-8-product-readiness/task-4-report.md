# Phase 8, Task 4 — Contributor and release readiness

## Delivered

- Added `CONTRIBUTING.md` with pnpm 10 setup, built-workspace guidance, contribution expectations, package Changeset guidance, and validation commands.
- Added `CODE_OF_CONDUCT.md`, adapted from Contributor Covenant 2.1, with scope and maintainer enforcement guidance.
- Added `SECURITY.md` with a latest-release support policy and private GitHub advisory reporting path.
- Added VitePress-published release assets:
  - `docs/release-checklist.md` for candidate preparation, complete validation, review, publication, and post-release verification;
  - `docs/rc-feedback.md` with reproducible defect, accessibility, and performance feedback fields; and
  - release-readiness sidebar navigation in `docs/.vitepress/config.mts`.
- Added `.changeset/phase-eight.md`, declaring minor releases for the changed framework packages `@canvaskit/react` and `@canvaskit/vue`.

## RC finding and correction

The prior broad Playwright run did not stall in application teardown: its final two framework accessibility tests each waited for a nonexistent `application` role for 30 seconds, then failed. The workspace framework packages export `dist/`, and the earlier E2E invocation had used stale built output that lacked the new focusability, role, and shortcut attributes.

`pnpm build` rebuilt the package entry points. The focused framework suite then exposed a second test-only error: the safe-output checks assumed a Vite-served page had zero `<script>` elements. The tests now record the initial script count and verify SVG export does not add any scripts, while retaining the labelled canvas, focus, visible outline, keyboard navigation, live-status, and readonly-textarea assertions.

Focused verification after the correction:

```text
./node_modules/.bin/playwright test examples/react-canvas/e2e/canvas.spec.ts examples/vue-canvas/e2e/canvas.spec.ts --workers=1 --reporter=line
4 passed (5.5s)
```

## Full verification evidence

| Command | Result |
| --- | --- |
| `pnpm build` | Passed; Turbo completed 14/14 package builds in 5.024s. |
| `pnpm typecheck` | Passed; Turbo completed 7/7 typecheck tasks in 3.355s. |
| `pnpm test` | Passed; 27 test files and 122 tests passed. |
| `pnpm docs:build` | Passed; VitePress client/server build and page rendering completed in 2.59s. |
| `pnpm storybook:build` | Passed; React Storybook static build completed. |
| `pnpm storybook:vue:build` | Passed; Vue Storybook static build completed. |
| `pnpm test:e2e -- --workers=1 --reporter=line` | Passed; all 22 Playwright tests, including React and Vue accessibility workflows, completed with the final `22 passed (12.8s)` summary. |
| `git diff --check` | Passed; no whitespace errors. |

The Storybook builds emitted their dependency's existing `eval` minification warning from `@storybook/core` but exited successfully. It is recorded for awareness and was not introduced by this task.

## Final review corrections

- Added additive Shift/Control/Command pointer selection to the ERD and Architecture editors, including text-label-to-rectangle selection so two-node connections are reachable without precision workarounds.
- Added real E2E workflows that select two nodes, create a previously absent edge, export the scene, and assert the new relationship in both editors.
- Added Architecture text nodes for Gateway, Catalog, Orders, and Database, plus an accessible service list referenced by the canvas. The Notifications action adds both its visible canvas label and accessible list item.
- Made selection changes observable through `CanvasKit` scene subscriptions. React and Vue host tests prove Control+A schedules a renderer frame and executes that redraw, rather than checking focusability alone.
- Set all seven published package versions to `0.9.0`, updated internal workspace and framework peer ranges to `workspace:^0.9.0`, updated the lockfile, and expanded the Phase 8 Changeset to cover the full published package suite.
- Replaced the Core API page with a curated inventory of every package-root export, including clipboard, controllers, registries, pointer/history/plugin types, and the `CanvasKit` `clearHistory`, `toJSON`, `load`, and `createPointerEvent` methods.

### Final review verification

| Command | Result |
| --- | --- |
| `./node_modules/.bin/vitest run packages/react/test/react-adapter.test.tsx packages/vue/test/vue-adapter.test.ts` | RED: 2 new keyboard-selection redraw tests failed because no animation frame was requested. |
| Same focused Vitest command after the Core selection notification change | GREEN: 18/18 tests passed. |
| Focused ERD/Architecture Playwright suite before the implementation | RED: service description and both two-node connection workflows failed. |
| Same focused E2E suite after the implementation | GREEN: 9/9 tests passed. |
| `corepack pnpm@10.0.0 build` | Passed; final rerun completed 14/14 package builds in 5.838s. |
| `corepack pnpm@10.0.0 typecheck` | Passed; final rerun completed 7/7 tasks in 3.562s. |
| `corepack pnpm@10.0.0 test` | Passed; 27 files and 124 tests. |
| `corepack pnpm@10.0.0 docs:build` | Passed; VitePress rendered all pages. |
| `corepack pnpm@10.0.0 storybook:build` and `storybook:vue:build` | Passed; React and Vue static builds completed. |
| `corepack pnpm@10.0.0 test:e2e -- --reporter=line` | Passed; final Playwright summary: 25 passed (14.4s). |

The environment's fallback pnpm 11 initially attempted a non-interactive `node_modules` purge and aborted. Corepack supplied the repository-declared pnpm 10.0.0; the successful build's child commands verified the lockfile and completed normally.

## Staging scope

Only Task 4 documentation, the two corrected framework E2E specs, the Phase 8 Changeset, and this evidence report are staged. Generated `.turbo`/`storybook-static` output, `.pnpm-store` state, and the untracked Phase 8 plan remain unstaged.
