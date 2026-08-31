# Release Checklist

## Code

- [x] Features complete / feature freeze confirmed (CanvasKit V2)
- [x] Tests passing (2026-08-31: 37 unit files / 251 tests and 49 browser tests)
- [x] Performance checked (2026-08-31 spatial-index benchmark and nine package budgets verified; V2 adds no unbounded hot-path algorithm)
- [x] Breaking changes documented (all public packages move to 2.0.0; Scene V6 remains compatible)

## Documentation

- [x] README updated
- [x] Architecture docs updated
- [x] API documented
- [x] Migration notes added when needed (not needed; Scene V6 is unchanged)

## Media

- [ ] GIF recorded for a major milestone (capture plan only; no approved binary-media location)
- [ ] Screenshots captured for a major milestone (capture plan only; no approved binary-media location)
- [x] Demo updated (basic-canvas command plugin and diagnostics workflow)

## Release

- [x] Version bumped (all nine public packages: 2.0.0)
- [x] CHANGELOG updated (`CHANGELOG.md`)
- [x] Release notes written (V2 milestone notes in `docs/release-notes-v2*.md`)
- [ ] GitHub Release created (pending this authorized publication)

## Public

- [ ] LinkedIn post published
- [ ] Dev.to article published when applicable

> V2 release gates are verified with direct local binaries because the installed
> `pnpm` wrapper attempted an unavailable registry fetch and non-interactive
> modules-directory purge. Publishing packages, creating a GitHub Release,
> deploying a demo, and posting publicly require explicit user approval at the
> time of the action.
