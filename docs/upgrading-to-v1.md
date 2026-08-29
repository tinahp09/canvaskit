# Upgrading to CanvasKit V1

CanvasKit `1.0.0` makes the seven package-root APIs the stable public contract.
Phase 9 does not intentionally remove or rename a `0.9.0` root export, but
pre-1.0 subpath imports and undocumented implementation behavior were never
public API and are not covered by the `1.x` compatibility promise.

## 1. Align package versions

Keep every installed CanvasKit package on the same compatible `1.x` line. Add
only the packages the application uses:

```sh
pnpm add @canvaskit/core@^1.0.0 \
  @canvaskit/geometry@^1.0.0 \
  @canvaskit/renderer-canvas@^1.0.0 \
  @canvaskit/renderer-svg@^1.0.0 \
  @canvaskit/plugins@^1.0.0
```

React consumers also need React 18 or newer and `react-dom` 18 or newer:

```sh
pnpm add @canvaskit/react@^1.0.0 react@^18 react-dom@^18
```

Vue consumers need Vue 3.3 or newer:

```sh
pnpm add @canvaskit/vue@^1.0.0 vue@^3.3
```

Do not install both framework adapters unless the application actually uses
both.

## 2. Use package-root imports

Import only from a documented package root:

```ts
import { CanvasKit, createScene } from '@canvaskit/core'
import { CanvasRenderer } from '@canvaskit/renderer-canvas'
```

Imports that append source, build-output, or other file subpaths to a CanvasKit
package name are private and may stop resolving in any release. The package
export maps intentionally expose only `.`.

## 3. Check scene persistence

The current canonical scene schema remains version 2. Continue to use
`exportScene()` and `importScene()` rather than reading or coercing unknown JSON
directly.

- Version 2 documents are validated and returned.
- Version 1 documents are migrated by retaining nodes, viewport, and metadata
  and supplying graph collections when absent.
- Malformed data throws `InvalidSceneError`.
- Unsupported versions throw `UnsupportedSceneVersionError`.

Keep the current editor state when an import fails. After a successful import,
`canvas.setScene(scene)` intentionally clears undo and redo history so history
does not cross a document boundary. See [Scene migrations](migrations.md).

## 4. Check adapters and plugin calls

- A caller-owned `CanvasKit` passed to a React or Vue provider is not disposed
  by the adapter; the caller remains responsible for its final `dispose()`.
- A provider-created instance is disposed when its provider unmounts.
- `CanvasKitCanvas` handles pointer listeners, scene subscriptions, scheduled
  rendering, and teardown.
- Nuxt applications must construct the editor in a client-only component or
  after mounting; CanvasKit does not render a canvas on the server.
- `createKeyboardPlugin(element)` requires the focusable HTML element that
  receives keyboard input.
- `createMinimapPlugin()` exposes its current read-only value through
  `plugin.summary` after installation.

## 5. Rebuild and verify the application

After updating the lockfile, run the application's typecheck, unit tests, and
production build. Exercise scene import/export, pointer coordinates, keyboard
focus, undo/redo, framework unmounting, and any custom plugins. If the
application ships persisted version 1 scenes, include one real fixture in its
upgrade test.

For the compatibility rules that apply after the migration, read the [API
stability policy](api-stability.md). Public contract changes require semantic
versioning, documentation, and migration guidance; the scene schema continues
to use its own independent version.
