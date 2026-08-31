# Smart layout API

V2.4 adds Scene V5 ruler guides and immutable layout primitives.

```ts
import { CanvasKit, LayoutController } from '@canvaskit/core'

kit.createGuide({ id: 'baseline', axis: 'horizontal', position: 320 })
kit.selection.set(['title', 'subtitle'])
kit.layoutSelection({ direction: 'vertical', origin: { x: 80, y: 120 }, gap: { x: 24, y: 24 } })
```

`CanvasGuide` is `{ id, axis: 'horizontal' | 'vertical', position }`. Guide
IDs are unique and positions are finite world coordinates. V1–V4 imports gain
an empty `guides` array; V5 exports retain it.

`LayoutController` exposes pure `createGuide`, `moveGuide`, `removeGuide`,
`snapTranslation`, and `autoLayout` operations. Snap candidates are persistent
guides followed by visible unlocked peer-node edges and centres. `SnapResult`
contains the accepted delta plus transient `activeGuides` for renderer feedback.

`CanvasKit` wraps persistent mutations in history: `createGuide`, `moveGuide`,
`removeGuide`, and `layoutSelection`. `snapSelection` returns preview feedback
without changing the scene or history; read it with `getActiveLayoutGuides()`.
Auto-layout supports `horizontal`, `vertical`, and `grid`; grid needs positive
`columns`, while `gap` and `origin` use deterministic defaults.
