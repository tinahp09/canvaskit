# CanvasKit V3 Professional Diagram Runtime

## Problem

Applications building diagram editors repeatedly had to recreate hierarchy,
tool state, multi-selection properties, command availability, and connection
policy above the V2 scene primitives.

## Challenge

Those capabilities must work consistently across Canvas, SVG, React, Vue, and
host-owned UI without making Core a visual editor application.

## Decision

V3 keeps scene mutations immutable and renderer-neutral, adding focused Core
runtimes: Scene V7 hierarchy, `ToolRuntime`, `InspectorRuntime`, command
surface snapshots, and `DiagramRuntime` policies.

## Architecture

```
DOM / framework adapter → CanvasKit pointer events → ToolRuntime intents
                                               ↓
Host UI → InspectorRuntime / command palette → immutable CanvasScene mutation
                                               ↓
                             DiagramRuntime policy → ConnectorController route
```

`CanvasGroup.parentId` defines nested hierarchy while leaf nodes retain their
layer ownership. Group visibility and locking are resolved by document helpers;
selection and transforms preserve compact group IDs until leaf expansion is
needed. The reference editor uses these public APIs rather than private state.

## Trade-offs

Tools emit intents rather than directly drawing or mutating. This requires a
small host adapter, but keeps applications free to choose their renderer,
toolbar, persistence, and collaboration model. Real-time collaboration and
GPU rendering remain future work.
