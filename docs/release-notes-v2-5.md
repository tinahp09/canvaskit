# V2.5 — Rich Content & Assets

V2.5 makes CanvasKit documents ready to reference image content without tying
the library to a storage provider.

## Highlights

- Scene V6 asset registry with validated reusable image records.
- `ImageNode` with contain, cover, fill, and normalized crop metadata.
- History-backed asset and image-node commands.
- Serializable text runs compatible with existing plain text nodes.
- Asset-aware SVG output and accessible basic-canvas asset controls.

## Architecture

Core owns asset identity, reference integrity, migrations, and history. Hosts
own upload, fetching, and caching; renderers consume document metadata without
introducing a storage dependency. See [V2.5 architecture](/architecture/v2-rich-content-assets).

## Improvements

- V1–V5 scenes import safely into V6.
- Image asset creation and image-node undo are covered by browser E2E tests.

## Breaking changes

Exports are Scene V6. Consumers directly parsing canonical JSON must handle
`assets`, image nodes, and text `runs`; `importScene` migrates V1–V5 scenes.

## What's next

V2.6 will add production export and accessibility foundations.
