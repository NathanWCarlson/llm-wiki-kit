---
type: system
edges:
  depends-on: [shared-schema, canon-map]
  supports: [pre-commit-hook, lint]
  owned-by: [agent-maintainers]
last-verified: 2026-10-04
---

# Wiki linter

> Raw: [enforcement lessons](../../raw/design-notes/2026-10-04-enforcement-lessons.md)

## Overview

`scripts/wiki-lint.mjs` checks the wiki's structure with no dependencies. It reads [[shared-schema]] for what a valid page is and [[canon-map]] for which page owns which idea. The [[pre-commit-hook]] runs it whenever a wiki or raw file is staged.

## Start here (as of 2026-10-04)

| Codes | Checks |
| --- | --- |
| E1 to E5 | Frontmatter, edge keys, edge targets, target types, inverse edges |
| E6, E7 | Wikilinks and relative links resolve; evidence paths exist |
| E8 | Index lists every page under the right section |
| E9 | Registered facts stay on their home page ([[fact-registry]]) |
| E10 | Log headings, kinds and date order ([[operations-log]]) |
| W1 to W6 | Orphans, long pages, question fields, canon coverage, fact drift, stale pages |

Errors fail the commit. Warnings fail only with `--strict-warns`. `--fix` adds missing inverse edges and re-checks.

## Design choices

- Links inside code blocks and inline code are ignored, so pages can show syntax without tripping the check.
- Each rule has a passing and failing test in `scripts/wiki-lint.test.mjs`.
- It exports its functions so other tools can reuse the fact matcher and log parser instead of writing a second copy that drifts. [raw](../../raw/design-notes/2026-10-04-enforcement-lessons.md)

## What it cannot see

Contradictions between pages, stale meaning, uncited claims, and questions whose answers landed elsewhere. The [[hygiene-pass]] covers those by hand. Whether more of that can be automated is [[q-lint-vs-review]].
