# Smart layout

Use persistent ruler guides for document landmarks and `snapSelection` for
preview feedback. The example's controls demonstrate both workflows without
prescribing a product UI.

```ts
kit.createGuide({ id: 'content-left', axis: 'vertical', position: 80 })
kit.selection.set(['card-a', 'card-b'])
const preview = kit.snapSelection({ x: 9, y: 0 }, { tolerance: 8 })
renderer.render(kit.getScene(), kit.selection.get(), undefined, undefined, preview.activeGuides)
```

Use `layoutSelection` for an undoable, explicit flow:

```ts
kit.layoutSelection({ direction: 'grid', columns: 3, gap: { x: 24, y: 24 }, origin: { x: 80, y: 120 } })
kit.undo()
```

Hidden and locked nodes are not snap candidates or layout targets. Active snap
guides are intentionally not serializable; only user-created ruler guides are.
