# Release Checklist

## Code

- [x] Features complete / feature freeze confirmed (CanvasKit V7)
- [x] Tests passing (typecheck, 317 unit tests, release validation, package smoke, and 61 browser E2E tests)
- [x] Performance checked (bundle budgets and spatial-index benchmark)
- [x] Breaking changes documented (all public packages move to 7.0.0; Scene V7 is unchanged)

## Documentation

- [x] README updated
- [x] Architecture docs updated (`docs/architecture/v7-persistence-recovery.md`)
- [x] API documented (`docs/api/persistent-editor-session.md`)
- [x] Migration notes added when needed (no scene migration is required)

## Media

- [x] GIF recorded for a major milestone (`docs/public/releases/v7/v7.0-persistence.gif`, 5 seconds)
- [x] Screenshots captured for a major milestone (three states in `docs/public/releases/v7/`)
- [x] Demo updated (`examples/editor-session`)

## Release

- [x] Version bumped (all ten public packages: 7.0.0)
- [x] CHANGELOG updated (`CHANGELOG.md`)
- [x] Release notes written (`docs/release-notes-v7.md`)
- [ ] GitHub Release created (requires explicit publication approval)

## Public

- [ ] LinkedIn post published
- [ ] Dev.to article published when applicable

> V7 release gates use local binaries because the installed `pnpm` wrapper can
> attempt an unavailable registry fetch. Publishing packages, creating a GitHub
> Release, deploying a demo, and posting publicly require explicit approval.
