# CanvasKit v3.0.0 release asset manifest

## Demo

- Reference editor: `examples/diagram-editor`.
- Browser E2E: selection and inspector fill mutation.

## Verified capture sequence

1. Overview of the glassy diagram editor.
2. Select a node and apply an Inspector property.
3. Switch tools and show command surface.

Captured from the passing local example at a stable 1440 × 900 viewport:

| Asset | Evidence |
| --- | --- |
| `v3.0-overview.png` | Glassy editor overview with tools, canvas, and Inspector. |
| `v3.0-inspector-fill.png` | Selected node with an Inspector fill mutation applied. |
| `v3.0-command-surface.png` | Additive selection and the available `Connect selected flow` command. |
| `v3.0-diagram-editor.gif` | Six-second sequence: overview → Inspector mutation → command surface. |

The verified local staging directory is
`/private/tmp/canvaskit-v3-release-media`. The assets stay outside Git until a
release-asset destination is approved; they are not fabricated placeholders.
