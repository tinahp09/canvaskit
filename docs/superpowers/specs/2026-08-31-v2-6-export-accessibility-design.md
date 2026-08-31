# CanvasKit V2.6 Export & Accessibility Design

## Goal

Make a Scene V6 document portable as deterministic vector PDF while providing a
renderer-independent ARIA mirror that lets host applications expose canvas
content and selection state to assistive technology.

## Scope

V2.6 adds two publishable packages:

- `@canvaskit/renderer-pdf`: `renderPDF(scene, options?)` returns a valid,
  deterministic PDF `Uint8Array` for visible rectangles, circles, text, and
  connectors. It uses built-in Helvetica and a fixed logical 1200×720 page.
- `@canvaskit/accessibility`: a pure scene-to-semantic projection plus DOM
  helpers that maintain a labelled ARIA list mirror beside a canvas host.

The basic-canvas example receives a labelled PDF export control and an ARIA
mirror live region. The PDF action exposes a data URL in the existing export
preview without forcing a browser download.

## Non-goals

- No upload, print dialog, filesystem write, cloud export, or watermarking.
- No embedded raster image bytes, font embedding, multi-page pagination, or
  advanced text shaping. Image nodes get a clearly bounded placeholder in PDF.
- No imposed editor DOM, focus model, or screen-reader navigation policy.

## PDF architecture

`renderPDF` projects the visible document in existing layer order and applies
the Scene viewport to the fixed page. A small local PDF writer builds a catalog,
pages object, Helvetica font object, content stream, xref table, and trailer.
String escaping, numeric formatting, and object ordering are deterministic.
Canvas coordinates are converted to PDF coordinates by flipping the Y axis.

The renderer uses `ConnectorController` for the same route geometry used by
Canvas and SVG. Rectangle/circle/text rendering uses PDF vector operators.
Image nodes draw a neutral labelled frame rather than claiming that an external
resource was embedded. `exportPDFDataURL` base64-encodes the exact result for
browser hosts.

## Accessibility architecture

`createAccessibilitySnapshot(scene, selection?)` returns an ordered tree of
`AccessibilityItem` records for visible document nodes and connectors. Labels
are deterministic: text uses its content, images identify their asset ID, and
shapes use their type/ID. Selection state is represented with `selected`.

`CanvasAccessibilityMirror` owns one offscreen semantic container. `update`
reconciles the snapshot into an ordered list with `aria-label`, selected state,
and a concise status message. It never handles pointer or keyboard events;
hosts keep interaction in Core adapters and call `update` on scene/selection
changes. `destroy` removes only its own container.

## Error handling

PDF export rejects a non-finite page size or invalid page options before
writing bytes. The accessibility projection tolerates legacy scene shapes the
same way current visibility helpers do, but skips non-visible content. DOM
construction requires a document-like host and throws a clear error otherwise.

## Testing and acceptance

- Unit tests verify deterministic PDF bytes, header/xref/trailer structure,
  escaped text, viewport transform, hidden-layer filtering, connector routes,
  and image placeholders.
- JSDOM tests verify ordered accessible labels, selection state, updates, and
  disposal without changing the supplied scene.
- Basic-canvas E2E exports a `data:application/pdf;base64,` result and exposes
  the semantic mirror by role and label.
- Package builds, all unit tests, docs build, and focused browser E2E pass
  before the V2.6 feature freeze.

## Trade-offs

The compact PDF writer avoids a new heavy dependency and makes output stable
in browser and Node environments, but intentionally supports only V2 drawing
primitives. A semantic mirror provides accessible structure without pretending
that a Canvas element is a native editor; host applications remain responsible
for focus, shortcuts, and their product-specific descriptions.
