# V2.7 architecture — Plugin Platform

## Problem

CanvasKit had useful plugin installation but no shared command, tool, inspector,
or diagnostics contract for professional editor hosts.

## Challenge

Extensions must be composable while Core remains renderer- and UI-agnostic.

## Decision

Each `CanvasKit` owns an `ExtensionRegistry`. Plugins use the existing install
hook to add data-only definitions and return their own cleanup functions.

## Architecture

The registry keeps unique definition maps and returns immutable snapshots.
CanvasKit delegates public registration and command execution, owns one active
tool lifecycle, and reports diagnostics without exposing plugin internals.

## Trade-offs

V2.7 deliberately treats plugins as trusted local code. Sandboxing, remote
marketplaces, dynamic loading, and declarative custom renderers are deferred.
