# Release Checklist

## Code

- [x] Features complete / feature freeze confirmed (CanvasKit V6)
- [ ] Tests passing (full release gates pending)
- [ ] Performance checked (full release gates pending)
- [x] Breaking changes documented (all public packages move to 6.0.0; Scene V7 is unchanged)

## Documentation

- [x] README updated
- [x] Architecture docs updated (`docs/architecture/v6-editor-session-commands.md`)
- [x] API documented (`docs/api/editor-session.md`)
- [x] Migration notes added when needed (no scene migration is required)

## Media

- [x] GIF recorded for a major milestone (`docs/public/releases/v6/v6.0-editor-session.gif`, 6 seconds)
- [x] Screenshots captured for a major milestone (three states in `docs/public/releases/v6/`)
- [x] Demo updated (`examples/editor-session`)

## Release

- [x] Version bumped (all ten public packages: 6.0.0)
- [x] CHANGELOG updated (`CHANGELOG.md`)
- [x] Release notes written (`docs/release-notes-v6.md`)
- [ ] GitHub Release created (requires explicit publication approval)

## Public

- [ ] LinkedIn post published
- [ ] Dev.to article published when applicable

> V6 release gates use local binaries because the installed `pnpm` wrapper can
> attempt an unavailable registry fetch. Publishing packages, creating a GitHub
> Release, deploying a demo, and posting publicly require explicit approval.
