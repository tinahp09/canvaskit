# Contributing to CanvasKit

Thanks for helping improve CanvasKit. Contributions should be small, focused, and accompanied by the tests and documentation that demonstrate the intended public behaviour.

## Before you start

- Read the [Code of Conduct](CODE_OF_CONDUCT.md).
- Search existing issues and pull requests before opening a new one.
- For substantial API, rendering, serialization, or package-boundary changes, open an issue first so maintainers can agree on the direction.
- Do not include generated output, local caches, or credentials in a pull request.

## Local setup

CanvasKit uses Node.js and pnpm 10.

```sh
pnpm install
pnpm build
```

The workspace packages use their built `dist/` entry points. Run `pnpm build` again after changing a package before exercising an example or its browser tests.

## Development workflow

1. Create a branch from the current default branch.
2. Keep a change scoped to one clear problem.
3. Add or update focused tests before changing behaviour; include a regression test for a bug.
4. Update public API documentation, runnable examples, and migration guidance when the change affects consumers.
5. Add a Changeset for every publishable-package change. Use a minor bump for a backwards-compatible feature and a patch bump for a backwards-compatible fix.

Useful commands:

```sh
pnpm build
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm docs:build
pnpm storybook:build
pnpm storybook:vue:build
```

Run the checks relevant to your change before requesting review. Before a release, follow the full [release checklist](docs/release-checklist.md).

## Pull requests

Use a descriptive title and explain the user-visible effect, implementation approach, and validation performed. Link related issues and call out any behaviour that needs special review, such as:

- public API, types, serialization, or migration changes;
- rendering performance or large-scene behaviour;
- keyboard interaction, accessible names, focus states, or live feedback;
- React, Vue, Nuxt, or SSR implications.

Keep commits readable and avoid drive-by formatting changes. Maintainers may request tests, documentation, or a smaller pull request before merging.

## Reporting problems

Use GitHub issues for reproducible bugs, feature requests, and documentation corrections. Do not disclose security vulnerabilities in public issues; follow the process in [SECURITY.md](SECURITY.md).
