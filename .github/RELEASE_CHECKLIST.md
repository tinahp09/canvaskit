# Release Checklist

## Code

- [x] Features complete / feature freeze confirmed (V2.2 Document & Layers)
- [x] Tests passing (2026-08-29 candidate: 30 unit files / 199 tests and 23 basic-canvas browser tests)
- [x] Performance checked (spatial-index equivalence benchmark at 1,000, 5,000, and 10,000 nodes)
- [x] Breaking changes documented (Scene export is V3; V1/V2 import migration is documented)

## Documentation

- [x] README updated
- [x] Architecture docs updated
- [x] API documented
- [x] Migration notes added (V2 to V3 and `layer-default`)

## Media

- [ ] GIF recorded for a major milestone (capture plan only; no approved binary-media location)
- [ ] Screenshots captured for a major milestone (capture plan only; no approved binary-media location)
- [x] Demo updated (basic-canvas layer-aware editor)

## Release

- [ ] Version bumped (V2.2 is a milestone candidate; package publication/versioning needs release-owner approval)
- [ ] CHANGELOG updated (deferred with the approved package version)
- [x] Release notes written (candidate: `docs/release-notes-v2-2.md`)
- [ ] GitHub Release created

## Public

- [ ] LinkedIn post published
- [ ] Dev.to article published when applicable

> Candidate gates were verified with direct local binaries because the installed
> `pnpm` wrapper attempted an unavailable registry fetch and non-interactive
> modules-directory purge. Publishing packages, creating a GitHub Release,
> deploying a demo, and posting publicly require explicit user approval at the
> time of the action.
