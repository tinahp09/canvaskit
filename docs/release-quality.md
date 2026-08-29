# Release quality gates

Run the stable, local release-quality gate from the repository root:

```sh
pnpm verify:release-quality
```

It rebuilds every workspace package, runs the deterministic bundle-size tests,
checks each published package's emitted JavaScript against its byte budget, and
runs the spatial-index benchmark at 1,000, 5,000, and 10,000 nodes. The bundle
gate deliberately measures raw `.js` bytes from every file under a package's
`dist` allowlist. Declaration files and source maps are excluded because they do
not execute in a consumer's runtime bundle.

The report is sorted by published package name and uses integer byte counts, so
its result is deterministic for identical build artifacts. The budgets retain
small, intentional growth headroom above the 2026-08-29 baseline while making
unexpected output growth fail locally.

| Package | Baseline runtime JavaScript | Budget |
| --- | ---: | ---: |
| `@canvaskit/core` | 50,962 B | 55,000 B |
| `@canvaskit/geometry` | 852 B | 1,100 B |
| `@canvaskit/plugins` | 1,900 B | 2,400 B |
| `@canvaskit/react` | 7,197 B | 8,700 B |
| `@canvaskit/renderer-canvas` | 8,400 B | 9,300 B |
| `@canvaskit/renderer-svg` | 3,567 B | 4,300 B |
| `@canvaskit/vue` | 6,250 B | 7,500 B |

To update a budget intentionally, rebuild first, inspect `pnpm bundle:size`,
and update both the explicit value in `scripts/bundle-size.mjs` and this table
in the same change. Avoid benchmarking elapsed time as a pass/fail threshold:
timings depend on hardware and concurrent system load. Instead, the benchmark
compares the ordered node IDs for every individual query and the selected node
ID for every individual hit test; aggregate counts alone are not accepted as
proof of equivalence. Recorded timings are comparative baselines documented in
`benchmarks/README.md`.
