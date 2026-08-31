# Plugin platform API

V2.7 supplies a headless extension runtime on each `CanvasKit` instance.

```ts
kit.registerCommand({ id: 'inspect', label: 'Inspect', run: (canvas) => console.log(canvas.getDiagnostics()) })
kit.registerTool({ id: 'comment', label: 'Comment', activate: () => {}, deactivate: () => {} })
kit.activateTool('comment')
```

`registerCommand`, `registerTool`, `registerNodeDefinition`, and
`registerInspector` return idempotent cleanup functions. Commands execute only
when explicitly requested through `executeRegisteredCommand`; tools activate
and deactivate in a deterministic order. `getDiagnostics()` reports plugins,
registered definitions, active tool, and the latest extension failure.

Use `createCommandPlugin` from `@canvaskit/plugins` for a small trusted plugin:

```ts
kit.use(createCommandPlugin({ id: 'inspect', label: 'Inspect', run: (canvas) => { /* host code */ } }))
```

Plugins are trusted host code. CanvasKit does not sandbox, fetch, or dynamically
load plugins, and it does not impose a renderer or inspector UI.
