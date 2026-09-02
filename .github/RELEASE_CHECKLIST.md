# Release Checklist

## Code

- [x] Features complete / feature freeze confirmed (CanvasKit V5)
- [x] Tests passing (302 unit tests and 56 browser E2E tests)
- [x] Performance checked (all ten bundle budgets pass)
- [x] Breaking changes documented (all public packages move to 5.0.0; Scene V7 is unchanged)

## Documentation

- [x] README updated
- [x] Architecture docs updated (`docs/architecture/v5-production-collaboration-adapters.md`)
- [x] API documented (`docs/api/collaboration-adapters.md`)
- [x] Migration notes added when needed (no scene migration is required)

## Media

- [x] GIF recorded for a major milestone (`docs/public/releases/v5/v5.0-collaboration-adapters.gif`)
- [x] Screenshots captured for a major milestone (three states in `docs/public/releases/v5/`)
- [x] Demo updated (`examples/collaboration-adapters`)

## Release

- [x] Version bumped (all ten public packages: 5.0.0)
- [x] CHANGELOG updated (`CHANGELOG.md`)
- [x] Release notes written (`docs/release-notes-v5.md`)
- [ ] GitHub Release created (requires explicit publication approval)

## Public

- [ ] LinkedIn post published
- [ ] Dev.to article published when applicable

> V5 release gates use local binaries because the installed `pnpm` wrapper can
> attempt an unavailable registry fetch. Publishing packages, creating a GitHub
> Release, deploying a demo, and posting publicly require explicit approval.
