# Enforcement lessons from the first instance

> Source: Author's retrospective on the first instance's hygiene and lint history
> Collected: 2026-10-04
> Published: 2026-10-04

## Prose rules lost

Week five: a multi-agent review found the same synthesis copied onto two to six pages per idea. A consolidation pass fixed it and wrote the rule "one home per idea" into the hygiene doc.

Nine days later the worst case had regressed from 5 homes to 11. Nobody broke the rule on purpose. Each agent session read the rule, then read a page that already restated the number, and copied the local pattern.

The fix was to move the canon map out of prose into `wiki/_canon.json` and make the linter read it. Registered "hot facts" (a threshold, a count) fail lint when they appear off their home page. After that the regressions stopped.

Takeaway: a rule an agent must remember will be broken by the next agent. A rule the commit hook checks holds.

## The fact matcher was green while wrong

The first fact check was a raw substring test. Five off-home restatements of one registered figure sat in the wiki under a passing lint, because:

- bold markers split the span (`**30 days**` vs `30 days`),
- a tilde broke the match (`~30 days`),
- a different dash character broke a range (`30–40` vs `30-40`).

The matcher now normalizes both sides (strips emphasis, folds dashes and approximation marks, collapses whitespace). Normalizing exposed a new bug: once tildes vanish, `230 days` contains `30 days`. A hit now needs a numeric boundary: no digit or comma before it, no digit after.

Where two different facts share a string, the registry declares that in an `allow` list. Never rely on formatting to break a match by accident.

## Tool files drift

The first instance had separate instructions for three coding agents. They drifted within weeks. Rule since: one rules file (`AGENTS.md`); every tool-specific file is a pointer to it and holds no rules.

## Three maps of the same thing drift

Log entry kinds were mapped in three places (the app, a metrics script, a report generator). They disagreed on three kinds, so one entry landed in different lanes depending on which screen showed it. Fix: one `_kinds.json`, read by all three, and a lint rule that fails on an undeclared kind and on a declared kind nothing uses.

The same lesson applied to the schema: the linter originally hardcoded folder and edge names that the app also hardcoded. They now share `wiki/_schema.json`.

## Parsers of hand-written text must degrade, not discard

The app read log bullets by splitting on the first colon. Bullets with no colon matched nothing and silently vanished: 53 of about 900. A mid-sentence colon produced a 200-character "label" that broke the layout. The parser now bounds the label and renders anything else as plain prose. Silently dropping input is worse than rendering it plainly.

## Stale questions all went stale the same way

A quality pass found that every stale question page had the same history: new evidence landed on a canon page or in raw, the log recorded it, and nobody re-opened the question. One daily-ingested topic had questions drift within 72 hours of their own evidence arriving. Fix: the ingest checklist now says to name every question the source touches and re-read each one in the same commit.

## Numbers a report owns do not belong on a canon page

A page that restated a figure a nightly report refreshed was wrong the next morning, every morning. The test before adding a number to a page's "Start here": would this be wrong tomorrow morning without anyone doing anything wrong? If yes, link the report and state the rule instead.
