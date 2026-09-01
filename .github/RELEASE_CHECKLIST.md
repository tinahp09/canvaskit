# Release Checklist

## Code

- [x] Features complete / feature freeze confirmed (CanvasKit V3)
- [x] Tests passing (275 unit tests, 50 browser E2E tests, docs build, and 9-package smoke consumer verified locally)
- [x] Performance checked (bundle budgets pass; spatial-index benchmark verified at 1K, 5K, and 10K nodes)
- [x] Breaking changes documented (all public packages move to 3.0.0; Scene V7 migration is documented)

## Documentation

- [x] README updated
- [x] Architecture docs updated
- [x] API documented
- [x] Migration notes added (`docs/upgrading-to-v3.md` and `docs/migrations.md`)

## Media

- [x] GIF recorded for a major milestone (6-second local capture; awaiting approved asset destination)
- [x] Screenshots captured for a major milestone (three local captures; awaiting approved asset destination)
- [x] Demo updated (`examples/diagram-editor`)

## Release

- [x] Version bumped (all nine public packages: 3.0.0)
- [x] CHANGELOG updated (`CHANGELOG.md`)
- [x] Release notes written (`docs/release-notes-v3.md`)
- [ ] GitHub Release created (pending this authorized publication)

## Public

- [ ] LinkedIn post published
- [ ] Dev.to article published when applicable

> V3 release gates use direct local binaries because the installed
> `pnpm` wrapper attempted an unavailable registry fetch and non-interactive
> modules-directory purge. Publishing packages, creating a GitHub Release,
> deploying a demo, and posting publicly require explicit user approval at the
> time of the action.
