# Export & accessibility API

V2.6 adds two independent packages with no change to Scene V6.

```ts
import { exportPDFDataURL, renderPDF } from '@canvaskit/renderer-pdf'
import { CanvasAccessibilityMirror, createAccessibilitySnapshot } from '@canvaskit/accessibility'

const pdf = renderPDF(scene)
const dataURL = exportPDFDataURL(scene)
const mirror = new CanvasAccessibilityMirror(host, { label: 'Canvas content' })
mirror.update(createAccessibilitySnapshot(scene, selectedIds))
```

`renderPDF` returns deterministic vector PDF bytes for visible nodes and
connectors. `exportPDFDataURL` is suitable for browser preview/download flows.
V2.6 supports shapes, text, connector routes, and an explicit frame for image
nodes; images are not embedded and host fetch/storage are not involved.

`createAccessibilitySnapshot` is a pure projection of visible document order.
`CanvasAccessibilityMirror` owns a visually-hidden labelled list and a polite
status message. Call `update` after scene or selection changes and `destroy`
when removing the host.
