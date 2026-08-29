# CanvasKit V2.2 Document & Layers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a serializable document-layer model with ordered layers, lock/hide semantics, grouping, and relation-safe history commands.

**Architecture:** Core owns the schema migration, layer/document operations, and validation. Renderer and pointer interaction query a shared visible/unlocked document projection; examples consume only public CanvasKit commands.

**Tech Stack:** TypeScript, Vitest, Playwright, Canvas 2D, Vite.

**Spec:** `docs/superpowers/specs/2026-08-29-v2-2-document-layers-design.md`

## Global Constraints

- Migrate Scene V2 data losslessly into a default layer; Schema V3 must validate layer/node/group references.
- All document mutations are immutable, undoable, and leave no dangling graph/group/layer references.
- Hidden/locked semantics are enforced in Core, not just hidden in a UI.
- No publication, tag, push, or binary release media without explicit authority.

### Task 1: Layer schema, migration, validation, and document operations

Create layer model and operations in Core; update migration/serialization/index and write schema/document unit tests. Commit `feat: add document layers`.

### Task 2: CanvasKit document commands and interaction constraints

Add CanvasKit layer/group/reorder/lock/visibility commands, command strings, selection retention, and tests. Commit `feat: add layer document commands`.

### Task 3: Renderer, pointer behavior, and document example

Render layer order/visibility, honor locks in pointer paths, add layer controls and browser tests. Commit `feat: add layer-aware editor example`.

### Task 4: V2.2 docs, release evidence, and full verification

Document schema migration/API, update release artifacts/checklist, capture release evidence where approved, and run full gates. Commit `docs: document V2.2 document layers`.
