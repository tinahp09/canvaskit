# Vue API

`@canvaskit/vue` provides the Vue 3.3+ equivalent of the React adapter.

```ts
import { CanvasKitCanvas, CanvasKitProvider, useCanvasKit, useCanvasScene } from '@canvaskit/vue'
```

## `CanvasKitProvider`

`CanvasKitProvider` makes a `CanvasKit` instance available to descendant components. Pass a `canvas` prop for caller ownership, or omit it to let the provider create and dispose the instance. The prop type is `CanvasKitProviderProps`.

## Composables

`useCanvasKit()` returns the nearest instance and throws outside a provider. `useCanvasScene()` returns a readonly shallow ref containing the latest Core `CanvasScene`; Vue templates unwrap it automatically.

## `CanvasKitCanvas`

`CanvasKitCanvas` mounts an accessible Canvas 2D host. It receives a `canvas` prop or uses the nearest provider; `width`, `height`, and `ariaLabel` are optional `CanvasKitCanvasProps` fields.

The component manages pointer input, scene subscriptions, render scheduling, and teardown with its lifecycle. In Nuxt, use it only on the client; see [Nuxt and SSR](/nuxt).
