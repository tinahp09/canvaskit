# CanvasKit V3 Professional Diagram Editor Runtime

## Goal

Make CanvasKit a headless, framework-neutral runtime for professional diagram
editors. Applications should be able to compose a reliable editor experience
without reimplementing hierarchy, tools, selection semantics, property editing,
commands, or diagram-specific constraints.

## Product boundary

CanvasKit owns immutable scene mutations, interaction state, geometry, routing,
and extension contracts. A host application owns visual chrome, persistence,
product policy, identity, and collaboration transport. V3 does not introduce
real-time collaboration, WebGL/WebGPU rendering, animation timelines, or a
full rich-text editor.

## Milestones

| Phase | Publishable developer outcome |
| --- | --- |
| 0 — Hierarchy Core | Scene V7 migration, nested groups, inherited visibility/locking, and group-aware transforms. |
| 1 — Tool Runtime | A deterministic, headless pointer/keyboard tool state machine for select, pan, rectangle, text, and connector tools. |
| 2 — Selection & Manipulation | Lasso, nested/group selection, drag previews, smart snapping, and keyboard nudging. |
| 3 — Inspector Runtime | Typed property schemas and immutable single/multi-selection property mutations. |
| 4 — Command Surface | Context-aware command palette data and configurable keyboard shortcuts. |
| 5 — Diagram Runtime | Typed node definitions, constrained ports, routing policies, and deterministic diagram layouts. |
| 6 — Reference Editor | A polished, glassy reference application that demonstrates the public V3 APIs with Sax icons. |
| 7 — Release | Tests, performance checks, documentation, package/version update, and release-showcase evidence. |

Every completed phase must be independently usable by a developer, documented,
and covered by focused unit tests. A phase may advance only after its focused
tests and the full Core suite pass. Browser E2E is required for visible
reference-editor behavior.

## Scene V7 hierarchy

`CanvasGroup` gains `parentId?: string`, `visible: boolean`, and `locked:
boolean`; `nodeIds` remains the list of direct leaf-node children. A child group
is linked to its parent solely through `parentId`, so a node is never duplicated
in a parent group's `nodeIds`.

The V6 → V7 migration sets each existing group to `{ visible: true, locked:
false }` and leaves it top-level. A valid hierarchy has unique group IDs, only
existing node IDs, each node directly assigned to at most one group, parent IDs
that refer to another group, and no parent cycle. Nodes keep their existing
layer ownership; a group's layer behavior is intentionally inherited from its
leaf nodes rather than duplicated in the group record.

`groupDescendantNodeIds(scene, groupId)` returns direct and recursive leaf
nodes in stable scene-node order. Group visibility and lock state are inherited
through every ancestor. Render projection hides descendants of hidden groups;
pointer interaction rejects descendants of locked or hidden groups. A group
transform resolves to all descendant leaves and changes their positions once,
even where multiple selected groups share descendants.

## Tool and manipulation contract

A `ToolRuntime` owns one active tool and exposes pure, serializable snapshots.
Pointer input is processed as begin/update/end/cancel transitions; tools emit
typed intents instead of rendering UI. Hosts commit intents through Core
controllers and may show previews without mutating their source scene.

Selection stores node and group IDs. Selection expansion resolves groups to
leaf nodes only at mutation time, preserving a concise user-facing selection.
Lasso and snapping are geometry utilities with deterministic tie-breaking.

## Inspector, commands, and diagrams

Inspector definitions describe a property key, label, target node types,
read/write adapters, and mixed-value behavior. Mutations are atomic: a rejected
target leaves the original scene untouched. Commands declare applicability,
shortcut metadata, and an immutable execute callback.

Diagram node definitions provide ports, compatibility rules, sizing, and layout
metadata. The runtime validates connection compatibility before emitting a
connector intent. Routing and layout remain deterministic and independent of a
renderer.

## Reference editor and quality

`examples/diagram-editor` uses the public APIs only. It demonstrates hierarchy,
tools, inspector, command surface, ports, and routing in a glassy professional
shell; Sax icons are used wherever icons are needed. Its browser tests exercise
the visible workflow, not private implementation details.

V3 is feature-frozen before release work. The final release follows the
repository release checklist and release-showcase workflow: clean 5–15 second
GIF, 3–5 screenshots, concise architecture note (problem/challenge/decision/
architecture/trade-offs), changelog, API and migration documentation, and
verified package artifacts. Publication, Git tag, and GitHub Release remain
explicitly user-approved actions.

## Architectural trade-offs

- Hierarchy uses parent links instead of embedding child groups. This keeps the
  schema migration small and serializable, at the cost of resolver helpers.
- Tools emit intents rather than directly changing a Canvas. This adds an
  adapter boundary but makes UI frameworks and renderers interchangeable.
- The V3 inspector is a typed headless schema, not a bundled panel. Hosts gain
  design freedom while CanvasKit remains a library rather than an application.
