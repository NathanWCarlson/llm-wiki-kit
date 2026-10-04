---
type: concept
edges:
  supports: [wiki-linter, reader-app]
last-verified: 2026-10-04
---

# Shared schema

> Raw: [enforcement lessons](../../raw/design-notes/2026-10-04-enforcement-lessons.md)

## Overview

`wiki/_schema.json` defines folders, page types, edge keys, inverse pairs, edge target types, question fields, soft page sizes and the staleness limit. The [[wiki-linter]] and the [[reader-app]] both import it. There is no second copy.

## Start here (as of 2026-10-04)

- Seven folders, each mapped to one type: systems, processes, concepts, people-teams, projects, locations, questions.
- Nine edge keys, two inverse pairs (`feeds`/`fed-by`, `depends-on`/`supports`). See [[typed-edges]].
- `owned-by` must point at a team; `runs-at` must point at a location.

## Why one file

In the first instance the linter and the app each hardcoded folder names and edge keys. Adding a folder meant editing both, and the app silently dropped an edge key the linter accepted. The same thing happened with log kinds, mapped three times and wrong in two. Shared data beats a rule that says "keep these in sync". [raw](../../raw/design-notes/2026-10-04-enforcement-lessons.md)

Changing the schema is a decision, so it gets a `decision` entry in the [[operations-log]].
