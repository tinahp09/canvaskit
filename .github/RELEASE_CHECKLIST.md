# Release Checklist

## Code

- [x] Features complete / feature freeze confirmed (CanvasKit V4)
- [x] Tests passing (289 unit tests, 54 browser E2E tests, docs build, release verifier, and 9-package smoke consumer)
- [x] Performance checked (all bundle budgets pass; deterministic spatial-index fixture and equivalence tests pass, with 1K/5K timing captures recorded locally)
- [x] Breaking changes documented (all public packages move to 4.0.0; Scene V7 is unchanged)

## Documentation

- [x] README updated
- [x] Architecture docs updated (`docs/architecture/v4-collaboration-runtime.md`)
- [x] API documented
- [x] Migration notes added (`docs/migrations.md`)

## Media

- [x] GIF recorded for a major milestone (`docs/public/releases/v4/v4.0-collaboration.gif`)
- [x] Screenshots captured for a major milestone (four capture states in `docs/public/releases/v4/`)
- [x] Demo updated (`examples/collaboration`)

## Release

- [x] Version bumped (all nine public packages: 4.0.0)
- [x] CHANGELOG updated (`CHANGELOG.md`)
- [x] Release notes written (`docs/release-notes-v4.md`)
- [ ] GitHub Release created (pending explicit publication approval)

## Public

- [ ] LinkedIn post published
- [ ] Dev.to article published when applicable

> V4 release gates use direct local binaries because the installed `pnpm`
> wrapper may attempt an unavailable registry fetch and an interactive
> modules-directory purge. Publishing packages, creating a GitHub Release,
> deploying a demo, and posting publicly require explicit user approval at the
> time of the action.
