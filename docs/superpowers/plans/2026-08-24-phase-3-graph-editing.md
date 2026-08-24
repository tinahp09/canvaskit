# Phase 3 Graph Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Release `0.3.0` with line, arrow, and Bezier edges; drag-to-connect; edge hit testing; connection handles; groups; and a workflow-editor example.

**Architecture:** Core owns typed edges and group membership, immutable graph operations, and hit testing. The Canvas renderer draws nodes before edges with type-specific geometry. The example exposes connection handles and validates workflow creation through browser E2E.

**Tech Stack:** TypeScript, Vitest, Playwright, Canvas 2D, Vite.

**Spec:** `docs/superpowers/specs/2026-08-23-canvaskit-v1-roadmap-design.md`

## Global Constraints

- Core stays renderer- and framework-agnostic.
- Edges reference node ids; invalid endpoints are rejected.
- Graph state remains schema-version-1 serializable.
- New public behavior is red/green unit-tested and demonstrated in the example.

---

### Task 1: Add edge and group scene state
- [x] Test `addEdge`, `removeEdge`, `addGroup`, and JSON round-trip.
- [x] Verify the focused test initially fails.
- [x] Implement `CanvasEdge`, `CanvasGroup`, immutable graph operations, and validation.
- [x] Run core tests and typecheck.
- [x] Commit as part of the Phase 3 release commit.

### Task 2: Implement graph geometry and connection interactions
- [x] Test endpoint lookup, distance-based edge hit testing, and a connection operation that rejects missing nodes.
- [x] Verify initial failure.
- [x] Implement edge geometry, `hitTestEdge`, and `connectNodes`.
- [x] Run focused and all Core tests.
- [x] Commit as part of the Phase 3 release commit.

### Task 3: Draw graph edges and connection affordances
- [x] Test Canvas 2D line, arrowhead, and Bezier drawing with mocked context calls.
- [x] Verify initial failure.
- [x] Implement renderer paths and selectable edge stroke.
- [x] Build renderer and run tests.
- [x] Commit as part of the Phase 3 release commit.

### Task 4: Ship workflow example and `0.3.0`
- [x] Add workflow nodes, connect interaction, E2E validation, documentation, and changeset.
- [x] Run Vite build, all unit tests, and Chrome E2E.
- [x] Commit `feat: release workflow graph editor`.

## Plan Self-Review

The plan covers all Phase 3 roadmap requirements: edges, arrow rendering, edge hit testing, connection points, groups, a workflow example, tests, docs, and release metadata.
