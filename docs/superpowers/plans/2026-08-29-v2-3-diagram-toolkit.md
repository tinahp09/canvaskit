# CanvasKit V2.3 Diagram Toolkit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver serializable ports and connectors with deterministic routes and diagram-editor interactions.

**Architecture:** Core validates graph endpoints and calculates geometry from current node bounds. Canvas and SVG only draw resolved routes; the example uses public connector commands.

**Spec:** `docs/superpowers/specs/2026-08-29-v2-3-diagram-toolkit-design.md`

### Task 1: Connector schema, migration, and routing core

Add V4 connector/port schema, V3 migration, controller, route geometry, tests and exports. Commit `feat: add diagram connectors`.

### Task 2: CanvasKit connector commands and document integrity

Add create/reconnect/delete connector APIs and history/command wrappers with tests. Commit `feat: add connector commands`.

### Task 3: Canvas/SVG rendering and diagram example

Draw ports/routes/labels, add browser connector workflow and E2E. Commit `feat: add diagram workflow example`.

### Task 4: V2.3 docs, release evidence, and verification

Document graph migration/API and run release workflow. Commit `docs: document V2.3 diagram toolkit`.
