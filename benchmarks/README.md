# Spatial index benchmark

This benchmark uses a deterministic rectangle-node scene at 1,000, 5,000, and
10,000 nodes. Each case runs 200 fixed viewport queries and 200 fixed hit tests,
comparing the public `SpatialIndex` path with the corresponding linear scan.

Build the packages first, then run either command from the repository root:

```sh
pnpm build
node --experimental-strip-types benchmarks/spatial-index.ts
pnpm benchmark:spatial-index
```

The benchmark reports elapsed milliseconds for the whole 200-operation batch.
It is intended for relative comparisons on the same machine, not as a CI
threshold: browser, Node version, and hardware all affect the result.

## Recorded run

Recorded on 2026-08-27 with Node 22.22.2. The fixture and query set are the
same for every run.

| Nodes | Linear query | Indexed query | Linear hit-test | Indexed hit-test |
| ---: | ---: | ---: | ---: | ---: |
| 1,000 | 8.59 ms | 9.31 ms | 4.50 ms | 8.16 ms |
| 5,000 | 44.16 ms | 40.98 ms | 22.65 ms | 41.48 ms |
| 10,000 | 83.46 ms | 83.64 ms | 45.56 ms | 80.46 ms |

The current uniform-grid implementation preserves original scene order by
filtering candidates against the source list. These numbers are a baseline for
future changes to that trade-off; benchmark output should be rerun and recorded
when the index algorithm changes.
