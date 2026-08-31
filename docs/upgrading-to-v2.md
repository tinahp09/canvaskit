# Upgrading to CanvasKit 2.0

CanvasKit 2.0 is the editor-foundation release. It publishes nine packages at
`2.0.0`, including the new PDF renderer and accessibility toolkit.

## Update package versions together

Keep every CanvasKit package in an application on the same major version:

```sh
pnpm add @canvaskit/core@^2.0.0 @canvaskit/geometry@^2.0.0 \
  @canvaskit/renderer-canvas@^2.0.0 @canvaskit/renderer-svg@^2.0.0 \
  @canvaskit/renderer-pdf@^2.0.0 @canvaskit/accessibility@^2.0.0 \
  @canvaskit/plugins@^2.0.0
```

Framework consumers should also update their adapter:

```sh
pnpm add @canvaskit/react@^2.0.0 react@^18 react-dom@^18
# or
pnpm add @canvaskit/vue@^2.0.0 vue@^3.3
```

## Scene data

`importScene` accepts V1 through V5 documents and migrates them to Scene V6.
V6 adds layers, connectors, guides, assets, image nodes, and rich-text runs.
Nodes may now optionally store `rotation` in radians; documents without that
field remain valid and render unrotated. See [Scene migrations](/migrations)
for the exact migration contract.

## API changes

- Use `connectors` and `ConnectorController`, rather than legacy `edges`, for
  diagram relations.
- Use `CanvasKit.rotateSelection(radians)` for persistent, undoable rotation.
- Use `renderPDF` from `@canvaskit/renderer-pdf` and
  `CanvasAccessibilityMirror` from `@canvaskit/accessibility` when those
  capabilities are needed.

The 2.x packages keep root-only exports. Avoid importing `src` or `dist`
subpaths from a CanvasKit package.
