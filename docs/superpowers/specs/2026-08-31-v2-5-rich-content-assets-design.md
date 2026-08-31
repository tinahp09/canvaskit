# CanvasKit V2.5 Rich Content & Assets Design

## Scope

V2.5 makes images and rich text safe, serializable, headless Scene V6 content.
It adds an asset registry, image nodes with deterministic fit/crop properties,
and text-node editing primitives. Renderers draw only resolved asset data;
applications own file pickers, uploads, and editors.

## Model

`CanvasScene` gains `assets: CanvasAsset[]`. An image asset has a unique ID,
MIME type, dimensions, and a URL/data source. `ImageNode` names an existing
asset, rectangular bounds, `fit: 'contain' | 'cover' | 'fill'`, and a normalized
crop rectangle. Text nodes gain optional rich-text runs while retaining plain
`text` compatibility. V1–V5 migration adds empty assets and upgrades old text
to one plain run.

## Architecture

Core validates asset ownership and immutable operations: add/remove asset,
add image node, update crop/fit, and replace text runs. Removing an in-use
asset is rejected; deleting an image node leaves an asset reusable. Canvas and
SVG use one resolved image-box calculation. The example supplies asset URL,
image insertion, fit/crop, and text-update controls with history.

## Boundaries

No binary upload, file storage, remote fetch, sanitization service, font
embedding, collaborative text editing, filters, or video. Asset source strings
are treated as application-provided data; SVG output escapes attributes and
applications own DOM insertion trust boundaries.

## Verification

Unit tests cover V5→V6 migration, validation, immutable asset/image/text
operations, crop math, history, and renderer output. Browser E2E covers native
labelled controls, undo/redo, exported SVG, and safe failure states. Release
docs/evidence follow feature freeze.
