# Release Checklist

## CanvasKit V10

### Code

- [x] Features complete / feature freeze confirmed (CanvasKit V10)
- [ ] Tests passing (full unit, browser E2E, release validation, package smoke)
- [ ] Performance checked (bundle budgets and spatial-index benchmark)
- [x] Breaking changes documented (all public packages move to 10.0.0; Scene V7 is unchanged)

### Documentation and media

- [x] README, API, architecture, and release notes updated
- [x] Three screenshots captured from the V10 reference demo (`docs/public/releases/v10/`)
- [x] 6-second sync GIF captured from the V10 reference demo (`docs/public/releases/v10/v10.0-opt-in-sync.gif`)

### Release

- [x] Version bumped (all ten public packages: 10.0.0)
- [x] CHANGELOG updated (`CHANGELOG.md`)
- [x] Release notes written (`docs/release-notes-v10.md`)
- [ ] GitHub Release created (requires explicit publication approval)

## Code

- [x] Features complete / feature freeze confirmed (CanvasKit V9)
- [x] Tests passing (typecheck, 324 unit tests, release validation, package smoke, and V9 browser E2E tests)
- [x] Performance checked (bundle budgets and spatial-index benchmark)
- [x] Breaking changes documented (all public packages move to 9.0.0; Scene V7 is unchanged)

## Documentation

- [x] README updated
- [x] Architecture docs updated (`docs/architecture/v9-autosave-recovery.md`)
- [x] API documented (`docs/api/autosave-recovery.md`)
- [x] Migration notes added when needed (no scene migration is required)

## Media

- [x] GIF recorded for a major milestone (`docs/public/releases/v9/v9.0-autosave-recovery.gif`, 6 seconds)
- [x] Screenshots captured for a major milestone (three states in `docs/public/releases/v9/`)
- [x] Demo updated (`examples/editor-session`)

## Release

- [x] Version bumped (all ten public packages: 9.0.0)
- [x] CHANGELOG updated (`CHANGELOG.md`)
- [x] Release notes written (`docs/release-notes-v9.md`)
- [ ] GitHub Release created (requires explicit publication approval)

## Public

- [ ] LinkedIn post published
- [ ] Dev.to article published when applicable

> V9 release gates use local binaries because the installed `pnpm` wrapper can
> attempt an unavailable registry fetch. Publishing packages, creating a GitHub
> Release, deploying a demo, and posting publicly require explicit approval.
