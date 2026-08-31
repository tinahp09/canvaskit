# V2.6 — Export & Accessibility

## Highlights

- Deterministic vector PDF bytes and browser data URLs.
- Visible-layer-aware PDF primitives and connector routes.
- Pure accessibility snapshots plus an owned ARIA canvas mirror.
- Basic-canvas PDF export and screen-reader structure.

## Architecture

Export and accessibility are standalone packages that consume Core's document
projection without changing Scene V6. See [V2.6 architecture](/architecture/v2-export-accessibility).

## Breaking changes

None. Scene V6 remains unchanged.

## What's next

V2.7 stabilizes the extension platform: plugin, tool, node, command, inspector,
and diagnostic APIs.
