# V2.0 release asset manifest

This is a capture plan and text evidence record for the V2.0 candidate. The
repository has no documented `release-assets` directory or safe tracked-media
pattern. Following the release workflow, no generated binary screenshots or
GIFs are added to git without separate approval.

## Intended media (not yet recorded)

| Intended name | Duration / viewport | Demonstrates | Capture steps |
| --- | --- | --- | --- |
| `v2.0-transform-demo.gif` | 5–15 seconds, stable basic-canvas viewport | select → resize → Shift aspect-lock resize → align/distribute → rotate | Run the basic-canvas demo, use clean seeded nodes, record deliberate pointer movement, and verify playback before citing it. |
| `v2.0-transform-overview.png` | Stable basic-canvas viewport | multi-node selection overlay, bounds, and all handles | Select the seeded nodes; keep the canvas and overlay fully visible. |
| `v2.0-transform-resize.png` | Stable basic-canvas viewport | primary resize workflow | Select `webhook`, drag a corner/edge handle, and preserve the resulting overlay. |
| `v2.0-transform-arrange.png` | Stable basic-canvas viewport | complex selection arrangement | Select multiple seeded nodes and invoke alignment or horizontal distribution. |
| `v2.0-transform-rotation.png` | Stable basic-canvas viewport | persistent rotation | Select a node, rotate it, and capture the rotated node with its selection overlay. |

If approval to store binaries is granted, save them in the user-approved
release-assets path, verify each artifact renders, then update this manifest
and the release checklist with the real paths. Do not treat planned names as
captured assets.

## Source-backed evidence

| Capability | Source evidence | Automated verification |
| --- | --- | --- |
| Overlay / all handles | `TransformController.getOverlay`; Canvas renderer overlay draw | Core transform tests and basic-canvas transform E2E |
| Resize / constraints | `TransformController.resize`; `CanvasKit.resizeSelection` | Core transform and CanvasKit tests; resize and aspect-lock E2E |
| Alignment / distribution | `TransformController.align` / `distribute` | Core and CanvasKit tests; basic-canvas arrange E2E |
| Persistent rotation | serialized `rotation`; Canvas/SVG/PDF output; local-space hit testing | Core rotation tests and rotate-handle E2E |

Run the candidate verification set from the repository root after the feature
freeze:

```sh
pnpm test
pnpm typecheck
pnpm build
pnpm test:e2e
pnpm docs:build
pnpm verify:release-quality
```

The task report records the exact successful command output and any direct
binary fallback used when the local pnpm wrapper cannot run.
