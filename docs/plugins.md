# Plugins

CanvasKit plugins are explicit, local code installed through `canvas.use(plugin)`. Use the official factories from `@canvaskit/plugins` for Grid, Snap, Keyboard, and Minimap behavior, or implement the public `CanvasPlugin` interface for your own extension.

```ts
import { createGridPlugin, createSnapPlugin } from '@canvaskit/plugins'

canvas.use(createGridPlugin({ size: 20 }))
canvas.use(createSnapPlugin({ gridSize: 20 }))
```

## Trust boundary

Treat plugins as trusted application code. Installing a plugin runs its `install(canvas)` function, so only install packages you trust and review any third-party plugin before adding it to your app. Imported scene JSON contains data only: `importScene()` validates and migrates the scene but never discovers, loads, or executes plugins from that data.

Plugin IDs are installed at most once per `CanvasKit` instance. `canvas.dispose()` runs registered cleanup functions in reverse installation order; call it when the editor is permanently unmounted.
