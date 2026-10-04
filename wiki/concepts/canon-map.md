---
type: concept
edges:
  supports: [wiki-linter]
last-verified: 2026-10-04
---

# Canon map

> Raw: [enforcement lessons](../../raw/design-notes/2026-10-04-enforcement-lessons.md)

## Overview

`wiki/_canon.json` names the one page that owns each idea. Other pages give a sentence and a link. This is how [[update-over-create]] becomes checkable instead of a hope.

## Start here (as of 2026-10-04)

- `concerns`: one row per idea with its home page and notes on who may mention it.
- `facts`: hot strings with a home page ([[fact-registry]]).
- `enforce_facts: true`: off-home restatements fail lint.
- Every system, process, concept and project page needs a concern row; the [[wiki-linter]] warns otherwise. Questions, teams and locations are their own homes.

## Why it is JSON and not prose

In the first instance the canon map started as a table in the hygiene doc. A consolidation pass cut each idea down to one home. Within nine days the worst idea had spread from 5 homes to 11. Agents read the rule and then copied whatever the page in front of them already did. Moving the map into JSON that lint reads stopped it. [raw](../../raw/design-notes/2026-10-04-enforcement-lessons.md)

## Axes

Keep a handful of strategy axes on separate pages: what success is, why the problem hurts, how the work climbs, how outcomes get scored. Mixing two axes on one page is how a project ends up with two "current plans".
