# Editor workflow

CanvasKit V2.1 provides the editor interactions that many canvas applications
need, while leaving rendering and product UI to the consumer. The workflow API
is headless: use it with a Canvas renderer, another renderer, or no renderer at
all. For every exported type and method, see the [editor workflow API reference](/api/editor-workflow).

## Headless selection and marquee

`CanvasKit.selection` stores node IDs and always returns them in scene order.
`set`, `add`, `remove`, and `toggle` reject IDs that are not nodes in the
current scene. The available selection modes are:

- `replace` replaces the current selection.
- `add` extends it.
- `remove` subtracts matching nodes.
- `toggle` removes selected matches and adds unselected matches.

Use `selectInRect` for a marquee in **world coordinates**. Its `Rect` uses
`x`, `y`, `width`, and `height` in the same coordinate system as node
positions—convert screen coordinates with the viewport before calling it.
`contain` (the default) selects nodes whose complete bounds are inside the
rectangle. `intersect` selects nodes whose bounds overlap it. The selected IDs
returned by `selectInRect` are the marquee result; the `selection` option then
applies that result with one of the modes above.

```ts
import { addRectangle, CanvasKit, createScene } from '@canvaskit/core'

const scene = addRectangle(createScene(), {
  id: 'note',
  position: { x: 40, y: 20 },
  size: { width: 180, height: 80 },
  fill: '#7c7ff2',
})
const kit = new CanvasKit({ scene })

kit.selectInRect(
  { x: 0, y: 0, width: 240, height: 120 },
  { mode: 'contain', selection: 'replace' },
)
```

## Clipboard and commands

The clipboard is internal to one `CanvasKit` instance. `copy()` returns a
defensive `SceneClipboard` snapshot made only from serializable scene entities;
changing that returned object does not alter the internal clipboard. It is not
the browser or operating-system clipboard, does not request permissions, and
does not support cross-origin or cross-application paste.

Copy includes selected nodes, plus only edges and groups whose referenced nodes
are all selected. `cut()` copies first, removes selected nodes, drops invalid
edges, updates affected groups, clears the selection, and is one undoable
history operation. `paste()` makes unique IDs, remaps copied relations, selects
the pasted nodes, and defaults to an `{ x: 20, y: 20 }` world-space offset.
`duplicate()` is copy followed by that default paste.

Use `executeCommand` when a UI should dispatch actions by name:

```ts
kit.executeCommand('select-all')
kit.executeCommand('copy')
kit.executeCommand('paste')
kit.executeCommand('duplicate')
```

It returns `false` when `copy`, `cut`, `paste`, or `duplicate` cannot change
workflow state (for example, no selection or an empty internal clipboard).
Selection-clearing, select-all, and delete-selection commands are recognized
and return `true`.

## DOM adapters

Attach the adapters to the keyboard-focusable editor element. Both return a
cleanup function that removes their listeners.

```ts
import { attachKeyboardInput, attachPointerInput } from '@canvaskit/core'

const detachPointer = attachPointerInput(canvasElement, kit)
const detachKeyboard = attachKeyboardInput(canvasElement, kit)

// Later, when the editor unmounts:
detachPointer()
detachKeyboard()
```

`attachPointerInput` converts client coordinates to element-local screen
coordinates and emits `CanvasPointerEvent` values with derived world
coordinates through `kit.onPointer`. It forwards Shift, Cmd, and Ctrl modifier
state, and retains middle-button panning and wheel zooming. The adapter does
not impose hit testing or selection behavior: implement your editor policy in
the pointer listener. The [basic-canvas example](/examples) uses Shift-click to
add a hit node, Cmd/Ctrl-click to toggle it, empty drag for a `contain`/replace
marquee, and Shift+empty-drag for an `intersect`/add marquee.

`attachKeyboardInput` maps these shortcuts outside editable descendants:

| Input | Command |
| --- | --- |
| Cmd/Ctrl+A | `select-all` |
| Cmd/Ctrl+C | `copy` |
| Cmd/Ctrl+X | `cut` |
| Cmd/Ctrl+V | `paste` |
| Cmd/Ctrl+D | `duplicate` |
| Delete or Backspace | `delete-selection` |
| Escape | `clear-selection` |

The adapter calls `preventDefault()` only for a recognized shortcut that it
dispatches. Inputs, textareas, selects, and content-editable descendants keep
their normal editing behavior.

## Scope of this milestone

V2.1 is an implemented editor-workflow milestone. It does not add a toolbar,
transform handles, system clipboard integration, collaboration, or a new scene
schema. Build controls and application-specific gestures on top of the public
Core contracts instead.
