# Export & accessibility

Use PDF export when a host needs a portable vector representation without
committing CanvasKit to a download, storage, or print UI.

```ts
const preview = exportPDFDataURL(kit.getScene())
```

For an accessible canvas host, mirror the current visible content into an ARIA
list. The mirror communicates semantic structure while Core remains the owner
of keyboard and pointer interaction.

```ts
const mirror = new CanvasAccessibilityMirror(editorElement, { label: 'Design canvas' })
const unsubscribe = kit.subscribe((scene) => {
  mirror.update(createAccessibilitySnapshot(scene, kit.selection.get()))
})
// later: unsubscribe(); mirror.destroy()
```

The mirror is intentionally not a full editor replacement. Your application
still owns focus transitions, shortcuts, and product-specific descriptions.
