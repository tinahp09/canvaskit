# Task 3 report — Canvas/SVG rendering and diagram example

## Delivered

- CanvasRenderer now resolves and draws visible V4 connector routes, arrowheads, labels, endpoint port affordances, and a selected-connector stroke state. Its existing positional inputs remain compatible; the selected connector id is an optional fourth argument.
- SVG now exports deterministic connector paths with direction markers, escaped labels, and derived port circles. Legacy edge inputs remain renderable for pre-V4 callers.
- The basic-canvas example starts as an orthogonal labelled workflow and supports real pointer port-to-port creation, connector route selection, endpoint reconnect, delete, undo, and redo. Hidden or locked targets never create/reconnect a connector.
- Added a real-browser diagram E2E covering creation, SVG label output, selection/reconnect, hidden and locked endpoint rejection, delete/undo/redo, and browser console/page errors.
- Updated renderer unit/SVG regression coverage and the pre-V4 basic-canvas expectations. `projectVisibleDocument` and minimap now tolerate/consume the canonical connector shape for renderer and plugin compatibility.

## TDD evidence

- New Canvas/SVG connector assertions were added before renderer support and failed because V4 projections exposed `connectors` rather than the stale `edges` property.
- New browser diagram E2E was added before example interaction support and failed because no pointer port workflow existed.
- The full-suite minimap failure independently reproduced the stale `scene.edges` read; the existing minimap regression test was red before the one-line connector-count correction.

## Verification

- `./node_modules/.bin/tsc -p packages/core/tsconfig.json --noEmit`
- `./node_modules/.bin/tsc -p packages/renderer-canvas/tsconfig.json --noEmit`
- `./node_modules/.bin/tsc -p packages/renderer-svg/tsconfig.json --noEmit`
- `./node_modules/.bin/tsc -p packages/plugins/tsconfig.json --noEmit`
- `./node_modules/.bin/vite build examples/basic-canvas`
- `./node_modules/.bin/vitest run` — 31 files, 226 tests passed.
- `./node_modules/.bin/playwright test examples/basic-canvas/e2e` — 24 real-browser tests passed.
