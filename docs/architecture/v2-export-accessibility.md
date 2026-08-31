# V2.6 architecture — Export & Accessibility

## Problem

Consumers needed a portable document export and meaningful semantics alongside
a raster canvas.

## Challenge

Export must be deterministic across browser and Node without adding a heavy
runtime dependency. Canvas pixels alone are not a navigable document tree.

## Decision

CanvasKit exposes a small standalone vector PDF writer and a separate ARIA
snapshot/mirror package. Both reuse Core's visible-document projection.

## Architecture

The PDF renderer maps visible scene primitives and routes into a fixed logical
page, writes a minimal object graph and xref table, and returns bytes or a data
URL. Accessibility derives ordered immutable items, then the DOM mirror owns
only a visually-hidden list and status node.

## Trade-offs

V2.6 defers embedded images, fonts, pagination, and browser download policy.
The mirror provides semantic discovery but leaves actual editor navigation and
interaction under host control.
