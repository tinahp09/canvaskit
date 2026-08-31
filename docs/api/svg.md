# SVG renderer API

`@canvaskit/renderer-svg` produces SVG markup from a Core scene.

```ts
import { renderSVG, SvgRenderer } from '@canvaskit/renderer-svg'
```

## `renderSVG(scene, selectedConnectorId?)`

Serializes a `CanvasScene` as an SVG string. The function returns data only; it never inserts markup into the DOM or triggers a browser download.

V2.3 exports visible connector routes, direction markers, escaped labels, and
ports for interactive endpoints; pass the optional selected connector ID for
matching selected-route presentation. When displaying an export preview, render
the string as text (for example in a read-only textarea) or sanitize and own
the trust boundary before inserting it as markup.

## `SvgRenderer`

`SvgRenderer` implements Core’s renderer contract and retains the latest
serialized markup in its read-only `svg` property. Calling
`render(scene, selectedConnectorId?)`
replaces that string; the renderer does not create or mutate an SVG element.
Applications own any DOM insertion and its trust boundary.
