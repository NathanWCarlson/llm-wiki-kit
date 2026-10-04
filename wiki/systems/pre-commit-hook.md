---
type: system
edges:
  depends-on: [wiki-linter]
  owned-by: [agent-maintainers]
last-verified: 2026-10-04
---

# Pre-commit hook

> Raw: [enforcement lessons](../../raw/design-notes/2026-10-04-enforcement-lessons.md)

## Overview

`.githooks/pre-commit` turns the written rules into checks that run on every commit. Run `npm run setup` once so git uses it.

## Start here (as of 2026-10-04)

| Gate | Blocks when | Bypass |
| --- | --- | --- |
| raw-gate | A committed raw file is edited or deleted | `RAW_OK=1` |
| docs-gate | Code or wiki pages are staged without a log entry | `DOCS_OK=1` |
| wiki-lint | Any wiki or raw file is staged and [[wiki-linter]] reports an error | `WIKI_LINT_OK=1` |
| md-lint | Any markdown is staged and markdownlint fails | none |

## Why a hook and not a reminder

Every gate here replaced a written rule that agents broke. The clearest case is the one-home rule on [[canon-map]], which kept regressing until lint enforced it. [raw](../../raw/design-notes/2026-10-04-enforcement-lessons.md)

Wiki lint runs even when only the log is staged. Code-plus-log commits are the most common shape the docs gate produces, and log heading checks matter most there.

## Known Unknowns

- Hooks are local. Nothing stops a contributor who never ran setup. CI running `npm run verify` would close that gap.
