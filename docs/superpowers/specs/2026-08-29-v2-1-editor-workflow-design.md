# CanvasKit V2.1 Editor Workflow Design

## Purpose

V2.1 turns CanvasKit's existing selection and copy/paste primitives into a dependable, headless editor-workflow layer. It is a milestone on the path to CanvasKit as infrastructure for professional visual editors; it does not ship a prescribed toolbar or product UI.

## Scope

- Stable, ordered selection operations: replace, add, remove, toggle, and clear.
- World-space marquee selection with explicit `contain` and `intersect` modes.
- An internal, serializable clipboard for copy, cut, paste, and duplicate, including node/group/edge integrity and deterministic offsets.
- A command layer for editor shortcuts and programmatic invocation.
- Pointer and keyboard adapters that map DOM events to public core APIs.
- A runnable basic-canvas workflow example and browser E2E coverage.

## Non-goals

- System clipboard access, browser permissions, and cross-origin paste.
- Resize/rotate handles, connector routing, layers, rich text, or product-specific toolbar UI.
- Changes to the serializable CanvasScene schema.

## Architecture

`@canvaskit/core` owns all selection, marquee, clipboard, and command semantics. The Canvas renderer receives only scene and selection state; DOM adapters translate browser events to core methods. React and Vue remain consumers of the public core contract rather than carrying a second editor model.

## Public contracts

```ts
type SelectionMode = 'replace' | 'add' | 'remove' | 'toggle'
type MarqueeMode = 'contain' | 'intersect'

interface MarqueeSelectionOptions {
  mode?: MarqueeMode
  selection?: SelectionMode
}

class SelectionController {
  set(ids: readonly string[]): void
  add(ids: readonly string[]): void
  remove(ids: readonly string[]): void
  toggle(ids: readonly string[]): void
  get(): string[]
}

class CanvasKit {
  selectInRect(rect: Rect, options?: MarqueeSelectionOptions): string[]
  copy(): SceneClipboard
  cut(): SceneClipboard
  paste(offset?: Point): string[]
  duplicate(): string[]
  executeCommand(command: EditorCommand): boolean
}

type EditorCommand =
  | 'select-all' | 'clear-selection' | 'delete-selection'
  | 'copy' | 'cut' | 'paste' | 'duplicate'
```

`set`, `add`, `remove`, and `toggle` reject unknown node IDs and preserve scene order in `get()`. Marquee calculations run in world coordinates. `contain` retains only fully enclosed nodes; `intersect` retains any node whose bounds overlap the selection rect. Selection modifiers apply after the marquee result is computed.

The clipboard remains internal to a CanvasKit instance and is composed only of serializable scene entities. `cut` copies first, removes selected nodes, removes edges that no longer have valid endpoints, removes affected group membership, clears selection, and creates one undoable history operation. Every paste creates unique IDs, selects the pasted nodes, and uses `{ x: 20, y: 20 }` by default. Duplicate is equivalent to copy then paste with the same offset.

Keyboard mapping is Cmd/Ctrl+A, Cmd/Ctrl+C/X/V/D, Delete/Backspace, and Escape. Pointer Shift modifies selection additively; Cmd/Ctrl toggles a hit node. An empty-canvas drag performs a `contain` marquee, while Shift+drag performs an additive `intersect` marquee.

## Validation

Core unit tests prove selection ordering, marquee modes, clipboard integrity, history, command behavior, and keyboard mapping. Basic-canvas browser tests prove additive selection, marquee, copy/paste, duplicate, cut/undo, and no console errors. Typechecks, package builds, docs build, and the release-quality gates remain green.
