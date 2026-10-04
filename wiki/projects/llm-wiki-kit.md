---
type: project
edges:
  owned-by: [agent-maintainers]
last-verified: 2026-10-04
---

# llm-wiki-kit

> Raw: [origin and shape](../../raw/design-notes/2026-10-04-origin-and-shape.md); [enforcement lessons](../../raw/design-notes/2026-10-04-enforcement-lessons.md)

## Overview

A starter kit for an agent-maintained wiki, pulled out of a working instance with all domain content removed. This wiki documents the kit itself, so it doubles as an example.

## Start here (as of 2026-10-04)

| Part | Page |
| --- | --- |
| Sources and compiled pages | [[raw-layer]], [[wiki-layer]] |
| Rules that keep it clean | [[canon-map]], [[update-over-create]], [[supersede-in-place]] |
| Checks | [[wiki-linter]], [[pre-commit-hook]] |
| Reading it | [[reader-app]] |
| Operations | [[ingest]], [[query]], [[lint]], [[hygiene-pass]] |

## Starting your own

Delete the pages in `wiki/` except `index.md` and `log.md`, empty the `concerns` and `facts` in `_canon.json`, and edit `_schema.json` for your domain's types. Then [[ingest]] your first source. Keep the log kinds you use and drop the rest; the linter fails on unused kinds.

## Known Unknowns

- How the pattern holds up with several people ingesting at once. The first instance had one main author.
