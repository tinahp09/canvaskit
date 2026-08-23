# CanvasKit — Product Requirements Document

**Version:** 0.1.0  
**Status:** Planning / MVP  
**License:** Open Source (to be finalized)

## 1. Overview

CanvasKit is a TypeScript-first, framework-agnostic canvas engine for building interactive visual editors on an infinite canvas.

It provides reusable infrastructure for:

- Whiteboards
- Workflow editors
- ERD/database designers
- System architecture diagrams
- Flowcharts
- Mind maps
- Visual programming tools
- Developer-focused visual editors

The project is intended primarily as a high-quality open-source engineering project and portfolio piece. Future premium functionality may be added without compromising the usefulness of the open-source core.

> **Build the engine, not the application.**

## 2. Goals

1. Build a reusable infinite-canvas engine.
2. Provide a clean, strongly typed TypeScript API.
3. Support nodes, edges, groups, selection, viewport transformations, and history.
4. Provide a plugin system.
5. Separate core logic from rendering and framework integrations.
6. Make Vue/Nuxt a first-class integration.
7. Provide a React adapter.
8. Support JSON serialization and import/export.
9. Demonstrate the engine through multiple real-world examples.
10. Build the architecture so future collaboration/cloud/premium packages can be added without rewriting the core.

## 3. Non-Goals

The MVP will not attempt to be:

- A Figma clone
- A Miro clone
- A complete hosted SaaS
- A multiplayer collaboration platform
- A full design system
- An AI canvas
- An authentication/billing platform

These may be considered later.

## 4. Target Users

### Primary

Developers building:

- Workflow builders
- Diagram editors
- Architecture tools
- ERD editors
- Visual programming applications
- Internal developer tools
- Whiteboard-like products

### Secondary

Frontend engineers who need:

- Infinite canvas
- Graph visualization
- Node-based UI
- Custom interactions
- Undo/redo
- Serialization
- Custom rendering

## 5. Positioning

CanvasKit should be positioned as:

> **An open-source TypeScript engine for building interactive visual editors.**

The project should not compete by simply implementing more whiteboard features. Its differentiation should be clean architecture, extensibility, TypeScript DX, framework independence, Vue/Nuxt support, and performance.

## 6. Architecture

```text
CanvasKit
│
├── Core
│   ├── Scene
│   ├── Nodes
│   ├── Edges
│   ├── Groups
│   ├── Viewport
│   ├── Selection
│   ├── Events
│   └── History
│
├── Rendering
│   ├── Canvas Renderer
│   └── SVG Renderer
│
├── Geometry
│   ├── Point
│   ├── Vector
│   ├── Rect
│   ├── Bounds
│   ├── Transform
│   ├── Matrix
│   └── Intersection
│
├── Interaction
│   ├── Pan
│   ├── Zoom
│   ├── Drag
│   ├── Selection
│   ├── Resize
│   └── Rotate
│
├── Plugins
│   ├── Grid
│   ├── Snap
│   ├── Minimap
│   └── Keyboard
│
├── Adapters
│   ├── Vue
│   └── React
│
└── Examples
    ├── Whiteboard
    ├── Workflow
    ├── ERD
    └── Architecture
```

## 7. Monorepo

Recommended stack:

- TypeScript
- pnpm
- Turborepo
- Vitest
- Playwright
- Storybook
- Changesets
- GitHub Actions

Repository:

```text
canvaskit/
├── packages/
│   ├── core/
│   ├── geometry/
│   ├── renderer-canvas/
│   ├── renderer-svg/
│   ├── vue/
│   ├── react/
│   └── plugins/
├── examples/
│   ├── whiteboard/
│   ├── workflow/
│   ├── erd/
│   └── architecture/
├── playground/
├── docs/
├── benchmarks/
├── tests/
└── .github/
```

## 8. Core Concepts

### Scene

Represents the complete visual state and contains nodes, edges, groups, metadata, selection, and viewport state.

### Node

A visual object positioned in world coordinates.

Built-in types:

- Rectangle
- Circle
- Text
- Image

Custom node types must be supported.

Example:

```ts
canvas.nodes.create({
  id: 'user',
  type: 'rectangle',
  position: { x: 100, y: 200 },
  size: { width: 180, height: 80 }
})
```

### Edge

Represents a connection between nodes.

Initial types:

- Line
- Arrow
- Bezier

### Group

Allows multiple objects to be manipulated as one logical unit.

## 9. Viewport & Infinite Canvas

The engine must separate screen coordinates from world coordinates.

Viewport responsibilities:

- Pan
- Zoom
- Translation
- Scale
- Centering
- Fit-to-content
- Screen/world coordinate conversion

Example API:

```ts
canvas.viewport.zoomIn()
canvas.viewport.zoomOut()
canvas.viewport.reset()
canvas.viewport.panTo(x, y)
canvas.viewport.zoomTo(1.5)
canvas.viewport.zoomToFit()
```

Requirements:

- Infinite-feeling workspace
- Negative world coordinates
- Smooth pan/zoom
- Zoom centered around pointer position

## 10. Interaction System

Supported interactions:

- Pointer down/move/up
- Click
- Double click
- Drag
- Single selection
- Multi-selection
- Rectangle selection
- Delete
- Copy/paste
- Keyboard shortcuts
- Resize
- Rotate
- Grid snapping
- Object snapping

The interaction layer must be independent from application-specific UI.

## 11. Selection

Selection is a first-class subsystem.

```ts
canvas.selection.select('node-1')
canvas.selection.selectMultiple(['node-1', 'node-2'])
canvas.selection.clear()
canvas.selection.get()
canvas.selection.selectAll()
```

Features:

- Selection box
- Multi-select
- Selection handles
- Selection events
- Locked objects
- Non-selectable objects

## 12. History

Use a command-based history architecture rather than storing a complete scene snapshot for every operation.

```ts
interface Command {
  execute(): void
  undo(): void
}
```

Support:

- Undo
- Redo
- Command grouping
- Transactions
- Configurable history limit

## 13. Serialization

The scene must be serializable and versioned.

```ts
const data = canvas.toJSON()
canvas.load(data)
```

Example:

```json
{
  "version": 1,
  "nodes": [],
  "edges": [],
  "groups": [],
  "metadata": {}
}
```

Requirements:

- Import/export JSON
- Stable schema
- Schema version
- Migration support

## 14. Rendering

Rendering must be decoupled from the engine core.

Initial renderers:

1. Canvas 2D
2. SVG

Architecture:

```text
Core
  ↓
Renderer Interface
  ├── Canvas Renderer
  └── SVG Renderer
```

The core should not depend directly on a rendering implementation.

## 15. Geometry Engine

Geometry should be an independent package.

Primitives:

- Point
- Vector
- Rect
- Bounds
- Transform
- Matrix
- Line
- Bezier

Operations:

- Distance
- Intersection
- Containment
- Bounding boxes
- Rotation
- Translation
- Scaling
- Coordinate transformation

## 16. Hit Testing

Support:

- Node hit testing
- Edge hit testing
- Group hit testing
- Custom hit testing
- Layer-aware hit testing

Hit testing must be optimized for large scenes.

## 17. Spatial Index

After the basic engine is stable, introduce a spatial indexing layer for:

- Hit testing
- Viewport culling
- Selection
- Collision detection

Candidate implementation: QuadTree or R-tree, selected through benchmarking.

## 18. Performance

Performance is a first-class requirement.

Benchmark targets:

- 1,000 nodes
- 5,000 nodes
- 10,000 nodes
- 50,000 nodes

Potential techniques:

- Viewport culling
- Spatial indexing
- Batched rendering
- Dirty state tracking
- Layer caching
- OffscreenCanvas where useful

The project should include a dedicated benchmark suite.

## 19. Plugin System

Plugins are a core extension mechanism.

```ts
canvas.use(gridPlugin())
canvas.use(snapPlugin())
canvas.use(minimapPlugin())
```

Plugins may:

- Register events
- Add commands
- Add node types
- Add edge types
- Extend APIs
- Add rendering hooks
- Add framework/UI integration hooks

Example:

```ts
interface CanvasPlugin {
  name: string
  install(canvas: Canvas): void
  destroy?(): void
}
```

## 20. Custom Nodes

Developers must be able to register custom node types.

```ts
canvas.nodes.register('database', {
  render(ctx, node) {},
  hitTest(node, point) {},
  getBounds(node) {}
})
```

Custom nodes should support rendering, geometry, events, state, selection, and resize behavior.

## 21. Framework Adapters

### Vue / Nuxt

Vue 3 is a first-class integration and Nuxt 4 should have a documented integration path.

### React

React should be provided through a separate adapter.

The core remains framework-agnostic.

## 22. Example Applications

### Whiteboard

- Shapes
- Text
- Free drawing
- Connectors
- Sticky notes
- Selection
- Undo/redo

### Workflow Editor

```text
Webhook
   ↓
HTTP Request
   ↓
Condition
  ↙   ↘
Email  Database
```

### ERD Editor

- Tables
- Columns
- Primary keys
- Foreign keys
- Relationships

### System Architecture Designer

- Client
- API Gateway
- Service
- Database
- Redis
- Queue
- Worker

All demos must use the same CanvasKit engine.

## 23. Export

Initial:

- JSON
- SVG
- PNG

Future:

- PDF
- Mermaid
- Other diagram formats

## 24. Accessibility

Provide accessible framework-level controls and keyboard interactions.

Requirements:

- Keyboard navigation where practical
- Keyboard shortcuts
- Focus management
- Accessible toolbar controls
- ARIA labels
- Non-canvas alternatives for important actions where practical

## 25. Testing

### Unit — Vitest

Test:

- Geometry
- Coordinate transforms
- Viewport
- Selection
- History
- Serialization
- Hit testing
- Spatial indexing

### Integration

Test:

- Node interaction
- Edge creation
- Selection
- Undo/redo
- Import/export

### E2E — Playwright

Critical flows:

1. Create node
2. Move node
3. Multi-select
4. Connect nodes
5. Undo/redo
6. Export/import
7. Pan/zoom

## 26. Documentation

Required documentation:

- Getting Started
- Installation
- Core Concepts
- Canvas
- Nodes
- Edges
- Viewport
- Selection
- History
- Plugins
- Custom Nodes
- Rendering
- Performance
- Vue/Nuxt integration
- React integration
- Examples
- API Reference
- Contributing

Every important API should have a description, type definition, example, and relevant edge cases.

## 27. Open Source Strategy

The core should be genuinely useful without premium functionality.

Priorities:

1. High-quality README
2. Clear architecture
3. Documentation
4. Examples
5. Contribution guide
6. Issue templates
7. Pull request template
8. Changelog
9. Semantic versioning
10. Automated releases

Do not artificially restrict core functionality simply to create a paid tier.

## 28. Future Premium Architecture

Premium functionality is not part of the MVP, but the architecture should allow future packages such as:

```text
@canvaskit/pro
@canvaskit/collaboration
@canvaskit/cloud
```

Potential future capabilities:

- Multiplayer collaboration
- Realtime cursors
- Presence
- Comments
- Cloud persistence
- Hosted synchronization
- Advanced export
- Enterprise authentication
- Audit logs
- Advanced performance tooling

The open-source core must remain independently useful.

## 29. Future Collaboration

Possible architecture:

```text
Client A
   ↓
Local Canvas State
   ↓
Collaboration Layer
   ↓
Realtime Transport
   ↓
Collaboration Server
   ↓
Client B
```

Potential technologies:

- WebSocket
- WebRTC where appropriate
- CRDT
- Operational transformation

Technology selection should happen after concrete requirements are known.

## 30. Security

Requirements:

- Validate imported JSON
- Handle malformed scene data safely
- Never execute code from serialized data
- Sanitize exported SVG/HTML where applicable
- Document plugin trust boundaries

## 31. Versioning

Use Semantic Versioning:

```text
MAJOR.MINOR.PATCH
```

Breaking API changes require a major version.

Serialized documents must contain a schema version.

## 32. Milestones

### Phase 0 — Foundation

- [ ] Initialize monorepo
- [ ] Configure TypeScript
- [ ] Configure pnpm
- [ ] Configure Turborepo
- [ ] Configure ESLint
- [ ] Configure Vitest
- [ ] Configure Playwright
- [ ] Configure GitHub Actions
- [ ] Establish package architecture

### Phase 1 — Core Engine

- [ ] Canvas instance
- [ ] Scene
- [ ] Nodes
- [ ] Basic renderer
- [ ] World/screen coordinates
- [ ] Viewport
- [ ] Pan
- [ ] Zoom
- [ ] Basic events

### Phase 2 — Interaction

- [ ] Drag
- [ ] Selection
- [ ] Multi-selection
- [ ] Rectangle selection
- [ ] Delete
- [ ] Keyboard shortcuts
- [ ] Copy/paste
- [ ] Resize
- [ ] Rotate

### Phase 3 — Graph System

- [ ] Edges
- [ ] Arrow rendering
- [ ] Edge hit testing
- [ ] Connection points
- [ ] Groups

### Phase 4 — History & Persistence

- [ ] Command system
- [ ] Undo
- [ ] Redo
- [ ] Transactions
- [ ] Versioned JSON serialization
- [ ] Import/export

### Phase 5 — Extensibility

- [ ] Plugin API
- [ ] Custom node API
- [ ] Custom edge API
- [ ] Renderer interface
- [ ] SVG renderer
- [ ] Vue adapter
- [ ] React adapter

### Phase 6 — Performance

- [ ] Viewport culling
- [ ] Spatial indexing
- [ ] Hit-test optimization
- [ ] Render batching
- [ ] Benchmark suite
- [ ] 10K-node benchmark

### Phase 7 — Examples & Docs

- [ ] Whiteboard
- [ ] Workflow editor
- [ ] ERD editor
- [ ] Architecture editor
- [ ] Documentation site
- [ ] API reference
- [ ] Tutorials
- [ ] Contribution guide

### Phase 8 — V1.0

- [ ] Public API review
- [ ] API cleanup
- [ ] Test coverage review
- [ ] Performance review
- [ ] Documentation review
- [ ] Accessibility review
- [ ] Stable release process
- [ ] Version 1.0 release

## 33. Success Metrics

Success should not be measured only by GitHub stars.

### Adoption

- npm downloads
- GitHub stars
- GitHub forks
- Dependent projects
- Community plugins

### Engineering

- Test coverage
- Bundle size
- Build time
- Performance benchmarks
- API stability

### Community

- Issues
- Pull requests
- Discussions
- External integrations
- Contributors

## 34. Definition of Done for V1

CanvasKit V1 is complete when:

- Core API is stable.
- Infinite canvas is smooth and reliable.
- Nodes and edges are supported.
- Selection and manipulation work reliably.
- Undo/redo uses the command system.
- Serialization is versioned.
- Plugin architecture works.
- Custom nodes are supported.
- Canvas and SVG rendering are available.
- Vue and React integrations exist.
- Performance has been benchmarked.
- 10,000-node scenes have been tested.
- Whiteboard, workflow, ERD, and architecture demos exist.
- Documentation is sufficient for external developers.
- CI runs tests and builds packages.
- Packages can be published to npm.

## 35. Recommended Stack

| Area | Technology |
|---|---|
| Language | TypeScript |
| Package manager | pnpm |
| Monorepo | Turborepo |
| Rendering | Canvas 2D + SVG |
| Vue | Vue 3 |
| Nuxt | Nuxt 4 |
| React | React |
| Unit tests | Vitest |
| E2E | Playwright |
| Component/docs tooling | Storybook |
| Releases | Changesets |
| CI | GitHub Actions |
| Documentation | VitePress |

## 36. Guiding Principles

1. Core first.
2. Framework agnostic.
3. TypeScript first.
4. Performance matters.
5. Extensibility over feature bloat.
6. Small, composable APIs.
7. No artificial limitations in the open-source core.
8. Every major feature should be independently testable.
9. Documentation is part of the product.
10. Build infrastructure that others can build on.

## 37. Final Product Statement

> **CanvasKit is an open-source, TypeScript-first engine for building high-performance, extensible, interactive visual editors on an infinite canvas.**

The project should be genuinely useful as an open-source library while also demonstrating advanced frontend engineering, architecture, rendering, geometry, interaction design, performance optimization, testing, and developer experience.
