# Scene migrations

CanvasKit scene documents use a versioned JSON format. The current canonical
format is version 6.

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

At the V2.2 boundary, `exportScene` produced canonical version 3 JSON.
`loadScene` and `serializeScene` remain compatible aliases for these APIs.

## Version 3 to version 4

V2.3 replaces legacy graph `edges` with canonical `connectors`. Each valid V3
edge becomes a connector with the same IDs and endpoint nodes, `straight`
routing, and centre endpoint ports. The migration deliberately persists no
route geometry: port positions and every straight or orthogonal route are
derived from current node bounds at render and interaction time.

New V4 documents use a `connectors` array. Each connector names existing source
and target nodes and one of their derived `north`, `east`, `south`, or `west`
ports. `importScene` accepts V1–V3 documents; `exportScene` always writes
canonical version 4 JSON.

## Version 4 to version 5

V2.4 adds persistent ruler guides. V4 imports become V5 with `guides: []`;
existing nodes, connectors, layers, groups, viewport, metadata, and order are
unchanged. A V5 guide has a unique ID, horizontal/vertical axis, and finite
world-coordinate position. Transient smart-snap feedback is never serialized.

Malformed JSON and invalid scene fields throw `InvalidSceneError`. Unsupported
versions throw `UnsupportedSceneVersionError`, which is an `InvalidSceneError`.

## Version 5 to version 6

V2.5 adds an `assets` registry and structural rich-text runs. V5 imports become
V6 with `assets: []`; every existing text node gains
`runs: [{ text: node.text }]`. Existing geometry, layers, connectors, groups,
guides, viewport, metadata, and ordering are unchanged. New image nodes must
reference an existing asset and carry a valid normalized crop rectangle.
