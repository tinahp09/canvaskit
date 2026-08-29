# Phase 9 Task 1 report: stable package metadata

## Outcome

Prepared the seven publishable CanvasKit packages for the stable `1.0.0` line and added an executable release-contract audit.

- Updated `@canvaskit/core`, `geometry`, `renderer-canvas`, `renderer-svg`, `plugins`, `react`, and `vue` to `1.0.0`.
- Updated every internal published-package dependency, development dependency, and peer dependency to `workspace:^1.0.0`; synchronized the lockfile importers.
- Limited every published manifest to `files: ["dist"]` while preserving the existing root-only JavaScript and declaration exports.
- Defined the stable ownership boundary for every package, the semantic-versioning/type compatibility policy, scene-schema compatibility, and deprecation/migration expectations.
- Added a V1 release-candidate checklist and linked both new release documents from the general checklist, contributor guide, and VitePress navigation.
- Added `npm run test:release` / `pnpm test:release`, which runs deterministic fixture tests and then audits the real repository.

## Audit notes

- **Manifests and package files:** all seven manifests were at `0.9.0`, had no package-file allowlist, and nine internal ranges referenced `0.9.0`. These are now stable and lockfile-aligned.
- **Exports and imports:** every package already exposed only `.` with `./dist/index.js` and `./dist/index.d.ts`; no private package imports were found in the real repository. The new audit now protects both facts.
- **Changesets:** Phase 1 through Phase 8 Changesets are present. The Phase 9 plan explicitly assigns the final `1.0.0` Changeset and release notes to Task 4, so Task 1 does not pre-empt them.
- **Release documentation:** the general release checklist, RC feedback template, seven API references, contributor guide, security policy, and README were present. The API stability policy and V1-specific RC checklist were missing and are now required artifacts.
- **CI:** no `.github` workflow exists in the current repository. The release gate is available as a stable package script; creating and hardening the publishing workflow remains Phase 9 Task 3 as specified by the plan.

## TDD evidence

The initial verifier import failed because the module did not exist. A minimal empty verifier then produced behavior-level failures for version, internal range, file allowlist, public subpath, private import, and missing-artifact cases. Additional red/green cycles covered root documentation, missing scanned files, required root export targets, and the existing RC feedback artifact.

Final targeted result: 11 tests passed, followed by `Stable release metadata verified for 7 packages.`

## Verification

- `npm test`: 27 files passed, 124 tests passed.
- `npm run test:release`: 11 tests passed; real repository audit passed for seven packages.
- Direct `tsc --noEmit` for all seven publishable package configs: passed.
- `npm run docs:build`: VitePress client/server build and page rendering passed.
- `node --check scripts/release-readiness.mjs`: passed.
- `node --check scripts/release-readiness.test.mjs`: passed.
- `git diff --check`: passed.

The first `pnpm test:release` attempt was intercepted by the local Codex pnpm wrapper, which tried to reinstall dependencies after workspace ranges changed and was stopped by restricted network/non-TTY safeguards before removing modules. Running the same declared package script with npm avoided that environment-specific wrapper; the command itself remains `pnpm`-compatible for a clean CI install.

## Workspace preservation

Pre-existing `.pnpm-store`, `.turbo`, generated Storybook, example Turbo directories, and the untracked Phase 8/Phase 9 plan files were intentionally neither removed nor staged. No push was performed.
