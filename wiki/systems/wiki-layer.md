---
type: system
edges:
  fed-by: [raw-layer]
  feeds: [reader-app, decks]
  supports: [query]
  owned-by: [agent-maintainers]
last-verified: 2026-10-04
---

# Wiki layer

> Raw: [origin and shape](../../raw/design-notes/2026-10-04-origin-and-shape.md)

## Overview

`wiki/` is the compiled knowledge base and the single source of truth. Agents write it through [[ingest]]; people read it directly or through the [[reader-app]]. If a fact is not here or citable from the [[raw-layer]], treat it as unknown.

## Start here (as of 2026-10-04)

| Path | Role |
| --- | --- |
| `wiki/<folder>/<slug>.md` | One entity per page. The folder fixes the type ([[shared-schema]]). |
| `wiki/index.md` | Entry point. One table per folder, one row per page. |
| `wiki/log.md` | Newest-first history ([[operations-log]]). |
| `wiki/_canon.json` | Which page owns which idea ([[canon-map]]). |
| `wiki/_kinds.json` | Allowed log entry kinds. |
| `wiki/_schema.json` | Folders, types, edges. |

## The markdown is the graph

There is no graph database. Frontmatter edges ([[typed-edges]]) and `[[wikilinks]]` in prose define the graph, and the linter and reader both parse it from the files. That holds up to roughly a hundred entities; see [[q-scale-ceiling]]. [raw](../../raw/design-notes/2026-10-04-origin-and-shape.md)

The plain files work without any tooling. Obsidian, GitHub and a text editor can all read and edit the wiki. The app and linter speed things up but are not required.

## Known Unknowns

- How well Obsidian's own graph view agrees with typed edges when folders hold the same slug. The schema forbids duplicate slugs, so this has not been tested.
