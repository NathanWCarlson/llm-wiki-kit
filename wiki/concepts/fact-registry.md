---
type: concept
edges:
  part-of: [canon-map]
last-verified: 2026-10-04
---

# Fact registry

> Raw: [enforcement lessons](../../raw/design-notes/2026-10-04-enforcement-lessons.md)

## Overview

The `facts` list in [[canon-map]] registers strings that drift: thresholds, counts, limits. Each has a home page. The [[wiki-linter]] fails a commit when one appears anywhere else.

## Start here (as of 2026-10-04)

```json
{ "id": "retention", "home": "wiki/systems/store.md", "patterns": ["30 days"], "allow": [] }
```

- Register a fact in the same commit that creates its home.
- `allow` lists pages that hold a different fact with the same string. Declare the overlap; don't count on formatting to dodge the match.

## Matching

Both sides are normalized before comparing: markdown emphasis stripped, dash variants folded to a hyphen, approximation marks removed, whitespace collapsed. A hit also needs a numeric boundary: no digit or comma before, no digit after.

Both rules came from bugs. Plain substring matching missed restatements wrapped in bold or prefixed with a tilde, so lint stayed green while five copies of one figure sat in the wiki. Normalizing then made a three-digit number match its last two digits, which the boundary rule fixed. [raw](../../raw/design-notes/2026-10-04-enforcement-lessons.md)

## Known Unknowns

- Unit swaps ("40 hours" vs "a solid week") still get past. That is judgment, and the [[hygiene-pass]] owns it.
