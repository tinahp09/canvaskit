# CanvasKit V2.4 Smart Layout Design

## Scope

V2.4 makes precise object placement available as headless Core primitives:
smart snapping to visible interactive node geometry, persistent ruler guides,
renderable active-guide feedback, and deterministic grid/flow auto-layout for
a chosen node set. The basic-canvas example demonstrates these public APIs.

## Goals

- Keep layout calculations immutable, serializable where persistent, and
  independent from Canvas, SVG, React, and Vue.
- Align a selected set to peer-node left/centre/right and top/middle/bottom
  geometry with a configurable tolerance.
- Persist user-created horizontal/vertical ruler guides in Scene V5 metadata.
- Return active snap-guide feedback separately from scene state so renderers
  can draw it without owning interaction policy.
- Arrange selected nodes deterministically in horizontal, vertical, or grid
  flow using explicit gap, origin, and column settings.
- Respect V2.2 visibility/locking rules: hidden and locked nodes never become
  snap targets or layout mutation targets.

## Non-goals

- No physics simulation, constraint solver, collision-free graph layout,
  editable connector route handles, or automatic re-layout after every edit.
- No prescribed toolbar, ruler DOM, drag interaction, or framework-specific
  state store. Applications decide when to invoke Core APIs.
- Existing V2.0 alignment/distribution commands remain compatible; V2.4 does
  not replace their behaviour.

## Scene V5 model and migration

`CanvasScene` gains `guides: CanvasGuide[]`, where each guide is:

```ts
interface CanvasGuide {
  id: string
  axis: 'horizontal' | 'vertical'
  position: number
}
```

Guide IDs are unique and positions are finite world coordinates. V1–V4 imports
migrate to V5 with an empty guide list. V5 exports always include `guides`.
Guides never affect node visibility, connector validity, or paint order.

## Layout API

`LayoutController` is a pure helper with these operations:

- `createGuide(scene, guide)`, `moveGuide(scene, id, position)`, and
  `removeGuide(scene, id)` return immutable valid scenes.
- `snapTranslation(scene, nodeIds, proposedDelta, options?)` returns the
  accepted delta plus `activeGuides`; it considers selected-group edges and
  centres against visible unlocked peer nodes and stored guides.
- `autoLayout(scene, nodeIds, options)` returns a new scene with selected,
  interactive nodes arranged in stable input order. `direction` is
  `'horizontal' | 'vertical' | 'grid'`; grid requires an explicit positive
  `columns`. `gap` and `origin` have deterministic defaults.

`CanvasKit` exposes history-backed wrappers for guide mutations and auto-layout
selection. It keeps transient active snap guides outside the serializable scene
and clears/sanitizes them after document replacement or invalid selection.

## Rendering and example

`CanvasRenderer.render` accepts optional active layout guides and paints a
glass-blue dashed overlay in viewport coordinates after content. SVG export
does not include transient snap feedback but does serialize the canonical scene
without dropping guides. The example exposes native controls to create/remove
guides, choose flow direction, set grid columns/gap, apply auto-layout, and
preview/apply a smart-snapped drag.

## Validation and tests

- Core unit tests cover V4→V5 migration, guide validation/immutability,
  snapping ties/tolerance/hidden-locked filtering, and each auto-layout mode.
- Canvas tests assert guide screen coordinates and render ordering.
- Browser E2E proves visible snap feedback, guide history, layout undo/redo,
  and keyboard-labelled controls.
- Public API docs, migration notes, runnable example, release-quality evidence,
  and release-showcase artifacts are updated at feature freeze.
