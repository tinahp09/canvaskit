# API stability policy

CanvasKit `1.x` treats the root export of each published package as its public API. This policy applies to runtime exports, TypeScript declarations, package peer requirements, and the versioned scene-document contract.

## Stable package boundaries

| Package | Stable responsibility |
| --- | --- |
| `@canvaskit/geometry` | Framework-independent points, rectangles, transforms, and coordinate conversion. |
| `@canvaskit/core` | Scene state, editing, input, history, serialization, spatial queries, and plugin contracts. |
| `@canvaskit/renderer-canvas` | Canvas 2D rendering, scheduling, and PNG export. |
| `@canvaskit/renderer-svg` | SVG rendering and SVG export. |
| `@canvaskit/plugins` | Official optional plugins built on Core's public plugin contract. |
| `@canvaskit/react` | React lifecycle, context, scene subscription, and accessible Canvas host bindings. |
| `@canvaskit/vue` | Vue lifecycle, injection, scene subscription, and accessible Canvas host bindings. |

Only the package root (`@canvaskit/core`, for example) is public. Files beneath `src/`, `dist/`, or any other package subpath are private implementation details even when a package manager or local workspace can resolve them. Examples, documentation, tests, adapters, and plugins must consume package roots.

## Semantic-versioning commitments

- Patch releases fix defects without intentionally changing supported public behavior or types.
- Minor releases may add backwards-compatible exports, options, node types, or capabilities. Existing valid calls and documents remain supported.
- Removing or renaming a public export, narrowing an accepted type, changing required peer versions incompatibly, or intentionally changing established behavior requires a new major version.
- A deprecation remains usable throughout the current major line and includes its replacement and migration guidance before removal in a later major release.

Type-level compatibility is part of the API: a source-compatible consumer that satisfies the documented peer ranges should continue to typecheck after a patch or minor upgrade.

## Scene-document compatibility

The npm package version and scene schema version are independent. Exported scene documents carry an explicit schema version. A schema change must update the version, validate imported data, document the migration, and retain an automatic migration path when the previous format can be upgraded safely. Unsupported versions fail with the documented typed error rather than being interpreted heuristically.

## Changing a stable API

Every publishable change needs a Changeset. Changes that affect a public contract also update its API reference, runnable example where applicable, and migration guidance. Reviewers must confirm the semantic-version impact and run `pnpm test:release`; the release candidate must complete the [V1 release-candidate checklist](release-candidate-checklist.md).

Consumers moving from a pre-1.0 build should follow [Upgrading to CanvasKit
V1](upgrading-to-v1.md). Release owners must use the audited [publishing
runbook](publishing.md) so source-only workspace ranges are rewritten and the
exact consumer artifacts are reviewed before publication.
