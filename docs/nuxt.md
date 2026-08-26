# Nuxt 4 and SSR

`@canvaskit/vue` is intended for browser canvas rendering. Nuxt can render the rest of an editor on the server, but the `CanvasKit` instance and `CanvasKitCanvas` host must be created only on the client. CanvasKit does not provide server-side canvas rendering.

Install the Vue adapter and its required CanvasKit packages:

```sh
pnpm add @canvaskit/core @canvaskit/renderer-canvas @canvaskit/vue vue
```

The simplest Nuxt pattern is a client-only component. The `.client.vue` suffix prevents Nuxt from rendering or evaluating this editor component during SSR; its unmount lifecycle automatically removes the canvas host's pointer listeners and scene subscription.

```vue
<!-- components/CanvasEditor.client.vue -->
<script setup lang="ts">
import { CanvasKit, addRectangle, createScene } from '@canvaskit/core'
import { CanvasKitProvider } from '@canvaskit/vue'

const canvas = new CanvasKit({
  scene: addRectangle(createScene(), {
    id: 'welcome', position: { x: 120, y: 80 }, size: { width: 240, height: 120 }, fill: '#7C7FF2',
  }),
})
</script>

<template>
  <CanvasKitProvider :canvas="canvas">
    <CanvasSurface />
  </CanvasKitProvider>
</template>
```

The nested component can use the provider's instance and reactive scene composable:

```vue
<!-- components/CanvasSurface.vue -->
<script setup lang="ts">
import { CanvasKitCanvas, useCanvasScene } from '@canvaskit/vue'

const scene = useCanvasScene()
</script>

<template>
  <p role="status">Nodes: {{ scene.nodes.length }}</p>
  <CanvasKitCanvas :width="960" :height="540" />
</template>
```

Use it from an SSR page with a fallback:

```vue
<!-- pages/index.vue -->
<template>
  <ClientOnly fallback-tag="p" fallback="Loading editor…">
    <CanvasEditor />
  </ClientOnly>
</template>
```

Alternatively, keep a server-rendered shell and construct the `CanvasKit` instance in `onMounted()` before rendering `CanvasKitCanvas`. Do not access `window`, `document`, or a canvas element in page setup or server middleware. If you pass an instance to `CanvasKitProvider`, it remains your responsibility to call `canvas.dispose()` when application-level ownership ends.
