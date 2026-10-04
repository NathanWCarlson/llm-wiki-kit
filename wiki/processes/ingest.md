---
type: process
edges:
  depends-on: [raw-layer]
  owned-by: [agent-maintainers]
last-verified: 2026-10-04
---

# Ingest

> Raw: [origin and shape](../../raw/design-notes/2026-10-04-origin-and-shape.md)

## Overview

Ingest turns a source into wiki knowledge. Always two steps: save the source to the [[raw-layer]], then compile it into the [[wiki-layer]]. The full checklist is in the wiki skill (`.claude/skills/wiki/SKILL.md`).

## Start here (as of 2026-10-04)

1. Save `raw/<topic>/YYYY-MM-DD-slug.md` with the three-line header.
2. Find the home in [[canon-map]] and update it. Start-here section first, then at most 3 to 5 bullets of detail.
3. Name every question the source touches and re-read each one. Update status, hypothesis, evidence and Answer together.
4. Update edges and their inverses ([[typed-edges]]).
5. Update `wiki/index.md` and add a log entry naming each page ([[operations-log]]).
6. Run [[lint]].

## Step 3 is the one that gets skipped

In the first instance every stale question went stale the same way: the evidence landed, the log recorded it, and nobody re-opened the question. [raw](../../raw/design-notes/2026-10-04-origin-and-shape.md)

## Anti-bloat

Don't paste a table that has a home. Don't write undated "next week". If a meeting changed nothing on a canon page, a log entry alone is fine. See [[update-over-create]].
