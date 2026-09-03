# CanvasKit v6.0.0 — Editor Session & Commands

## Highlights

- Added headless `EditorSession` lifecycle for multiple independent documents.
- Added canonical dirty baselines, save reset, confirmation-aware close, and
  automatic subscription cleanup.
- Added `CommandRegistry`, platform-neutral shortcut normalization, and
  context-aware session commands.
- Added a glassy browser reference editor with independent tabs and an active
  command palette.

## Architecture

V6 separates document/session orchestration from scene rendering and command
execution. Read the [V6 editor-session architecture](/architecture/v6-editor-session-commands).

## Improvements

- Command snapshots are immutable, title-sorted, and filter unavailable
  session actions.
- A host can register its own command definitions without owning the command
  state machine or copying shortcut normalization.

## Breaking changes

All public CanvasKit packages move to `6.0.0`; update their ranges together to
`^6.0.0`. Scene V7 is unchanged, so serialized scenes need no migration.

## What's next

V7 can build editor history across host workflows, richer command discovery,
and optional persistence adapters without coupling them to Core.
