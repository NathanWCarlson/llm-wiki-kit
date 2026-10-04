---
type: process
edges:
  depends-on: [wiki-linter]
  owned-by: [agent-maintainers]
last-verified: 2026-10-04
---

# Lint

## Overview

Run the [[wiki-linter]] after every edit and before every commit. The [[pre-commit-hook]] runs it anyway; running it first saves a failed commit.

## Start here (as of 2026-10-04)

```bash
npm run lint:wiki                    # report; exits 1 on any error
npm run lint:wiki -- --fix           # add missing inverse edges
npm run lint:wiki -- --strict-warns  # warnings fail too
```

Fix errors before committing. Treat warnings as the [[hygiene-pass]] to-do list: an orphan needs a link, a long page needs splitting, a stale `last-verified` needs a re-read.

Log lint runs that changed something: `lint | N issues found, M fixed`.
