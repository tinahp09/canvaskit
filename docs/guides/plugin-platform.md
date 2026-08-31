# Plugin platform

Build extensions around data-only registrations, then let the host render the
toolbar and inspector. This keeps Core portable across Canvas, SVG, React, and
Vue hosts.

```ts
const dispose = kit.registerInspector({ id: 'layout', label: 'Layout', nodeTypes: ['rectangle', 'image'] })
const diagnostics = kit.getDiagnostics()
// later
dispose()
```

An active tool is a lifecycle hook, not a renderer. Register it once, activate
it from your UI, and release it through `kit.dispose()` when the editor ends.
Plugin cleanups still run in reverse installation order.
