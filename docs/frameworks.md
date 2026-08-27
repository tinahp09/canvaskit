# Framework integrations

CanvasKit keeps scene state in `@canvaskit/core`. The React and Vue packages only connect that state to framework lifecycle, reactive UI, and an accessible Canvas 2D host.

## Install

```sh
# React 18+
pnpm add @canvaskit/core @canvaskit/renderer-canvas @canvaskit/react react react-dom

# Vue 3.3+
pnpm add @canvaskit/core @canvaskit/renderer-canvas @canvaskit/vue vue
```

Both adapters provide a provider, an instance accessor, reactive scene state, and `CanvasKitCanvas`.

| Need | React | Vue |
| --- | --- | --- |
| Instance provider | `CanvasKitProvider` | `CanvasKitProvider` |
| Instance access | `useCanvasKit()` | `useCanvasKit()` |
| Reactive scene | `useCanvasScene()` | `useCanvasScene()` readonly ref |
| Canvas host | `CanvasKitCanvas` | `CanvasKitCanvas` |

Pass an existing `CanvasKit` instance to a provider when your application owns it. The adapter cleans up DOM listeners, subscriptions, and scheduled rendering on unmount, but never disposes that caller-owned instance. A provider-created instance is disposed with the provider.

Use package-root APIs for scene edits and exports. The adapters are intentionally thin: toolbars, persistence UI, and application state stay in your application. See the [React API](/api/react), [Vue API](/api/vue), and [Nuxt SSR guide](/nuxt).
