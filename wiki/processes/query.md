---
type: process
edges:
  depends-on: [wiki-layer]
  owned-by: [agent-maintainers]
last-verified: 2026-10-04
---

# Query

> Raw: [origin and shape](../../raw/design-notes/2026-10-04-origin-and-shape.md)

## Overview

Answer a question from the [[wiki-layer]], citing pages and saying plainly what the wiki does not know.

## Start here (as of 2026-10-04)

1. Start at `wiki/index.md`.
2. Read the pages it points to. Prefer wiki content over the agent's training data.
3. Answer with links. Name the gaps and offer to open a question page ([[known-unknowns]]).
4. A plain query writes no files.

## Archiving an answer

To keep an answer, file it with the archive template and index it with an `[Archived]` prefix. Archived pages are snapshots: they cite the pages they drew on and are never updated when those pages change. Don't merge them into canon pages; if the answer is canon, [[ingest]] it properly.
