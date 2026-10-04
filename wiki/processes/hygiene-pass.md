---
type: process
edges:
  owned-by: [agent-maintainers]
last-verified: 2026-10-04
---

# Hygiene pass

> Raw: [enforcement lessons](../../raw/design-notes/2026-10-04-enforcement-lessons.md)

## Overview

A weekly review for the decay the [[wiki-linter]] cannot see. The checklist is in `docs/hygiene.md`; copy it into the log entry when you run it.

## Start here (as of 2026-10-04)

- Pages created this week that should have been edits ([[update-over-create]])
- Fossils: "next week", "we will", "currently" ([[supersede-in-place]])
- Tables that appear twice
- Question statuses that no longer match the evidence ([[known-unknowns]])
- Numbers that fail the [[tomorrow-morning-test]]
- Long pages out of zone order ([[page-zones]])

Log it as `hygiene | wiki pass` with what you found.

## Why it is still manual

Lint catches structure. These are judgments about meaning. Some may be automatable; see [[q-lint-vs-review]] and [[q-automate-fossil-check]].
