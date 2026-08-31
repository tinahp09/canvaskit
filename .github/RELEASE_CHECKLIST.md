# Release Checklist

## Code

- [x] Features complete / feature freeze confirmed (V2.6 Export & Accessibility)
- [x] Tests passing (2026-08-31 candidate: 36 unit files / 246 tests and focused PDF/ARIA basic-canvas browser test)
- [x] Performance checked (2026-08-31 spatial-index benchmark remains in the verified unit suite; V2.6 adds no hot-path spatial algorithm)
- [x] Breaking changes documented (no Scene schema change; Scene V6 remains canonical)

## Documentation

- [x] README updated
- [x] Architecture docs updated
- [x] API documented
- [x] Migration notes added when needed (not needed; Scene V6 is unchanged)

## Media

- [ ] GIF recorded for a major milestone (capture plan only; no approved binary-media location)
- [ ] Screenshots captured for a major milestone (capture plan only; no approved binary-media location)
- [x] Demo updated (basic-canvas PDF export and ARIA mirror workflow)

## Release

- [ ] Version bumped (V2.6 is a milestone candidate; package publication/versioning needs release-owner approval)
- [ ] CHANGELOG updated (deferred with the approved package version)
- [x] Release notes written (candidate: `docs/release-notes-v2-6.md`)
- [ ] GitHub Release created

## Public

- [ ] LinkedIn post published
- [ ] Dev.to article published when applicable

> V2.6 candidate gates were verified with direct local binaries because the installed
> `pnpm` wrapper attempted an unavailable registry fetch and non-interactive
> modules-directory purge. Publishing packages, creating a GitHub Release,
> deploying a demo, and posting publicly require explicit user approval at the
> time of the action.
