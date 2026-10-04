---
type: concept
edges:
  part-of: [ingest]
last-verified: 2026-10-04
---

# Operations log

> Raw: [enforcement lessons](../../raw/design-notes/2026-10-04-enforcement-lessons.md)

## Overview

`wiki/log.md` records every change to the wiki and the code, newest first. It is history. Canon pages are truth. An agent that reads the log to learn what is currently true has been misled.

## Start here (as of 2026-10-04)

- Heading shape: `## [YYYY-MM-DD] kind | title`. One space after the bracket, one on each side of the bar.
- The kind names the activity (ingest, decision, hygiene), never the topic. The subject goes in the title.
- Every kind is declared in `wiki/_kinds.json`. The [[wiki-linter]] fails on an undeclared kind, on a declared kind nothing uses, and on an entry dated newer than the one above it.
- Each touched page gets its own bullet. "Updated all concept pages" is invisible to any tool reading the log.
- Never edit an old entry.

## Why kinds are activities

Topic kinds multiply and overlap: the same entry fits two topics and lands in different lanes on different screens. Activity kinds are a short, stable list. [raw](../../raw/design-notes/2026-10-04-enforcement-lessons.md)

## Parsing it

Anything that parses the log must degrade instead of discarding. The first instance's app dropped 53 bullets it could not split cleanly. Render unparseable lines as plain text.
