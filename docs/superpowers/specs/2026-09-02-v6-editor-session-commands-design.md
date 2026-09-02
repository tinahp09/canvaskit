# CanvasKit V6 Editor Session & Commands

## Goal

Provide the application-level primitives that let a CanvasKit host behave like
a professional editor: multiple named documents, explicit active-document
selection, dirty-state awareness, and an extensible command/keybinding layer.

## Scope

V6 adds a headless `EditorSession` in Core. It owns document tabs, each tab's
`CanvasKit` instance, active-tab state, and saved-scene baseline. It exposes a
`CommandRegistry` with deterministic registration, availability checks,
keyboard shortcut lookup, and command execution against the active document.

Built-in commands bridge the existing `CanvasKit.executeCommand` surface. A
host can register commands without importing private Core files. The reference
editor gains a compact command palette and visible tab/dirty state.

## Public API

```ts
new EditorSession({ createKit?, initialDocuments? })
session.open({ id, title, scene? })
session.close(id, { force? })
session.activate(id)
session.save(id?)
session.getSnapshot()
session.subscribe(listener)

new CommandRegistry()
registry.register({ id, title, shortcut?, isEnabled?, execute })
registry.execute(id, context)
registry.findByShortcut(shortcut)
```

`EditorSession` owns identity and lifecycle only; `CanvasKit` remains the
source of scene mutations, history, selection, and collaboration. A document
is dirty exactly when its canonical serialized scene differs from the most
recent saved baseline.

## Constraints and non-goals

- No filesystem, browser tabs, localStorage, backend, auth, autosave, or
  document format change.
- No CRDT or cross-document transaction.
- Closing a dirty document returns a structured `requiresConfirmation` result;
  hosts supply their own dialog rather than Core opening UI.
- Shortcut normalization is platform-neutral (`Mod`, `Shift`, `Alt`) and event
  attachment remains a host concern.

## Architecture

```text
Host UI → EditorSession → active CanvasKit
       → CommandRegistry → existing CanvasKit command / host command
       ← immutable session snapshot + subscription
```

The session listens to each kit's public scene subscription. On scene change it
recomputes dirty state against the saved serialized baseline and emits a sorted,
immutable snapshot. Closing detaches subscriptions, preventing stale document
updates.

## Trade-offs

Serialization-based dirty checks are predictable and schema-safe but cost more
than a revision counter for very large scenes. V6 chooses correctness and a
clear public contract; a future version may add a cache-backed revision hint.
The registry intentionally does not install keyboard listeners, preserving SSR
and framework neutrality.

## Verification

Unit tests cover open/activate/close, dirty transitions, forced-close policy,
subscriptions, duplicate IDs, registry ordering, disabled commands, and
shortcut normalization. Browser E2E covers tab switching, dirty marker, and
palette-driven built-in command execution.
