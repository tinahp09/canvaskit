# V1 release-candidate checklist

Use this checklist for every `1.x` release candidate in addition to the general [release checklist](release-checklist.md). Record the candidate commit, command output, reviewers, and any approved exceptions in the release pull request.

## Stable metadata and boundaries

- [ ] Run `pnpm test:release` and attach its complete output.
- [ ] Confirm all seven published package manifests carry the intended release version and `dist`-only file allowlist.
- [ ] Confirm the repository `LICENSE` and every packed manifest declare the approved MIT license.
- [ ] Confirm internal published-package dependencies use the intended compatible workspace range.
- [ ] Confirm each package exposes only its documented root entry point with matching JavaScript and declaration output.
- [ ] Search the candidate source, examples, and documentation for package subpath imports; resolve every private import.
- [ ] Confirm the API reference exists and is current for Core, Geometry, Canvas, SVG, Plugins, React, and Vue.

## Compatibility review

- [ ] Compare every root export and public declaration with the previous stable release.
- [ ] Classify each public change as compatible, deprecated, or breaking under the [API stability policy](api-stability.md).
- [ ] Add migration guidance for every intentional breaking change and do not ship it in a `1.x` minor or patch release.
- [ ] Verify supported React, Vue, Node.js, TypeScript, and pnpm ranges through
      the fresh consumer that installs all seven tarballs, typechecks, builds,
      and imports every package root.
- [ ] Verify scene imports for the current schema and every documented automatic migration path.

## Candidate evidence and decision

- [ ] Complete the build, typecheck, unit, browser, docs, Storybook, example, bundle, performance, and package-tarball checks required by the general checklist.
- [ ] Collect findings with the [RC feedback template](rc-feedback.md); give every blocker, high-priority, accessibility, compatibility, and security finding an owner.
- [ ] Resolve each finding or link an approved deferral with user impact and follow-up milestone.
- [ ] Have the release owner record the final go/no-go decision before tagging or publishing.
