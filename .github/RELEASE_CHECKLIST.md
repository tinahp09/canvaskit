# Release Checklist

## Code

- [x] Features complete / feature freeze confirmed (V2.7 Plugin Platform)
- [x] Tests passing (2026-08-31 candidate: 37 unit files / 249 tests and 10 basic-canvas browser tests)
- [x] Performance checked (2026-08-31 spatial-index benchmark remains in the verified unit suite; V2.7 adds no hot-path spatial algorithm)
- [x] Breaking changes documented (no Scene schema change; existing plugins remain compatible)

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

- [ ] Version bumped (V2.7 is a milestone candidate; package publication/versioning needs release-owner approval)
- [ ] CHANGELOG updated (deferred with the approved package version)
- [x] Release notes written (candidate: `docs/release-notes-v2-7.md`)
- [ ] GitHub Release created

## Public

- [ ] LinkedIn post published
- [ ] Dev.to article published when applicable

> V2.7 candidate gates are verified with direct local binaries because the installed
> `pnpm` wrapper attempted an unavailable registry fetch and non-interactive
> modules-directory purge. Publishing packages, creating a GitHub Release,
> deploying a demo, and posting publicly require explicit user approval at the
> time of the action.
