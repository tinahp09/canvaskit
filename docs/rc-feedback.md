# Release-candidate feedback

Copy this template into the release-candidate issue, discussion, or pull request. One entry per finding makes triage and release decisions auditable.

```md
## Release candidate

- Version / commit:
- Tester:
- Date and time (including time zone):
- Platform, browser, Node.js, and pnpm versions:
- Package(s) or example tested:

## Result

- Outcome: pass / blocker / high / medium / low / question
- Expected behaviour:
- Actual behaviour:
- Reproduction steps:
- Frequency: always / intermittent / once

## Evidence

- Console output, screenshots, video, trace, or minimal repository:
- Accessibility details: focused element, accessible name, keyboard sequence, and assistive technology where relevant:
- Performance details: scene size, viewport, operation, and measured result where relevant:

## Triage

- Owner:
- Decision: fix before release / defer with issue / not reproducible
- Follow-up issue or pull request:
- Retest result:
```

Never include credentials, production data, or unredacted security vulnerabilities. Report security issues through the private process described in the repository-root `SECURITY.md` file.
