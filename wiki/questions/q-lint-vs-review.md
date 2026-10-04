---
type: question
edges:
  part-of: [hygiene-pass]
status: partially-answered
horizon: now
hypothesis: Hard lint stops structural drift, but stale meaning still needs a weekly human or agent review.
evidence:
  for:
    - raw: raw/design-notes/2026-10-04-enforcement-lessons.md
      note: duplicate homes stopped once lint enforced them; stale questions still needed a checklist step
  against: []
---

# How much of the hygiene pass can lint replace?

## Why it matters

The [[hygiene-pass]] costs time every week and is the first thing skipped when people are busy. Every check moved into the [[wiki-linter]] runs on every commit for free.

## Answer (partial)

- Structure moved to lint and held: duplicate homes, broken links, missing inverses, undeclared log kinds. [raw](../../raw/design-notes/2026-10-04-enforcement-lessons.md)
- Meaning did not: stale questions, contradictions, fossils. Each needs someone to read two pages and judge. The fix for stale questions was a checklist step in [[ingest]], not a rule. [raw](../../raw/design-notes/2026-10-04-enforcement-lessons.md)

## Known Unknowns

- Whether an LLM-run review on a schedule (read every question, compare with its evidence) is reliable enough to trust without a human pass.
