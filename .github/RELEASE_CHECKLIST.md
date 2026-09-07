# Release Checklist

## Code

- [x] Features complete / feature freeze confirmed (CanvasKit V8)
- [x] Tests passing (typecheck, 322 unit tests, release validation, package smoke, and 62 browser E2E tests)
- [x] Performance checked (bundle budgets and spatial-index benchmark)
- [x] Breaking changes documented (all public packages move to 8.0.0; Scene V7 is unchanged)

## Documentation

- [x] README updated
- [x] Architecture docs updated (`docs/architecture/v8-workspace-recovery.md`)
- [x] API documented (`docs/api/workspace-recovery.md`)
- [x] Migration notes added when needed (no scene migration is required)

## Media

- [x] GIF recorded for a major milestone (`docs/public/releases/v8/v8.0-workspace-recovery.gif`, 6 seconds)
- [x] Screenshots captured for a major milestone (three states in `docs/public/releases/v8/`)
- [x] Demo updated (`examples/editor-session`)

## Release

- [x] Version bumped (all ten public packages: 8.0.0)
- [x] CHANGELOG updated (`CHANGELOG.md`)
- [x] Release notes written (`docs/release-notes-v8.md`)
- [ ] GitHub Release created (requires explicit publication approval)

## Public

- [ ] LinkedIn post published
- [ ] Dev.to article published when applicable

> V8 release gates use local binaries because the installed `pnpm` wrapper can
> attempt an unavailable registry fetch. Publishing packages, creating a GitHub
> Release, deploying a demo, and posting publicly require explicit approval.
