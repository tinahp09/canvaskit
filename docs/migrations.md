# Scene migrations

CanvasKit scene documents use a versioned JSON format. The current canonical
format is version 2.

## Version 1 to version 2

`importScene` accepts Phase 3 version 1 scenes and migrates them to version 2.
The migration preserves `nodes`, `viewport`, and `metadata`, retains supplied
`edges` and `groups`, and supplies empty arrays when either graph field is
missing. The resulting document is then fully validated before being returned.

Use `exportScene` to produce version 2 JSON. `loadScene` and `serializeScene`
remain compatible aliases for these APIs.

Malformed JSON and invalid scene fields throw `InvalidSceneError`. Unsupported
versions throw `UnsupportedSceneVersionError`, which is an `InvalidSceneError`.
