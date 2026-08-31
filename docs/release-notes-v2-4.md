# V2.4 — Smart layout

V2.4 is the deterministic-placement milestone for CanvasKit.

## Highlights

- Scene V5 persistent horizontal/vertical ruler guides.
- Smart snapping to rulers and visible unlocked peer geometry.
- Explicit horizontal, vertical, and grid auto-layout primitives.
- History-backed guide and layout commands; transient render-only snap guides.
- Canvas overlay and accessible basic-canvas controls.

## Architecture

Core owns layout calculations and history while the renderer draws only returned
feedback. See [V2.4 architecture](/architecture/v2-smart-layout).

## Breaking changes

Exports are Scene V5. `importScene` migrates V1–V4 scenes by adding empty
guides; consumers directly parsing JSON must support `guides`.

## What's next

V2.5 Rich Content & Assets adds serializable images and text primitives.
