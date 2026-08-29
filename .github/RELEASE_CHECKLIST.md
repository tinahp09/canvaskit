# Release Checklist

Use this checklist for every CanvasKit release. Major milestones (V2.0–V3.0) require every relevant section; patch releases normally require only the code, documentation, and release sections.

## Code

- [x] Features complete / feature freeze confirmed (V2.0 source scope; only release validation fixes remain)
- [x] Tests passing (2026-08-29 V2.0 candidate gate: 166 unit tests and 38 browser E2E tests)
- [x] Performance checked (2026-08-29 release-quality spatial-index verification)
- [x] Breaking changes documented (none; no scene schema change)

## Documentation

- [x] README updated
- [x] Architecture docs updated
- [x] API documented
- [x] Migration notes added when needed (not needed: V2.0 does not change scene JSON)

## Media

- [ ] GIF recorded for a major milestone
- [ ] Screenshots captured for a major milestone
- [x] Demo updated (basic-canvas transform workflow)

## Release

- [ ] Version bumped
- [ ] CHANGELOG updated
- [x] Release notes written (candidate: `docs/release-notes-v2.md`)
- [ ] GitHub Release created

## Public

- [ ] LinkedIn post published
- [ ] Dev.to article published when applicable

> Publishing packages, creating a GitHub Release, deploying a demo, and posting publicly require explicit user approval at the time of the action.
