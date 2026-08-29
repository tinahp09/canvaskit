# CanvasKit V2.3 Diagram Toolkit Design

## Scope

V2.3 adds node ports, connectors with labels, and deterministic orthogonal routing suitable for flowcharts and ERDs. Core owns graph validity and route computation; renderers consume resolved connector geometry.

## Model

- Nodes expose optional named ports at `north`, `east`, `south`, or `west` relative to current node bounds.
- Connectors reference source/target node and port ids, may carry a text label, and use `straight` or `orthogonal` routing.
- Existing V3 edges migrate to connectors using node centers and `straight` routing.
- Deleting/moving nodes keeps relation invariants: dangling connectors are removed, and routes resolve lazily from current bounds.

## API and validation

`ConnectorController` validates endpoints, creates/reconnects/removes connectors, derives route points, and never persists derived points. Orthogonal routes are deterministic two-bend paths chosen by port direction. Tests cover migration, endpoint validation, routes, labels, hide/lock/layer behavior, serialization, Canvas/SVG rendering, and browser creation/reconnect interactions.
