# @canvaskit/core

Framework- and renderer-agnostic scene, editing, history, and interaction
primitives for CanvasKit.

## V2.1 editor workflow

`CanvasKit` provides ordered multi-selection, world-coordinate marquee
selection, an instance-local serializable-scene clipboard, and programmatic
editor commands. The package does not access the system clipboard or prescribe
a toolbar or renderer.

```ts
import { CanvasKit, createScene } from '@canvaskit/core'

const kit = new CanvasKit({ scene: createScene() })
kit.selectInRect({ x: 0, y: 0, width: 300, height: 200 }, {
  mode: 'contain',
  selection: 'replace',
})
kit.executeCommand('duplicate')
```

For DOM hosts, use `attachPointerInput(element, kit)` and
`attachKeyboardInput(element, kit)`. The [editor workflow guide](../../docs/guides/editor-workflow.md)
and [API reference](../../docs/api/editor-workflow.md) document selection,
marquee, clipboard, commands, and DOM mappings.
