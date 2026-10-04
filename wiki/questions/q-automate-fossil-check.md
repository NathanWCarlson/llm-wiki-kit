---
type: question
edges:
  part-of: [supersede-in-place]
status: open
horizon: next
---

# Can a lint rule catch fossils?

## Why it matters

A fossil is an old plan still in present tense ([[supersede-in-place]]). The [[hygiene-pass]] greps for phrases like "next week" by hand. A warning in the [[wiki-linter]] would catch them on every commit.

## What it would take

A warning for undated future-tense phrases outside a dated heading. The hard part is false positives: "we will" inside a quoted source or a dated evidence entry is fine.

## Known Unknowns

- How noisy a phrase list is on a real wiki. On this kit's own wiki the first hygiene pass got 6 hits for "next week", "we will", "currently" and "soon", and all 6 were pages quoting the phrases. A rule would need to skip quoted text at minimum.
