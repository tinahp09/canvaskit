# Task 1 report — Connector schema, migration, and routing core

## Delivered

- Advanced the canonical scene schema to V4 with `CanvasConnector`, named derived `NodePort`s, connector routing, and optional labels.
- Added pure cardinal port derivation for rectangle, circle, and text bounds.
- Migrated V1 → V2 → V3 → V4 scenes. V3 edges are adapted into straight, center-to-center connectors; V4 payloads reject legacy `edges`.
- Added `ConnectorController` creation, endpoint validation, removal, reconnection, and lazy route derivation. Orthogonal routing uses deterministic Manhattan lanes and never persists its derived points.
- Moved clipboard, visible-document projection, graph hit testing, selection deletion, and legacy edge helpers to connector-backed behavior. Legacy edges remain adapters only.
- Updated core exports and V4-focused regression coverage.

## Verification

```text
./node_modules/.bin/vitest run packages/core/test
20 test files passed, 156 tests passed

./node_modules/.bin/tsc -p packages/core/tsconfig.json --noEmit
passed

git diff --check
passed
```

## Intentional task boundary

No CanvasKit connector commands, Canvas/SVG rendering, or example/UI work was added; those are Tasks 2 and 3.
