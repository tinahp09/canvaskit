# @canvaskit/core

Framework- and renderer-agnostic scene, editing, history, and interaction
primitives for CanvasKit.

## V2.2 document & layers

Scenes now serialize as schema version 3. Every node has a `layerId`, and every
scene has ordered `CanvasLayer` records with `id`, `name`, `visible`, and
`locked` fields. `importScene` migrates V1/V2 scenes to one visible, unlocked
`layer-default` layer without changing node, edge, group, viewport, or metadata
content. The Core [document & layers guide](../../docs/guides/document-layers.md)
and [API reference](../../docs/api/document-layers.md) cover the public
immutable helpers and `CanvasKit` commands.

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
