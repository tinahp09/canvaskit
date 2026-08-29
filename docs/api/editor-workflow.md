# Editor workflow API

The V2.1 workflow APIs are exported by `@canvaskit/core`. They are
renderer- and framework-agnostic; [the guide](/guides/editor-workflow) explains
interaction policy and DOM mappings.

```ts
import {
  attachKeyboardInput,
  attachPointerInput,
  CanvasKit,
  type EditorCommand,
  type MarqueeMode,
  type SelectionMode,
} from '@canvaskit/core'
```

## Selection

`SelectionMode` is `'replace' | 'add' | 'remove' | 'toggle'`.

`kit.selection` is a `SelectionController` with:

- `set(ids)` to replace the selection;
- `add(ids)`, `remove(ids)`, and `toggle(ids)` to mutate it;
- `get()` to read selected IDs in scene order;
- `clear()`, `select(id)`, `selectMultiple(ids)`, and `selectAll()` for common
  operations.

Every supplied ID for `set`, `add`, `remove`, or `toggle` must name an existing
node or the call throws `Error('Unknown node id: <id>.')`. Selection changes
notify scene subscribers but do not change the scene document.

## Marquee selection

`MarqueeMode` is `'contain' | 'intersect'`.

```ts
const ids = kit.selectInRect(
  { x: 100, y: 80, width: 280, height: 160 },
  { mode: 'intersect', selection: 'add' },
)
```

`selectInRect(rect, options?)` evaluates node bounds in world coordinates and
returns the matching IDs in scene order. Options are:

```ts
interface MarqueeSelectionOptions {
  mode?: 'contain' | 'intersect' // default: 'contain'
  selection?: 'replace' | 'add' | 'remove' | 'toggle' // default: 'replace'
}
```

`contain` requires a node’s complete bounds to be inside `rect`; `intersect`
requires overlapping bounds. For lower-level custom interactions,
`nodesInRect(scene, rect, mode?, index?)` supports the same modes and an
optional `SpatialIndex`.

## Clipboard and commands

`SceneClipboard` contains `nodes`, `edges`, and `groups` and can be represented
as plain serializable scene data. The CanvasKit-owned clipboard is intentionally
internal to an instance; `copy()` and `cut()` return cloned snapshots.

- `copy(): SceneClipboard` captures the current selection.
- `cut(): SceneClipboard` captures then removes the selection as one undoable
  operation, cleaning invalid relations and clearing selection.
- `paste(offset?: Point): string[]` inserts remapped copies, selects them, and
  returns their fresh node IDs. The default offset is `{ x: 20, y: 20 }`.
- `duplicate(): string[]` is copy then paste with that default offset.
- `copySelection(scene, ids)` and `pasteSelection(scene, clipboard, offset)`
  provide immutable lower-level equivalents.

`EditorCommand` is:

```ts
type EditorCommand =
  | 'select-all'
  | 'clear-selection'
  | 'delete-selection'
  | 'copy'
  | 'cut'
  | 'paste'
  | 'duplicate'
```

`kit.executeCommand(command)` dispatches one of these commands and returns
whether a clipboard-dependent command changed state. It returns `false` for a
copy, cut, paste, or duplicate that has no applicable selection/clipboard;
recognized selection and delete commands return `true`.

## Pointer and keyboard input

`attachPointerInput(element, kit)` forwards DOM `pointerdown`, `pointermove`,
and `pointerup` events to `kit.onPointer`, after converting coordinates from
the element. `CanvasPointerEvent` includes `screen`, world-space `world`,
`button`, `buttons`, and optional `modifiers` (`shiftKey`, `metaKey`, and
`ctrlKey`). Middle-button dragging pans and wheel input zooms the viewport.

`attachKeyboardInput(element, kit)` maps Cmd/Ctrl+A/C/X/V/D, Delete,
Backspace, and Escape to the commands listed in the [guide](/guides/editor-workflow#dom-adapters).
It does not handle shortcuts targeted at editable descendants. Both functions
return `() => void` cleanup callbacks.
