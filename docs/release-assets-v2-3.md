# V2.3 release asset manifest

This capture plan and evidence record covers the V2.3 Diagram Toolkit candidate.
The repository has no documented release-media location or approved tracked
binary-media pattern, so no GIF or screenshot binary is added without separate
approval.

## Intended media (not yet recorded)

| Intended name | Demonstrates |
| --- | --- |
| `v2.3-diagram-toolkit-demo.gif` | select connector → retarget endpoint → orthogonal route updates → cancellation preserves scene |
| `v2.3-diagram-overview.png` | labelled workflow with ports and orthogonal arrows |
| `v2.3-diagram-selected.png` | selected connector route, arrow, and label state |
| `v2.3-diagram-accessible-controls.png` | keyboard-operable connector controls and selected relation |
| `v2.3-diagram-layer-state.png` | hidden/locked endpoint behavior |

## Source-backed evidence

| Capability | Source boundary | Automated verification |
| --- | --- | --- |
| Canonical ports/connectors and V1–V3 migration | `model.ts`, `serialization.ts`, `ConnectorController` | Core connector, scene, serialization tests |
| Deterministic routes | `ConnectorController.route` | route invariant and routing tests |
| Layer-aware validity | document projection and `isNodeInteractive` | Core interaction tests; browser hidden/locked checks |
| Canvas/SVG parity | Canvas/SVG renderers consume Core routes | renderer tests; browser SVG and Canvas-pixel assertions |
| Accessible relation workflow | basic-canvas native connector controls | browser keyboard/screen-reader workflow E2E |
| Cancellation and top-layer targeting | pointer adapter and example port hit-testing | browser cancellation and overlap E2E |

## Candidate verification

The feature-frozen candidate passed:

- 31 Vitest files / 227 tests;
- Core, Canvas renderer, SVG renderer, and plugins TypeScript checks;
- production Vite build for `examples/basic-canvas`; and
- 27 basic-canvas Playwright browser tests.

Publishing, deployment, GitHub Release creation, and public posts remain
explicitly approval-gated.
