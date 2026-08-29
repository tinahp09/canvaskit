# V2.2 release asset manifest

This is a capture plan and text evidence record for the V2.2 Document & Layers
candidate. The repository has no documented release-media location or safe
tracked binary-media pattern. No generated GIF or screenshot is added without
separate approval; planned names below are not captured assets.

## Intended media (not yet recorded)

| Intended name | Duration / viewport | Demonstrates | Capture steps |
| --- | --- | --- | --- |
| `v2.2-document-layers-demo.gif` | 5–15 seconds, stable basic-canvas viewport | add layer → move selected nodes → hide/show → lock → undo/redo | Run basic-canvas with clean seeded nodes, use deliberate pointer movement and layer controls, verify playback before citing it. |
| `v2.2-layers-overview.png` | Stable basic-canvas viewport | layer controls and selected-node workflow | Keep active-layer selector, layer controls, and canvas visible. |
| `v2.2-layer-visibility.png` | Stable basic-canvas viewport | hidden content and filtered edges | Hide a populated layer, preserving enough visible nodes to show the changed scene. |
| `v2.2-layer-lock.png` | Stable basic-canvas viewport | locked content remains painted but rejects pointer editing | Lock a populated layer, attempt a deliberate pointer selection/drag, and retain visible locked content. |
| `v2.2-layer-order-groups.png` | Stable basic-canvas viewport | reordered overlap plus group/ungroup | Use overlapping nodes on two layers, then show reordered topmost paint result and group state. |

If release-media storage is approved, save verified binary artifacts in the
approved path, update this manifest with their real paths, and only then mark
the corresponding checklist items complete.

## Source-backed evidence

| Capability | Source evidence | Automated verification |
| --- | --- | --- |
| V2→V3 migration and `layer-default` | `migrateScene`, `importScene`, canonical serialization | Core migration/serialization tests; basic-canvas V2 import E2E |
| Ordered layers and group integrity | `document.ts` immutable operations and Scene V3 validation | Core document/CanvasKit tests |
| Hide/lock behavior | `projectVisibleDocument`, `isNodeInteractive`, selection sanitization | Core interaction/selection/renderer tests; layer E2E |
| Render and hit-test order | layer-ordered projection consumed by Canvas renderer and interaction helpers | Canvas renderer tests; pixel-order E2E |
| Undoable document commands | `CanvasKit` history-backed layer/group methods | Core CanvasKit tests; layer E2E undo/redo |

## Candidate verification

Run the full candidate gates from the repository root after feature freeze:

```sh
pnpm test
pnpm typecheck
pnpm build
pnpm test:e2e
pnpm docs:build
pnpm verify:release-quality
pnpm test:release
pnpm storybook:build
pnpm storybook:vue:build
```

The Task 4 report records exact results and any direct-binary fallback used
when the local pnpm wrapper cannot execute a gate.
