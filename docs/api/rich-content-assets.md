# Rich content & assets API

V2.5 introduces the Scene V6 asset registry, `ImageNode`, and serializable text
runs. Assets are data-only records: applications choose their own file picker,
upload service, cache, and authorization model.

```ts
import { CanvasKit } from '@canvaskit/core'

kit.addAsset({
  id: 'brand-logo', kind: 'image', source: 'https://cdn.example/logo.png',
  mimeType: 'image/png', width: 640, height: 320,
})
kit.addImage({
  id: 'logo', assetId: 'brand-logo', position: { x: 80, y: 120 },
  size: { width: 320, height: 160 }, fit: 'contain',
})
```

`CanvasAsset` currently has one variant, `ImageAsset`. Its source and intrinsic
dimensions are serializable and are referenced by `ImageNode.assetId`; an asset
cannot be removed while an image node references it. `addAsset`, `removeAsset`,
`addImage`, and `updateImage` are history-backed `CanvasKit` commands.

Images support `contain`, `cover`, and `fill` fitting. Crops use normalized
`{ x, y, width, height }` coordinates within `0…1`; imports reject invalid or
out-of-bounds crop geometry. SVG exports retain a sanitized image source and
map fitting to `preserveAspectRatio`. The Canvas renderer provides a stable
asset placeholder; an application can own resource loading independently.

Text nodes retain their legacy `text` field for compatibility and add `runs`:

```ts
{ text: 'Hello', runs: [{ text: 'Hello', bold: true }] }
```

Runs are intentionally structural in V2.5. Per-run typography, shaping, and a
rich-text editing surface are deferred until the editor text subsystem can own
selection and input semantics.
