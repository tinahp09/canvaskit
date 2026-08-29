# Phase 9 Task 4 report: release CanvasKit V1

## Outcome

Prepared the complete public release documentation and final audited release
contract for CanvasKit `1.0.0` without publishing, tagging, or pushing.

- Added V1 release notes covering the seven packages, stable capabilities,
  compatibility, release evidence, and intentional product boundaries.
- Added pre-1.0 upgrade guidance for aligned package versions, root-only
  imports, scene schema compatibility, framework peers, adapter ownership, and
  official plugin calls.
- Added an owner-oriented publishing runbook with authority checks, exact
  gates, pnpm artifact inspection, dependency-order publication, registry and
  consumer verification, and partial-release recovery.
- Added `.changeset/phase-nine.md`, recording the major transition of all seven
  publishable packages to the first stable package suite.
- Linked the V1 documents from the README, API stability policy, release
  checklist, and VitePress navigation. The stable-release audit now requires
  the release notes, upgrade guide, publishing runbook, and V1 Changeset.

## RC findings resolved

### Consumer-invalid npm tarball manifests

The Task 3 smoke check used `npm pack`. Direct tarball inspection showed that
npm preserved source manifest ranges such as `workspace:^1.0.0`, so a smoke
check could pass even though the packed manifest was not safe for a standalone
npm consumer.

The pack checker now uses `pnpm pack --json`, which rewrites workspace ranges
to consumer semver, extracts and validates each packed `package.json`, and
rejects the wrong name, version, root export, internal range, or any remaining
`workspace:` protocol. Regression tests were observed failing before each new
validation was implemented. A clean offline npm consumer then installed and
imported all seven generated package roots.

### Public API documentation mismatches

Declaration/source comparison found two incorrect plugin descriptions:

- `createKeyboardPlugin` requires the focusable `HTMLElement` argument.
- `MinimapPlugin` exposes a `summary` getter rather than
  `getSceneSummary()`.

The official plugin API reference and V1 upgrade guidance now match the public
root declarations.

### Browser validation absent from release CI

The general release checklist requires browser coverage, but the release
workflow did not execute Playwright. The workflow now installs Chrome through
Playwright and runs `pnpm test:e2e` before release-quality and package dry-run
checks. The installed Playwright CLI recognizes the Chrome install target and
the workflow YAML parses successfully.

No RC finding remains deferred by this task.

## Public artifact review

- Confirmed all seven source manifests are `1.0.0`, expose only `.`, allowlist
  `dist`, and use `workspace:^1.0.0` for internal workspace relationships.
- Compared every package-root export and generated declaration inventory with
  the seven API reference pages; corrected the two plugin discrepancies above.
- Confirmed the repository-wide audit finds no private CanvasKit imports in
  packages, examples, README, contributor guidance, or public documentation.
- Packed every package with pnpm and confirmed each archive contains only
  `package.json` and `dist/**`, including `dist/index.js` and
  `dist/index.d.ts`.
- Confirmed packed names and versions, root JavaScript/declaration exports,
  and internal consumer ranges of `^1.0.0`; no packed dependency field retains
  a workspace protocol.
- Installed all seven tarballs together in a new offline npm consumer and
  imported all seven public package roots successfully with their existing
  React, React DOM, and Vue peers.
- Confirmed VitePress renders the release notes, upgrade guide, publishing
  runbook, stability policy, quality guidance, checklists, feedback template,
  and all seven API references without broken internal links.

## Verification

- Direct TypeScript builds: all seven publishable packages passed.
- Direct Vite production builds: all seven runnable examples passed.
- Direct TypeScript `--noEmit`: all seven publishable packages passed.
- `npm test`: 27 files / 124 tests passed.
- Release, bundle, and pack script tests: 23 tests passed.
- `npm run test:release`: 12 tests passed; real repository audit verified all
  seven packages.
- `npm run test:pack`: 8 tests passed; real pnpm pack checks verified all seven
  packages.
- Bundle gate: all seven package totals remained within their documented byte
  budgets.
- Spatial benchmark: deterministic 1,000 / 5,000 / 10,000-node equivalence
  checks passed. The observed informational query/index timings were
  21.05/23.03 ms, 72.09/63.52 ms, and 105.72/99.09 ms respectively.
- `npm run test:e2e`: 25 browser tests passed across all seven examples.
- `npm run docs:build`: passed.
- React and Vue Storybook production builds: passed; Storybook emitted its
  existing dependency `eval` warnings.
- Offline tarball consumer installation and imports: passed for seven packages.
- Workflow YAML parsing, Playwright Chrome dry-run recognition, script syntax
  through execution, and `git diff --check`: passed.

The local Codex runtime exposes pnpm `11.19.0` while the repository and release
CI pin pnpm `10.0.0`. Top-level Turbo and nested pnpm-script wrappers attempt a
registry metadata fetch and non-interactive replacement of the existing
modules layout, then abort. The workspace was preserved rather than allowing
that mutation. Every constituent of the build, release-quality gate, and
publish dry run was run directly and passed; release CI performs a clean
pnpm-10 frozen-lockfile installation before running the canonical commands.

## Workspace and publication safety

Pre-existing `.pnpm-store`, `.turbo`, generated Storybook/example output, and
untracked Phase 8/Phase 9 plan files were neither removed nor staged. Temporary
tarballs, consumer projects, and npm caches were created outside the repository
and removed after verification. No npm publish, registry write, git tag, push,
or other external release mutation was performed.

## Final RC audit addendum

This addendum supersedes the earlier Changeset and package-smoke descriptions
above where the final release-candidate review required a stricter contract.

- Release CI and `publish:dry-run` now build all seven release packages in
  dependency order before any test or benchmark can import package `dist`
  output. This also avoids the clean-build peer dependency race found in the
  final isolated audit for the React and Vue adapters.
- The dry run packs all seven packages, creates a new temporary npm consumer,
  installs all seven tarballs together, typechecks and builds a root-import
  program, and executes its JavaScript imports. Temporary tarballs, the
  consumer, and its isolated npm cache are removed in all outcomes.
- Phase 1–9 Changesets are now explicitly consumed: their release intent is
  recorded in `CHANGELOG.md` and the pending files are deleted. Contributor and
  publishing guidance define one lifecycle, and release readiness rejects any
  remaining `.changeset/*.md` file.
- CanvasKit's public licensing decision is MIT. The repository now contains the
  full `LICENSE` text and every published manifest carries `license: MIT`; both
  source and packed-manifest audits enforce it.
- SVG documentation now matches the implementation: `SvgRenderer` retains the
  latest serialized string in `svg` and does not create or mutate a DOM node.
- Spatial-index benchmark equivalence now compares the exact ordered node IDs
  for every query and the selected node ID for every hit test, rather than only
  aggregate counts.
- Release-readiness and packed-artifact checks accept an explicit release
  version and derived internal range. `CANVASKIT_RELEASE_VERSION` drives the
  command-line checks for later stable 1.x candidates while retaining `1.0.0`
  as the default.

Each behavior change was covered by a regression test that failed against the
previous implementation before the corresponding fix was applied. Final
clean-checkout-equivalent verification results are recorded below after the
canonical pinned-pnpm run.

### Addendum verification

The exact staged candidate was applied to a `git archive` checkout. It began
without package or example `dist` directories, used the repository-pinned pnpm
`10.0.0`, and reused only the existing locked dependency installation.

- `pnpm publish:dry-run`: passed. Seven release packages built in dependency
  order; 17 release-readiness tests and the repository audit passed; 11 pack
  tests passed; all seven tarballs passed manifest inspection and a fresh npm
  consumer install, typecheck, build, and runtime root-import check.
- `pnpm test`: 27 files / 126 tests passed, including four spatial benchmark
  equivalence regressions.
- `pnpm typecheck`: seven package tasks passed.
- `pnpm verify:release-quality`: passed; three bundle tests, all seven byte
  budgets, and deterministic 1,000 / 5,000 / 10,000-node benchmarks passed.
- `pnpm build`: all 14 package and example builds passed after the clean
  release-package build established their public declaration entrypoints.
- `pnpm docs:build`: passed.
- `pnpm test:e2e`: 25 browser tests passed.
- React and Vue Storybook production builds passed with Storybook's existing
  dependency `eval` warnings.
- JSON parsing, workflow inspection, `git diff --check`, and staged-path review
  passed. No cache, build output, plan, tarball, or consumer directory is part
  of the release commit.

No publish, registry write, tag, push, or remote mutation was performed.
