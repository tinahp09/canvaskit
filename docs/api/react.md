# React API

`@canvaskit/react` supplies React 18+ lifecycle bindings around a Core instance and Canvas 2D host.

```tsx
import { CanvasKitCanvas, CanvasKitProvider, useCanvasKit, useCanvasScene } from '@canvaskit/react'
```

## `CanvasKitProvider`

`CanvasKitProvider` exposes a `CanvasKit` instance to descendants. Pass `canvas` when the application owns the instance; omit it to have the provider create and dispose one. Its props are available as `CanvasKitProviderProps`.

## `useCanvasKit()` and `useCanvasScene()`

`useCanvasKit()` reads the nearest provider and throws when no provider exists. `useCanvasScene()` subscribes to Core, returns the latest `CanvasScene`, and unsubscribes when its component unmounts.

## `CanvasKitCanvas`

`CanvasKitCanvas` renders an accessible `<canvas>` backed by `CanvasRenderer`. Supply a `canvas` prop or place it inside a provider. `width`, `height`, and `ariaLabel` are optional; `CanvasKitCanvasProps` documents them.

On mount, the host connects pointer input and a scene subscription. On unmount, it removes input listeners, subscriptions, and scheduled renders. It does not dispose a caller-owned instance. See the [framework guide](/frameworks) and runnable [React example](/examples).
