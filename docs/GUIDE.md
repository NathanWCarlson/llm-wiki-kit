# The guide

This is the write-up that goes with the kit: what it is, why I built it this way, and what broke along the way. The repo is the working version. The wiki inside it describes the kit itself, so once you've read this, open the reader and click around. The pages explain each piece in more depth.

## What it is

A knowledge base that coding agents write and people read. You drop a source into a chat (meeting notes, an article, an export) and say "add this to the wiki". The agent saves the source to `raw/`, then compiles what it learned into entity pages in `wiki/`. Those pages link to each other with typed edges, cite their sources, and end with what they don't know yet.

Two ideas started it. Andrej Karpathy's: the LLM writes and maintains the wiki; the human reads and asks questions. Garry Tan's "gbrain": every page is an entity with typed edges, answers are cited, and every page says what it doesn't know.

I ran the first instance for about three months on a messy operations problem at work: several systems and teams that disagreed about the same numbers. It reached about 90 pages and 200 sources. This kit is that system with all the domain content removed.

## Why not a normal wiki, or just chat

- Chat answers vanish when the session ends. The wiki compounds: every ingest makes the next answer better.
- A normal wiki rots because updating it is a chore nobody owns. Here the agent does the chore, and the hard part becomes keeping the agent from making a mess.
- Agents left alone make a specific mess. They create a new page for every insight, copy the same table onto four pages, and leave "next week we will" in present tense forever. Most of this kit exists to stop that.

## How it works

```text
raw/      sources as markdown, append-only            (history)
wiki/     compiled entity pages with typed edges      (truth)
app/      reader that renders wiki/; holds no facts   (view)
```

Everything downstream fails closed. If the app or a slide needs a fact the wiki doesn't have, the fix is to ingest a source, not to hardcode a string.

A page is markdown with frontmatter:

```yaml
---
type: concept
edges:
  part-of: [hygiene-pass]
  depends-on: [shared-schema]
last-verified: 2026-10-04
---
```

The folder fixes the type. Edges are typed relations (`feeds`, `depends-on`, `owned-by`, `part-of` and a few more) defined in `wiki/_schema.json`. Inverse edges must appear on both pages. Prose uses `[[wikilinks]]`. There is no database; the files are the graph.

Uncertainty gets real structure, not just hedging in prose:

- every page ends with **Known Unknowns**,
- a big unknown becomes a **question page** with a status and a horizon,
- a question carries a **working claim** (one falsifiable sentence) and an **evidence ledger** pointing at raw files for and against.

Three operations: **ingest**, **query** and **lint**. The full steps are in `.claude/skills/wiki/SKILL.md`. Rules for every agent are in `AGENTS.md`. The anti-debt standard is `docs/hygiene.md`.

## What I learned about keeping it clean

This is the part I'd most want someone to steal. Each lesson cost me a mess to learn.

### 1. Prose rules lose, lint rules hold

After a month, a multi-agent review found the same synthesis copied onto two to six pages per idea. I consolidated everything and wrote "one home per idea" into the hygiene doc. Nine days later the worst idea had spread from 5 homes to 11.

Nobody broke the rule on purpose. Each agent session read the rule, then opened a page that already restated the number, and copied the local pattern. The page in front of the agent beats the doc it read ten minutes ago.

What fixed it was moving the "canon map" (which page owns which idea) out of prose into `wiki/_canon.json` and making the linter enforce it. You register a "hot fact", a threshold or count that tends to get copied, with its home page. The same string anywhere else fails the commit. The regressions stopped.

So my general rule now: if an agent has to remember it, the next agent will break it. If the commit hook checks it, it holds. The pre-commit hook in this repo runs four gates, and each one replaced a written rule that got broken.

### 2. A green check can be lying

The first fact check was a plain substring test. It sat green while five copies of a registered figure lived in the wiki. Bold markers split the match (`**30 days**`), a tilde broke it (`~30 days`), an en dash broke a range.

The fix normalizes both sides first (strip emphasis, fold dashes, drop approximation marks, collapse whitespace). That created the opposite bug: once tildes vanish, "230 days" contains "30 days". So a match now needs a numeric boundary. Where two different facts really share a string, you declare it in an `allow` list instead of relying on formatting to dodge the match.

Lesson: when you add a check, write a test that proves it fails on the thing you care about. `scripts/wiki-lint.test.mjs` has a passing and a failing case for every rule.

### 3. One source of truth applies to config too

Three things each kept their own map of the log entry kinds: the app, a metrics script and a report generator. They disagreed on three kinds, so the same entry showed up in different lanes on different screens. The linter and the app also each hardcoded the folder names and edge keys.

Now `wiki/_schema.json` and `wiki/_kinds.json` are read by everything. The linter fails on an undeclared kind and on a declared kind nothing uses, so the list describes what the repo actually does.

The same goes for agent instructions. I had separate rules for Claude, Copilot and Cursor. They drifted within weeks. Now `AGENTS.md` holds the rules and every tool-specific file is a two-line pointer.

### 4. Parsers of hand-written text must degrade, not discard

The app split log bullets on the first colon to get a label. Bullets with no colon matched nothing and silently disappeared: 53 of about 900. A colon mid-sentence produced a 200-character "label" that broke the layout. If you parse prose that people or agents write, render what you can't parse as plain text. Dropping it silently is worse.

### 5. Questions go stale in a specific way

A quality pass found every stale question had the same history: the answer landed on some other page or in a new source, the log recorded it, and nobody re-opened the question. One fast-moving topic had questions go stale within 72 hours of their own evidence arriving.

Lint can't see this. The fix was a step in the ingest checklist: name every question this source touches and re-read each one in the same commit. Whether a scheduled agent review could catch the rest is still an open question in the wiki.

### 6. The tomorrow-morning test

A page that restated a number a nightly report refreshed was wrong every morning. Before putting a number on a canon page, ask: would this be wrong tomorrow morning without anyone doing anything wrong? If yes, a report owns it. Link the report and state the rule.

### 7. Supersede in place

When the plan changes, rewrite the canon page so its present tense is true today. Don't leave the old plan beside the new one. Agents read every present-tense sentence as current. History belongs in `raw/` and the log, which are both append-only.

### 8. Keep the entry docs short

`AGENTS.md` under about 150 lines. Agents read it every session, and a long one gets skimmed. When it grows, move the narrative into the wiki and leave a link.

## Decks

Sometimes the wiki has to go into a room. `presentations/` holds slide decks that render wiki pages for that: each deck is a `deck.md` (title, audience, status, the wiki slugs it draws from) plus a `slides.jsx`, and `npm run decks` builds each one into a single HTML file. The reader's Decks tab lists them with a Present button.

A deck is a rendering, never a source. It cites the pages it draws from, and the reader lights a stale lamp when any of those pages shows up in the log after the deck's `updated` date. Slides get shown, forwarded and reused long after the wiki has moved on, which makes them the easiest place for a parallel story to form. The lamp shows you the drift before you present. `presentations/intro` is a short example: the idea and this repo in eight slides.

## What it costs

Every real source means a raw file, a compile across several pages, edge updates, index, log, lint. That's right for a messy, high-stakes domain where people disagree. It's overkill for a single owner, a short project, or a domain with no ambiguity.

It also needs someone to run the weekly hygiene pass. Without it the wiki rots faster than a plain doc, because agents keep adding to it. And garbage in still compiles: a bad transcript becomes a tidy, confident page. Evidence ledgers and Known Unknowns help; they don't fix it.

Markdown-as-graph worked well at about 90 pages. I don't know where it breaks. My guess is a few hundred, and that the limit is people holding the canon map in their heads, not parse time.

## Getting started

```bash
npm run setup          # git hooks, root and app installs
npm run lint:wiki      # 26 pages, 0 errors
npm test               # linter rule tests
npm --prefix app run dev
```

Then try an ingest. Paste something into Claude Code and say "add this to the wiki". Watch it write a raw file, update pages, add a log entry and run lint. Try to make it break a rule; the hook should stop it.

To start your own wiki, see the "Starting your own" section on the `llm-wiki-kit` project page in the wiki. In short: clear the pages, empty `_canon.json`, set `_schema.json` to your domain's page types, and ingest your first source.

## What I left out

The first instance grew several pieces that were too tied to its domain to share. Any of them is worth building if your wiki needs it:

- **Progress board.** A view of every question as a card, with a timeline built from the log. That's why log bullets name each page individually.
- **Question priority.** An automatic P0 to P3 grade for open questions, from status, evidence count, owners and staleness, with a manual `horizon` override.
- **Metrics over time.** Pages, edges, question statuses and log activity per week, rebuilt from git history.
- **A spaced-repetition drill.** An agent skill that quizzes you on the wiki with retrieval questions graded cold, so you learn the domain instead of looking it up every time.
- **Hybrid search for agents.** A local BM25 plus vector index over `raw/` and `wiki/` for questions the index doesn't route.
- **Domain-specific card types.** A page type with its own frontmatter contract and lint rules, for an idea that recurs often enough to deserve structure.

## Map

| Path | What |
| --- | --- |
| `AGENTS.md` | Rules for every agent |
| `.claude/skills/wiki/SKILL.md` | Ingest, query, lint |
| `docs/hygiene.md` | Anti-debt standard and checklists |
| `docs/design.md` | Reader design brief |
| `references/` | Page, raw, index and archive templates |
| `wiki/` | The wiki, plus `_schema.json`, `_canon.json`, `_kinds.json` |
| `raw/` | Sources |
| `scripts/wiki-lint.mjs` | Linter, with rule tests beside it |
| `.githooks/pre-commit` | Raw, docs, lint and markdown gates |
| `app/` | Reader, graph and deck catalog; `npm run export` makes one HTML file |
| `presentations/` | Slide decks built from wiki pages; `npm run decks` rebuilds them |
| `.claude/skills/presentation/SKILL.md` | How an agent builds a deck |
