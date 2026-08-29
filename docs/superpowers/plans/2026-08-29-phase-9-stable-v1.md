# Phase 9 Stable V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to execute task-by-task.

**Goal:** Release CanvasKit `1.0.0` with stable package metadata, audited public APIs, verified bundle/performance limits, CI/publishing readiness, and complete release notes.

**Spec:** `docs/superpowers/specs/2026-08-23-canvaskit-v1-roadmap-design.md`

### Task 1: Release-readiness audit and stable metadata

Audit all manifests, exports, package files, Changesets, docs, and CI. Define stable package boundaries; update all publishable package versions/internal peer ranges to `1.0.0`; add a release candidate checklist and API stability policy. Add tests/scripts that reject private imports, mismatched versions, and missing release artifacts. Commit `chore: prepare stable package metadata`.

### Task 2: Bundle and performance gates

Create deterministic bundle-size report and budget checks for published packages; run 1k/5k/10k performance benchmark and establish documented non-flaky baselines. Integrate a local verification command. Commit `test: add stable release quality gates`.

### Task 3: CI and publishing dry run

Harden GitHub Actions for pinned Node/pnpm, install, typecheck, test, docs/Storybook/example builds, bundle/performance gates, and publish dry-run. Add npm pack artifact smoke checks without publishing. Commit `ci: validate stable release pipeline`.

### Task 4: V1 release documentation and final audit

Write V1 release notes, upgrade/stability guidance, and publishing runbook. Add `1.0.0` Changeset. Run full verification, review every public artifact, resolve RC findings, and commit `docs: release CanvasKit v1`.

## Completion record

- [x] Task 1 — committed as `014de82`.
- [x] Task 2 — committed as `8b5c3e0`.
- [x] Task 3 — committed as `847b1e6`.
- [x] Task 4 — committed as `e6c9f41`; final release-blocker fixes committed as `1433d32`.

Final independent review approved the stable candidate. Verification covered package typechecks and builds, 126 unit tests, 25 browser E2E tests, documentation and both Storybook builds, bundle budgets, 1k/5k/10k benchmarks, and a clean pnpm 10 release dry run that packs then installs, typechecks, builds, and runtime-imports all seven tarballs in a fresh consumer. No publish, tag, or push was performed.
