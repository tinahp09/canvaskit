# CanvasKit v4.0.0 release asset manifest

## Demo

- Reference editor: `examples/collaboration`.
- Browser E2E: remote sync, reconnect replay, and out-of-order delivery.

## Verified capture sequence

1. Open two connected clients and add Ada’s rectangle.
2. Disconnect Bea, queue an edit, and expose the offline state.
3. Deliver queued operations newest-first to show deterministic convergence.

Captured from the passing local example at a stable 1440 × 900 viewport:

| Asset | Evidence |
| --- | --- |
| `v4.0-overview.png` | Two connected editor clients and active presence. |
| `v4.0-remote-sync.png` | Ada’s mutation visibly delivered to Bea. |
| `v4.0-reconnect.png` | Offline Bea, queued operations, and reconnection controls. |
| `v4.0-converged.png` | Replayed state after Bea reconnects. |
| `v4.0-collaboration.gif` | Focused interaction sequence: edit → disconnect → queue → convergence. |

The verified assets are committed at `docs/public/releases/v4/` and are captured
from the browser-tested local reference app.
