# Upgrading to CanvasKit V3

CanvasKit 3.0.0 writes Scene V7. Existing V1–V6 JSON remains importable.

## Nested groups

V6 groups migrate with `visible: true` and `locked: false`. New groups have
these fields plus optional `parentId`. A node may be a direct member of only one
group; child groups use `parentId`, not repeated parent membership.

## Selection and tools

Selections may now contain group IDs. Callers that manually assume every
selection ID names `scene.nodes` should resolve group IDs using
`groupDescendantNodeIds(scene, id)`.

## Packages

Upgrade all CanvasKit public packages together to the `^3.0.0` range.
