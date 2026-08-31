---
layout: home

hero:
  name: CanvasKit
  text: Interactive visual editors, built in TypeScript
  tagline: Compose scenes, render them to Canvas or SVG, and add framework adapters only where you need them.
  actions:
    - theme: brand
      text: Get started
      link: /getting-started
    - theme: alt
      text: Browse API reference
      link: /api/core

features:
  - title: Engine-first
    details: Core scene state, selection, viewport, history, persistence, and graph editing remain framework-agnostic.
  - title: Choose your renderer
    details: Render the same scene with Canvas 2D for an interactive surface or SVG for portable markup and export.
  - title: Integrate deliberately
    details: Official plugins and React or Vue adapters stay opt-in, so an editor only pays for the capabilities it uses.
---

## What you can build

CanvasKit supports rectangles, circles, text, edges, groups, pan and zoom,
selection, clipboard editing, undo and redo, versioned scene JSON, plus V2.0
selection transforms: resize constraints, alignment, distribution, and Canvas
overlays. V2.2 adds ordered document layers, group metadata, layer visibility,
locking, and history-backed document commands. V2.3 adds Scene V4 ports and
connectors with deterministic straight/orthogonal routes, labels, arrows, and
relation commands. Use it as the engine beneath whiteboards, diagrams,
workflow editors, or architecture maps.

Start with the [getting-started guide](/getting-started), the [transform tools
guide](/guides/transform-tools), [document & layers guide](/guides/document-layers),
[diagram toolkit guide](/guides/diagram-toolkit), inspect the [product
examples](/examples), or browse the package-level [API reference](/api/core).
