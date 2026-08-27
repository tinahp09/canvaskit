# Security Policy

## Supported versions

Security fixes are applied to the latest release line. Pre-release builds and unsupported historical versions may be fixed only when the issue can be reproduced on the current release.

| Version | Supported |
| --- | --- |
| Latest release | Yes |
| Earlier releases | No |

## Reporting a vulnerability

Please do not report security vulnerabilities in public GitHub issues, discussions, or pull requests.

Use the repository's [private security advisory form](https://github.com/tinahp09/canvaskit/security/advisories/new) and include:

- a concise description and potential impact;
- affected package name(s), version(s), and environment;
- reliable reproduction steps or a proof of concept;
- any mitigation or fix you have identified; and
- a contact method for follow-up.

Maintainers will acknowledge a report, assess the impact, and coordinate a fix and disclosure timeline with the reporter. Please give maintainers a reasonable opportunity to investigate and publish a fix before sharing details publicly.

## Scope notes

CanvasKit is a client-side library. Reports involving unsafe markup handling, scene import validation, prototype pollution, denial of service, dependency vulnerabilities, or example/documentation supply-chain risks are in scope when they affect code maintained in this repository.

For non-security defects, use a normal GitHub issue instead.
