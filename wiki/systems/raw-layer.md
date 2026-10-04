---
type: system
edges:
  feeds: [wiki-layer]
  supports: [ingest]
  owned-by: [agent-maintainers]
last-verified: 2026-10-04
---

# Raw layer

> Raw: [origin and shape](../../raw/design-notes/2026-10-04-origin-and-shape.md)

## Overview

`raw/` holds every source the wiki was compiled from, converted to markdown. It is history, not knowledge. The [[wiki-layer]] is where knowledge lives.

## Start here (as of 2026-10-04)

- One file per source: `raw/<topic>/YYYY-MM-DD-slug.md`, dated by publish date.
- Every file opens with three header lines: Source, Collected, Published.
- Append-only. The pre-commit hook blocks edits and deletes to files already committed ([[pre-commit-hook]]).

## How it is used

Wiki pages cite raw files with relative links. Question pages point their evidence ledgers at raw paths, not wiki pages, so sources never become graph entities ([[known-unknowns]]). The [[reader-app]] shows a raw file's header in a popover but never bundles its body.

A source with a mistake stays as it is. Add a corrected source as a new file and cite both. Editing a raw file to agree with the wiki destroys the reason to keep raw at all. [raw](../../raw/design-notes/2026-10-04-origin-and-shape.md)

Raw may be messy. Transcripts, exports and half-formatted notes all belong here. The [[ingest]] process turns them into tidy pages.

## Known Unknowns

- Whether large binary originals (PDFs, slides) should live beside raw or in a separate `assets/` folder depends on repo size limits. The first instance used `assets/`.
