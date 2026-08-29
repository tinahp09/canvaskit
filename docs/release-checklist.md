# Release checklist

Use this checklist for every CanvasKit release candidate and final release. Record the commands, platform, and results in the release pull request or release notes.

Stable `1.x` candidates must also complete the [V1 release-candidate checklist](release-candidate-checklist.md) and follow the [API stability policy](api-stability.md).

## Prepare the candidate

- [ ] Confirm the target version and release scope.
- [ ] Review pending Changesets; apply their release levels and incorporate
      their user-visible text into `CHANGELOG.md` and the target release notes.
- [ ] Delete every consumed `.changeset/*.md`; the final candidate contains no
      pending Changeset Markdown files.
- [ ] Verify package names, exports, peer dependencies, and public type declarations.
- [ ] Review user-facing documentation, examples, migration guidance, and the changelog text.
- [ ] Review the target-version release notes and upgrade guidance.
- [ ] Ensure no credentials, generated output, `.pnpm-store`, `.turbo`, `node_modules`, test results, or local phase-plan artifacts are staged.

## Validate

- [ ] Start from a clean install compatible with the repository's declared pnpm version.
- [ ] Run `pnpm build:release` before release tests or benchmarks.
- [ ] Run `pnpm typecheck`.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm test:release`.
- [ ] Run `pnpm verify:release-quality` for built-package bundle budgets and deterministic benchmark correctness.
- [ ] Run `pnpm test:e2e` and confirm its final summary includes every test.
- [ ] Run `pnpm docs:build`.
- [ ] Run `pnpm storybook:build`.
- [ ] Run `pnpm storybook:vue:build`.
- [ ] Open each runnable example and check the primary editing/export workflow.
- [ ] Check labelled controls, keyboard focus, visible focus treatment, live feedback, and safe text output in the browser workflows.
- [ ] Re-run performance benchmarks when renderer, scene-query, or interaction performance changes.

## Review and publish

- [ ] Collect release-candidate feedback with the [RC feedback template](rc-feedback.md) and resolve or explicitly defer every finding.
- [ ] Follow the [publishing runbook](publishing.md), review the final diff, and
      inspect pnpm-generated package tarballs and their consumer manifests.
- [ ] Confirm approved Changesets were consumed into versions, `CHANGELOG.md`,
      and release notes before the final release audit.
- [ ] Tag and publish only after all required checks are green and the release owner approves.
- [ ] Verify the published package metadata and installation in a fresh consumer project.
- [ ] Announce known limitations and link follow-up issues.
