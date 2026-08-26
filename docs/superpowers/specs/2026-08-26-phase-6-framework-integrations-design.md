# CanvasKit Phase 6 Framework Integrations Design

**Date:** 2026-08-26  
**Status:** Approved for implementation planning

## Objective

Release CanvasKit `0.6.0` with lightweight, framework-native React and Vue 3 integrations plus an SSR-safe Nuxt 4 guide. Developers can mount the existing renderer, receive reactive scene updates, and rely on deterministic lifecycle cleanup without introducing framework dependencies into Core.

## Scope

- Create `@canvaskit/react` and `@canvaskit/vue` workspace packages.
- Provide a framework-native CanvasKit instance provider, instance hook/composable, reactive scene subscription, and canvas host component.
- Add independently runnable React and Vue examples that demonstrate editing and export using public package APIs only.
- Document Nuxt 4 integration using client-only mounting.
- Add unit and browser E2E coverage, package documentation, and a `0.6.0` minor changeset.

## Non-goals

- Core must not import React, Vue, Nuxt, or DOM framework APIs.
- The adapters do not introduce a separate scene store or duplicate CanvasKit graph logic.
- No server-side canvas rendering is provided. Nuxt uses a client-only host.
- No packaged toolbar, design system, or framework-specific plugin ecosystem is added in this phase.

## Architecture

Core remains the source of truth. Each adapter owns only framework lifecycle and subscriptions around a supplied or locally-created `CanvasKit` instance. The existing `CanvasRenderer`, SVG renderer, PNG helper, and plugin APIs stay renderer- and framework-independent.

Each adapter has equivalent public concepts:

| Need | React | Vue 3 |
| --- | --- | --- |
| Instance ownership | `CanvasKitProvider`, `useCanvasKit` | `CanvasKitProvider`, `useCanvasKit` |
| Reactive scene | `useCanvasScene` | `useCanvasScene` |
| Canvas lifecycle host | `CanvasKitCanvas` | `CanvasKitCanvas` |

The canvas host accepts a `CanvasKit` instance directly or obtains it from the nearest provider. On mount it creates a Canvas 2D renderer, connects the public pointer input helpers to its canvas element, listens for scene-affecting Core activity, and redraws. On unmount it removes DOM listeners and adapter subscriptions. It never calls `CanvasKit.dispose()` unless it owns the instance created by the provider/hook.

## Public API

`@canvaskit/react` exports:

- `CanvasKitProvider` for ownership and context of a `CanvasKit` instance.
- `useCanvasKit()` which returns the contextual instance and throws a clear error outside a provider.
- `useCanvasScene()` which returns the latest `CanvasScene` and unsubscribes on unmount.
- `CanvasKitCanvas` which renders an accessible `<canvas>` connected to a public `CanvasKit` instance.

`@canvaskit/vue` exports matching names and semantics using Vue 3 Composition API. Vue `useCanvasScene()` returns a readonly shallow ref of the latest scene. `@canvaskit/react` declares `react` and `react-dom` `>=18` as peer dependencies; `@canvaskit/vue` declares `vue` `>=3.3`; both declare CanvasKit package peers using the workspace `0.6.x` range.

## Data Flow and Lifecycle

1. An application provides or creates a `CanvasKit` instance.
2. The provider/hook owns only the instance it creates.
3. The canvas host mounts the Canvas renderer and public pointer/keyboard bindings.
4. User input updates Core; reactive subscriptions publish a current `CanvasScene` to framework UI.
5. Export buttons use public `renderSVG` and `exportPNG` APIs; exported strings are rendered as text, never injected as markup.
6. Unmount removes DOM listeners, subscriptions, and any adapter-owned instance resources exactly once.

## Nuxt 4

Nuxt guidance uses the Vue package through `<ClientOnly>` (or a `.client.vue` component) so no DOM canvas work runs during SSR. The guide shows plugin registration in `onMounted`, displays a fallback, and relies on component unmount cleanup. It does not require a Nuxt module.

## Examples and Documentation

`examples/react-canvas` and `examples/vue-canvas` each show a scene, a mounted interactive canvas, a reactive node-count/status readout, and SVG/PNG export controls. Both import only public package roots. The README and getting-started documentation link to both adapters; a Nuxt guide documents SSR safety and cleanup.

## Validation

- Unit tests verify provider/composable errors, instance ownership, reactive scene updates, canvas listener lifecycle, and cleanup.
- Typechecks validate all packages under strict TypeScript.
- Production Vite builds succeed for both examples.
- Playwright checks mount, canvas interaction, reactive status, export output, and unmount/reload behavior for both examples.
- Existing core, renderer, plugin, serialization, and export suites remain green.

## Release Criteria

- Both adapter packages expose documented public types and peer dependency ranges.
- Every framework-specific example is runnable and uses only public CanvasKit APIs.
- Nuxt instructions explicitly prevent browser-only work during SSR.
- The release includes a `0.6.0` minor changeset and all validation passes.
