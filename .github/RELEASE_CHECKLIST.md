# Release Checklist

## Code

- [x] Features complete / feature freeze confirmed (V2.5 Rich Content & Assets)
- [x] Tests passing (2026-08-31 candidate: 33 unit files / 242 tests and 8 focused basic-canvas browser tests)
- [x] Performance checked (2026-08-31 spatial-index benchmark remains in the verified unit suite; V2.5 adds no hot-path spatial algorithm)
- [x] Breaking changes documented (Scene export is V6; V1–V5 import migration is documented)

## Documentation

- [x] README updated
- [x] Architecture docs updated
- [x] API documented
- [x] Migration notes added (V5 to V6 assets and text runs)

## Media

- [ ] GIF recorded for a major milestone (capture plan only; no approved binary-media location)
- [ ] Screenshots captured for a major milestone (capture plan only; no approved binary-media location)
- [x] Demo updated (basic-canvas asset and image-node workflow)

## Release

- [ ] Version bumped (V2.5 is a milestone candidate; package publication/versioning needs release-owner approval)
- [ ] CHANGELOG updated (deferred with the approved package version)
- [x] Release notes written (candidate: `docs/release-notes-v2-5.md`)
- [ ] GitHub Release created

## Public

- [ ] LinkedIn post published
- [ ] Dev.to article published when applicable

> V2.5 candidate gates were verified with direct local binaries because the installed
> `pnpm` wrapper attempted an unavailable registry fetch and non-interactive
> modules-directory purge. Publishing packages, creating a GitHub Release,
> deploying a demo, and posting publicly require explicit user approval at the
> time of the action.
