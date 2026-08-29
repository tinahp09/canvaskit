# Spatial index benchmark

This benchmark uses a deterministic rectangle-node scene at 1,000, 5,000, and
10,000 nodes. Each case runs 200 fixed viewport queries and 200 fixed hit tests,
comparing the public `SpatialIndex` path with the corresponding linear scan.
Every individual query must return the same node IDs in the same order, and
every hit test must select the same node ID; matching aggregate counts are not
sufficient.

Build the packages first, then run either command from the repository root:

```sh
pnpm build
node --experimental-strip-types benchmarks/spatial-index.ts
pnpm benchmark:spatial-index
```

The benchmark reports elapsed milliseconds for the whole 200-operation batch.
It is intended for relative comparisons on the same machine, not as a CI
threshold: browser, Node version, and hardware all affect the result.

## Recorded baseline and non-flaky verification

Recorded on 2026-08-29 with Node 22.22.2. The fixture, query set, node counts,
and per-operation identity assertions are the same for every run. Run it as part of
the local release gate with `pnpm verify:release-quality`, or reproduce just
this measurement with `pnpm build && pnpm benchmark:spatial-index`.

Elapsed time is intentionally informational, never a pass/fail CI threshold:
hardware, Node version, CPU scheduling, and background load make timing limits
flaky. The executable gate throws when any deterministic linear and indexed
query differs by node ID or order, or any hit test selects a different ID.

| Nodes | Linear query | Indexed query | Linear hit-test | Indexed hit-test |
| ---: | ---: | ---: | ---: | ---: |
| 1,000 | 8.29 ms | 8.84 ms | 4.61 ms | 8.04 ms |
| 5,000 | 42.04 ms | 40.70 ms | 21.40 ms | 39.18 ms |
| 10,000 | 82.02 ms | 79.78 ms | 42.16 ms | 78.43 ms |

The current uniform-grid implementation preserves original scene order by
filtering candidates against the source list. These numbers are a baseline for
future changes to that trade-off; benchmark output should be rerun and recorded
when the index algorithm changes.
