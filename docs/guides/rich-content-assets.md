# Rich content & assets

Use the asset registry when document nodes need a durable reference to image
content. Create the asset first, then reference it from any number of image
nodes. This prevents a node from embedding duplicate source metadata.

```ts
const scene = kit.addAsset({
  id: 'hero', kind: 'image', source: 'data:image/png;base64,…',
  mimeType: 'image/png', width: 1200, height: 630,
})
kit.addImage({ id: 'hero-card', assetId: 'hero', position: { x: 80, y: 100 }, size: { width: 600, height: 315 } })
```

The basic-canvas example exposes the same workflow through **Image asset URL**,
**Add image asset**, and **Add image node**. Add an asset once, create one or
more nodes, then use the existing selection, transform, history, JSON export,
and SVG export tools normally.

Asset sources are not fetched, uploaded, or authenticated by Core. Keep URLs
or data URLs stable in your application, enforce your own content policy, and
serve cross-origin image resources with the CORS policy your Canvas export
workflow requires.
