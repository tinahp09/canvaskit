# Release Checklist

## Code

- [x] Features complete / feature freeze confirmed (V2.4 Smart Layout)
- [x] Tests passing (2026-08-31 candidate: 32 unit files / 235 tests and 28 basic-canvas browser tests)
- [x] Performance checked (2026-08-31 spatial-index benchmark at 1,000, 5,000, and 10,000 nodes; indexed hit-test remained substantially below linear)
- [x] Breaking changes documented (Scene export is V5; V1–V4 import migration is documented)

## Documentation

- [x] README updated
- [x] Architecture docs updated
- [x] API documented
- [x] Migration notes added (V4 to V5 guides)

## Media

- [ ] GIF recorded for a major milestone (capture plan only; no approved binary-media location)
- [ ] Screenshots captured for a major milestone (capture plan only; no approved binary-media location)
- [x] Demo updated (basic-canvas layer-aware editor)

## Release

- [ ] Version bumped (V2.4 is a milestone candidate; package publication/versioning needs release-owner approval)
- [ ] CHANGELOG updated (deferred with the approved package version)
- [x] Release notes written (candidate: `docs/release-notes-v2-4.md`)
- [ ] GitHub Release created

## Public

- [ ] LinkedIn post published
- [ ] Dev.to article published when applicable

> Candidate gates were verified with direct local binaries because the installed
> `pnpm` wrapper attempted an unavailable registry fetch and non-interactive
> modules-directory purge. Publishing packages, creating a GitHub Release,
> deploying a demo, and posting publicly require explicit user approval at the
> time of the action.
