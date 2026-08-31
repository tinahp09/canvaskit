# V2.3 architecture — Diagram toolkit

## Problem

CanvasKit could represent only generic graph edges. Editor authors had no
serializable ports, labelled directional relations, or dependable routes for
flowcharts and ERDs.

## Challenge

Connector geometry changes whenever endpoint bounds move, while document
visibility, locking, layer order, selection, history, Canvas rendering, SVG
export, and pointer input must agree about which relation is valid and visible.
Persisting route points or giving each renderer its own routing code would make
those states drift apart.

## Decision

Make ports derived node-boundary geometry and make V4 connectors canonical
scene data. `ConnectorController` validates endpoint ports, owns create,
reconnect, removal, and deterministic route resolution. Renderers consume the
resolved route; the example only calls public `CanvasKit` connector commands.

## Architecture

`migrateScene` upgrades V1–V3 edges to V4 straight centre-to-centre
connectors. New connectors store IDs, endpoint node/port references, routing
mode, and an optional label—not a derived route. `ConnectorController` derives
north/east/south/west ports from the current node bounds and resolves a stable
straight or obstacle-aware orthogonal route.

`CanvasKit` exposes history-backed `createConnector`, `reconnectConnector`,
`removeConnector`, connector selection, and selection clearing. The document
projection filters relations whose endpoints are hidden; Core rejects actions
against locked or hidden endpoint nodes. Canvas and SVG then draw the same
resolved path, arrow direction, label, and interactive port presentation. The
basic example adds pointer and accessible native-control workflows, keeping UI
policy outside Core.

## Trade-offs

V2.3 supports a fixed four-port vocabulary and deterministic routing rather
than arbitrary custom anchors, editable route handles, or a full auto-layout
solver. That smaller canonical contract keeps serialization and adapters
stable, makes lazy rerouting reliable after node movement, and leaves richer
diagram behaviors for later milestones.
