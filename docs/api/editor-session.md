# Editor Session API

V6 adds headless editor-session primitives to `@canvaskit/core`. They organize
independent `CanvasKit` instances without deciding where a host stores data or
how it renders tabs.

## `EditorSession`

Create a session, then open host-owned `CanvasKit` documents:

```ts
import { CanvasKit, EditorSession } from '@canvaskit/core'

const session = new EditorSession()
session.openDocument({ id: 'brief', title: 'Creative brief', kit: new CanvasKit() })
session.openDocument({ id: 'poster', title: 'Poster', kit: new CanvasKit() })
session.activateDocument('poster')
```

- `getSnapshot()` returns frozen, open-order `EditorDocumentSnapshot` data
  (`id`, `title`, and `isDirty`) plus the active id.
- `subscribe(listener)` notifies a host after document, scene, or active-tab
  changes. The host attaches all UI and keyboard listeners itself.
- `saveDocument(id?)` records the active (or named) document's canonical
  serialized scene as its clean baseline.
- `closeDocument(id, { force? })` returns `requiresConfirmation` for a dirty
  document unless `force` is true; closing detaches the scene subscription.
- `getDocument(id)` and `getActiveDocument()` return the host-owned kit for
  rendering or editing.

Dirty state is a comparison of canonical `serializeScene(kit.getScene())`
against that saved baseline. Selection-only changes are therefore not dirty.

## `EditorSessionCommands`

Every session exposes `session.commands`:

```ts
const available = session.commands.getSnapshot()
session.commands.execute('select-all')
```

Its initial commands bridge CanvasKit's existing editor commands to the active
document. `getSnapshot()` contains only enabled commands; for example,
`delete-selection` is absent without a node or connector selection. `execute`
returns `{ executed: false, reason: 'missing' | 'disabled' }` instead of
throwing for normal availability misses.

Hosts can add their own `EditorCommandDefinition` through `register`. The
executor receives a `CommandContext` with `activeDocumentId`; keyboard-event
normalization and DOM listener attachment remain host-owned.

## `CommandRegistry`

`CommandRegistry` is the same deterministic command primitive for non-session
hosts. It rejects duplicate ids, normalizes equivalent shortcuts such as
`shift + mod + k` to `Mod+Shift+K`, provides a title-sorted frozen snapshot,
and resolves shortcuts through `findByShortcut`.

V6 deliberately adds no browser-tab API, filesystem persistence, autosave,
auth, CRDT, or cross-document transaction. Those policies remain in the host.
