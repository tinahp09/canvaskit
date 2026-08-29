# Scene migrations

CanvasKit scene documents use a versioned JSON format. The current canonical
format is version 3.

## Version 1 to version 2

`importScene` accepts Phase 3 version 1 scenes and first migrates them to
version 2.
The migration preserves `nodes`, `viewport`, and `metadata`, retains supplied
`edges` and `groups`, and supplies empty arrays when either graph field is
missing. The resulting document is then fully validated before being returned.

## Version 2 to version 3

V2.2 adds the document-and-layers model. `importScene` migrates every valid
version 2 scene to version 3 by preserving the existing `nodes`, `edges`,
`groups`, `viewport`, and `metadata`, then:

- creates exactly one layer:
  `{ id: 'layer-default', name: 'Default', visible: true, locked: false }`;
- assigns `layerId: 'layer-default'` to each existing node; and
- preserves the old node-array order as the stable order within that layer.

New V3 documents must contain at least one uniquely identified layer, and
every node must name an existing layer. Groups and edges must still reference
existing nodes; groups cannot repeat a member. The migration is intentionally
structural: it does not create nested transform containers or change node
geometry.

Use `exportScene` to produce canonical version 3 JSON. `loadScene` and
`serializeScene` remain compatible aliases for these APIs.

Malformed JSON and invalid scene fields throw `InvalidSceneError`. Unsupported
versions throw `UnsupportedSceneVersionError`, which is an `InvalidSceneError`.
