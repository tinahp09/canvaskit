# CanvasKit V2 Professional Editor Roadmap

## Product position

CanvasKit V2 makes the library a headless-first TypeScript foundation for professional visual editors. It supplies document semantics, interaction tools, renderer overlays, and extension points; applications retain their own toolbar, styling, persistence, and product workflows.

## Milestones

| Milestone | Developer-visible outcome | Depends on |
| --- | --- | --- |
| V2.0 Transform Tools | Resize, rotate, bounding boxes, handles, constraints, and alignment for selected nodes | V2.1 workflow |
| V2.2 Document & Layers | Ordered layers, groups, lock/hide state, and document commands | V2.0 |
| V2.3 Diagram Toolkit | Ports, connectors, arrows, labels, and deterministic routing | V2.2 |
| V2.4 Smart Layout | Snap/guides, rulers, distribute/align, and auto-layout primitives | V2.0, V2.2 |
| V2.5 Rich Content & Assets | Image assets, crop/fit, text editing primitives, and asset serialization | V2.2 |
| V2.6 Export & Accessibility | PNG/SVG/PDF export pipeline, keyboard navigation, and ARIA mirror | V2.3, V2.5 |
| V2.7 Extension Platform | Stable plugin/tool/node APIs, command registry, inspector and diagnostics | V2.0–V2.6 |

## Cross-milestone rules

- Core APIs stay immutable, serializable, framework- and renderer-agnostic.
- Each milestone has red/green unit tests, browser E2E coverage for visible behavior, updated public API docs, a runnable example, and a release-quality check.
- New APIs must not leave invalid edge/group/document references after a mutation.
- Renderer overlays are render-only; interaction/business logic remains in Core.
- At milestone feature freeze, use the `release-showcase` workflow: release notes, architecture explanation, screenshots/GIF when the feature is visually demonstrable, and the project release checklist. External publication remains approval-gated.

## Deferred V3 scope

Real-time CRDT collaboration, presence, worker/offscreen rendering, WebGL/WebGPU, and animation timeline work require the stable document and extension APIs from V2 and are deliberately deferred to V3.
