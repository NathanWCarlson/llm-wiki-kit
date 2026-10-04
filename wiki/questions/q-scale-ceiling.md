---
type: question
edges:
  part-of: [wiki-layer]
status: open
horizon: later
hypothesis: Markdown-as-graph stays workable up to about a hundred entities and needs a real index past a few hundred.
evidence:
  for:
    - raw: raw/design-notes/2026-10-04-origin-and-shape.md
      note: first instance ran comfortably at about 90 pages
  against: []
---

# Where does markdown-as-graph stop scaling?

## Why it matters

The [[wiki-layer]] has no database. Every tool re-parses every file. That is fine for one domain and painful for a company.

## What we know

The first instance ran at about 90 pages and 200 sources with no performance or findability problems. [raw](../../raw/design-notes/2026-10-04-origin-and-shape.md) Nothing tested it past that.

## Known Unknowns

- Whether the limit is tooling (parse time) or people (nobody can hold the canon map in their head).
- Whether hybrid search over raw and wiki pushes the limit out.
