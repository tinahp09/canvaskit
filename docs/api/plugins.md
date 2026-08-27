# Official plugins API

`@canvaskit/plugins` provides optional behavior that installs through `canvas.use(plugin)`.

```ts
import {
  createGridPlugin,
  createKeyboardPlugin,
  createMinimapPlugin,
  createSnapPlugin,
} from '@canvaskit/plugins'
```

## Factories

- `createGridPlugin(options)` returns a `GridPlugin`. Its `config` exposes grid display settings for a renderer or UI.
- `createSnapPlugin(options)` returns a `SnapPlugin`. Call `snap(point)` to align a point to its configured grid.
- `createKeyboardPlugin()` attaches Core keyboard behavior while installed.
- `createMinimapPlugin()` returns a `MinimapPlugin`; use `getSceneSummary()` to derive a compact scene summary for your minimap UI.

Grid and snap options are available as `GridPluginOptions` and `SnapPluginOptions`; minimap summaries use `MinimapSceneSummary`.

Plugins are trusted application code. Their `install` hook runs immediately, each plugin ID can be installed only once on a `CanvasKit` instance, and cleanup functions run in reverse order when `canvas.dispose()` is called. Read the [plugin guide](/plugins) before accepting third-party plugins.
