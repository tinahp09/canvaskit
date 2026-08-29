# Phase 9 Task 3 report: CI and publishing dry run

## Outcome

Added `.github/workflows/release-validation.yml`, a read-only GitHub Actions
release gate that runs for pull requests, `main` pushes, and manual dispatches.
It pins pnpm `10.0.0` and Node `22.22.2`, installs from the lockfile with
`pnpm install --frozen-lockfile`, and runs typechecking, tests, documentation,
both Storybook builds, every example build, and the existing release-quality
gates.

The final workflow step runs `pnpm publish:dry-run`. This validates stable
release metadata and executes package packing only; it never invokes
`npm publish` or writes to a registry.

## Package artifact smoke checks

- Added `scripts/package-smoke.mjs` and `pnpm test:pack`.
- The checker runs `npm pack --json --pack-destination` for each of the seven
  publishable packages in an isolated temporary directory.
- It requires a generated `.tgz` and verifies the packed contents include
  `package.json`, `dist/index.js`, and `dist/index.d.ts`.
- The temporary tarballs and npm caches are removed after the check, so no
  package artifacts are left in the repository and nothing is published.
- Added `scripts/package-smoke.test.mjs`. The initial TDD run failed with
  `ERR_MODULE_NOT_FOUND` before the checker existed; the final run passes all
  three behavior tests.

## Verification

- YAML parsing of `.github/workflows/release-validation.yml`: passed.
- Direct published-package TypeScript checks: passed for all seven packages.
- `vitest run`: 27 files / 124 tests passed.
- `vitepress build docs`: passed.
- React and Vue Storybook production builds: passed (Storybook emits its
  existing `eval` dependency warnings).
- Direct Vite production builds for all seven examples: passed.
- `node --test scripts/release-readiness.test.mjs scripts/bundle-size.test.mjs scripts/package-smoke.test.mjs`:
  17 tests passed.
- Stable metadata validation, bundle budgets, 1k/5k/10k benchmark, and actual
  `npm pack` smoke checks: passed for all seven packages.

`pnpm` commands cannot run directly in this local Codex environment because its
wrapper attempts a network metadata fetch and non-interactive removal of the
pre-existing modules directory. The workflow uses a clean, frozen-lockfile
install and is the authoritative CI reproduction.

## Workspace preservation

Pre-existing `.pnpm-store`, `.turbo`, generated outputs, and untracked plan
files were not removed or staged. No packages were published and no push was
performed.
