# V2.4 architecture — Smart layout

## Problem

Editor consumers needed accurate placement and repeatable arrangement without
each reimplementing guide math and layer-aware filtering.

## Challenge

Snapping is transient interaction feedback, while rulers must survive export.
Renderer-owned calculations would disagree with Core visibility and locking.

## Decision

Persist only Scene V5 guides. `LayoutController` owns immutable guide mutation,
smart-snap derivation, and deterministic layout; `CanvasKit` owns history;
Canvas draws transient feedback.

## Architecture

The controller derives candidate geometry from visible unlocked peers and stored
guides, then returns a delta and active overlays. Horizontal, vertical, and
grid flow operate in stable node order and only alter interactive selected
nodes. The example consumes public APIs through labelled native controls.

## Trade-offs

V2.4 deliberately omits a constraint solver, collision resolution, and
automatic graph layout. Explicit invocation makes changes predictable and
undoable while preserving room for richer V3 layout engines.
