# Publishing runbook

This runbook is for an authorized CanvasKit release owner. It covers the nine
public packages and deliberately separates validation, publication, and
post-publication checks. Never publish from an unreviewed working tree, and
never place npm credentials or one-time passwords in logs, issues, release
notes, or shell history.

## Release scope and order

Publish one version across the package suite. For `2.0.0`, publish in dependency
order:

1. `@canvaskit/geometry`
2. `@canvaskit/core`
3. `@canvaskit/renderer-canvas`, `@canvaskit/renderer-svg`,
   `@canvaskit/renderer-pdf`, `@canvaskit/accessibility`, and
   `@canvaskit/plugins`
4. `@canvaskit/react` and `@canvaskit/vue`

Source manifests use pnpm `workspace:` ranges. Use `pnpm pack` and `pnpm
publish`; pnpm rewrites those ranges to consumer-compatible semver in the
published manifest. Do not substitute `npm pack` or publish a tarball whose
manifest still contains a `workspace:` range.

## 1. Confirm authority and candidate state

- Obtain the release owner's recorded go decision and the reviewed candidate
  commit.
- Confirm control of the `@canvaskit` npm scope, public-package permission,
  registry URL, and required npm two-factor-authentication method.
- Confirm `2.0.0` does not already exist for any package. Published npm versions
  are immutable; never attempt to overwrite one.
- Use Node `22.22.2` and pnpm `10.0.0`, matching release CI.
- Start from the reviewed commit with no staged or unstaged files, generated
  output, local caches, credentials, or phase-plan artifacts.

The V2 release metadata sets every publishable manifest to `2.0.0`.
Phase 1 through Phase 9 Changesets have been consumed into `CHANGELOG.md` and
the V1 release notes and removed from `.changeset/`. For later releases, apply
every pending Changeset to the package versions and lockfile, incorporate its
user-visible text into the changelog and target release notes, then delete the
consumed Markdown file. The final release audit rejects pending Changesets.

For a later stable candidate, set `CANVASKIT_RELEASE_VERSION` to the exact
target version when running release-readiness and package smoke commands. The
audits derive source workspace ranges and packed consumer ranges from that
version instead of assuming `2.0.0`.

## 2. Reproduce the release gates

Install exactly the lockfile and run every required gate from the repository
root:

```sh
pnpm install --frozen-lockfile
pnpm build:release
pnpm typecheck
pnpm test
pnpm docs:build
pnpm storybook:build
pnpm storybook:vue:build
pnpm --filter './examples/*' build
pnpm verify:release-quality
pnpm test:e2e
pnpm publish:dry-run
```

Record the candidate commit, Node and pnpm versions, platform, complete command
results, browser-test summary, RC findings, and release-owner decision. Stop on
the first failure; fix it on a reviewed commit and restart this section from a
clean install.

## 3. Inspect the exact package artifacts

`pnpm publish:dry-run` first builds the clean workspace, then creates temporary
tarballs, checks required JavaScript and declaration entry points, inspects each
packed manifest, installs all nine archives into a new consumer, typechecks and
builds that consumer, imports every package root, and removes all temporary
output. For the release-owner review, pack all nine packages into a new
temporary directory and retain the checksum report with the release evidence:

```sh
CANVASKIT_PACK_DIR="$(mktemp -d)"
pnpm --filter @canvaskit/geometry pack --pack-destination "$CANVASKIT_PACK_DIR"
pnpm --filter @canvaskit/core pack --pack-destination "$CANVASKIT_PACK_DIR"
pnpm --filter @canvaskit/renderer-canvas pack --pack-destination "$CANVASKIT_PACK_DIR"
pnpm --filter @canvaskit/renderer-svg pack --pack-destination "$CANVASKIT_PACK_DIR"
pnpm --filter @canvaskit/renderer-pdf pack --pack-destination "$CANVASKIT_PACK_DIR"
pnpm --filter @canvaskit/accessibility pack --pack-destination "$CANVASKIT_PACK_DIR"
pnpm --filter @canvaskit/plugins pack --pack-destination "$CANVASKIT_PACK_DIR"
pnpm --filter @canvaskit/react pack --pack-destination "$CANVASKIT_PACK_DIR"
pnpm --filter @canvaskit/vue pack --pack-destination "$CANVASKIT_PACK_DIR"
shasum -a 256 "$CANVASKIT_PACK_DIR"/*.tgz
```

For every tarball, confirm:

- the name and version are correct;
- the packed manifest declares the MIT license;
- `package.json`, `dist/index.js`, and `dist/index.d.ts` are present;
- no source, tests, examples, credentials, caches, or planning artifacts are
  present;
- the root export maps JavaScript and declarations correctly;
- no dependency field contains a `workspace:` range; and
- internal dependency and peer ranges resolve to `^2.0.0`.

Install the tarballs in a new consumer project with the required framework
peers, import every package root, and run a production typecheck/build before
continuing.

## 4. Publish without a tag

Authenticate interactively without echoing credentials. From the same clean,
reviewed commit, publish each package in the dependency order above:

```sh
pnpm --filter @canvaskit/geometry publish --access public
pnpm --filter @canvaskit/core publish --access public
pnpm --filter @canvaskit/renderer-canvas publish --access public
pnpm --filter @canvaskit/renderer-svg publish --access public
pnpm --filter @canvaskit/renderer-pdf publish --access public
pnpm --filter @canvaskit/accessibility publish --access public
pnpm --filter @canvaskit/plugins publish --access public
pnpm --filter @canvaskit/react publish --access public
pnpm --filter @canvaskit/vue publish --access public
```

Do not create or push `v2.0.0` until every registry and consumer check in the
next section passes. Record each registry response and stop if any package
fails; do not rerun a successful publish or bypass pnpm's git checks.

## 5. Verify registry and consumer behavior

For every package, inspect the registry version, `latest` dist-tag, exports,
dependencies, peer dependencies, and tarball integrity. Then install the public
versions into a brand-new project and repeat the package-root import and
production build smoke test. Confirm the documentation and release notes point
to the same version and known V1 boundaries.

Only after all nine packages and the fresh consumer pass may the release owner
create and push the signed or annotated `v2.0.0` tag and publish the release
announcement.

## Failure and recovery

- **Before any publish:** fix the candidate, obtain review, and rerun all gates.
- **Partial publication:** freeze the release, list exactly which immutable
  versions exist, and have the release owner decide whether the identical
  remaining artifacts may continue. Do not create the git tag while the suite
  is partial.
- **Bad published artifact:** do not overwrite `2.0.0`. Deprecate the affected
  version when appropriate, prepare a reviewed patch release, and communicate
  user impact and mitigation.
- **Credential or security exposure:** stop, revoke or rotate the credential,
  and use the private process in the repository `SECURITY.md`.

Avoid npm unpublish as routine rollback: it can break existing consumers and is
subject to registry policy. Prefer a corrected immutable patch and an explicit
deprecation or advisory.
