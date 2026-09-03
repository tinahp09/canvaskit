# V6 editor session and command architecture

## Problem

CanvasKit could edit one scene at a time, but a professional host needed a
reusable way to coordinate multiple independent documents, determine whether a
document had unsaved scene changes, and expose commands for the active tab.

## Challenge

Tabs, keyboard listeners, persistence, and navigation vary by host. Putting
them in Core would couple a headless canvas runtime to DOM and storage policy;
letting every node or example implement transforms and command state separately
would also make extension difficult.

## Decision

V6 introduces two Core-level boundaries: a pure `CommandRegistry` and an
`EditorSession` that owns document identity, active state, canonical saved
baselines, and subscriptions around host-owned `CanvasKit` instances.

## Architecture

`EditorSession.openDocument` captures `serializeScene(kit.getScene())` as the
baseline and subscribes to that kit. A scene change re-emits an immutable
session snapshot; `isDirty` is calculated against the baseline rather than
stored as a second mutable flag. Closing a document runs its unsubscribe first.

`EditorSessionCommands` wraps `CommandRegistry` and supplies active-document
context. Built-in definitions delegate to the active kit's `executeCommand`.
Availability predicates consult the active selection, so command-palette
snapshots expose only actions that are currently usable. A host owns DOM
events, calls `normalizeShortcut` where useful, and invokes the session API.

## Trade-offs

Canonical serialization is reliable and simple but does work on every
snapshot; V6 chooses correctness and a small API over incremental dirty
tracking. The session knows nothing about storage, browser tabs, autosave,
remote merging, or atomic multi-document undo. Hosts can layer those policies
on the stable session boundary when they need them.
