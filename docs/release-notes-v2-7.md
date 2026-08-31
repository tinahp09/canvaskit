# V2.7 — Plugin Platform

## Highlights

- Stable command, tool, node, and inspector registrations.
- Deterministic tool lifecycle and idempotent definition cleanups.
- Diagnostics snapshot for developer tooling and inspector UIs.
- Official command-plugin factory and browser example workflow.

## Architecture

Extensions are data-first, trusted host code installed through the existing
plugin lifecycle. See [V2.7 architecture](/architecture/v2-plugin-platform).

## Breaking changes

None. Existing plugins remain compatible.

## What's next

V2 is complete. V3 can build collaboration, worker rendering, and advanced
editor services on the stable document and extension contracts.
