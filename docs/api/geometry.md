# Geometry API

`@canvaskit/geometry` contains small, framework-independent values and coordinate helpers. It has no DOM or renderer dependency.

```ts
import { screenToWorld, worldToScreen, type Point, type ViewportTransform } from '@canvaskit/geometry'
```

## Types

- `Point` — `{ x, y }` position in screen or world coordinates.
- `Size` — `{ width, height }` dimensions.
- `Rect` — `{ x, y, width, height }` axis-aligned bounds.
- `ViewportTransform` — the current world translation and scale.

## Functions

### `worldToScreen(point, viewport)`

Converts a world-space point into screen coordinates using a viewport transform.

### `screenToWorld(point, viewport)`

Converts a screen-space point into world coordinates. Use this for pointer input before changing a scene.

### `rectContainsPoint(rect, point)`

Returns whether a point lies within an axis-aligned rectangle, including its boundary.

Geometry helpers are also re-used by Core’s interaction APIs. For an end-to-end setup, continue to [Core](/api/core).
