# CanvasKit V2.2 Document & Layers Design

## Purpose

V2.2 makes CanvasKit documents manageable at editor scale: ordered layers, durable groups, visibility/lock state, and relation-safe document commands.

## Scope

- A serializable layer model with ordered nodes, `visible`, `locked`, and named layers.
- Node membership in one layer; a default layer preserves all existing scene behavior after migration.
- Group/ungroup commands that retain valid node IDs and act as one history operation.
- Layer reorder, node reorder, show/hide, lock/unlock, and selection operations that respect document state.
- Renderer ignores hidden nodes/edges and interaction ignores hidden/locked nodes.

## Rules

- Deleting nodes removes dangling edges and group membership, as V2.1 does.
- Hidden or locked nodes cannot be selected by pointer or transformed; programmatic document commands validate membership.
- Layer order determines render and hit-test order. Groups are document metadata, not nested transform containers in this milestone.
- Existing v2 scene data migrates into `layer-default` without data loss.

## Validation

Unit tests prove migrations, ordering, group/layer integrity, history and constraints. Browser tests prove hide/lock interaction, reorder render order, group/ungroup, and undo/redo. V2.2 release follows the project release checklist and release-showcase skill.
