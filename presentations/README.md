# Presentations

Slide decks rendered from the wiki. Each deck builds to one self-contained HTML file in `shares/` that opens from disk, an email attachment or the reader app.

## Rules

- **Knowledge comes from `wiki/`.** A slide renders or cites a wiki claim. It never originates one. If a slide needs a fact the wiki lacks, ingest a source first.
- **A deck is a rendering, not a source of truth.** When the wiki changes, the deck goes stale. Fix the deck; never fix the wiki to match a slide.
- **Cite on the slide.** Each claim slide ends with a source line of wiki slugs, and every deck closes with a Sources appendix.
- **One job per deck.** Each deck answers one question for one audience. If two decks start teaching the same idea, one owns it and the other gives a sentence and points there. This is the wiki's one-home rule applied to decks.

The builder skill is [.claude/skills/presentation/SKILL.md](../.claude/skills/presentation/SKILL.md).

## deck.md

Every deck folder has a `deck.md` with this frontmatter:

```yaml
---
slug: intro                 # same as the folder name
title: An LLM-maintained wiki
audience: Someone who just found this repo
status: ready               # draft | ready | archived
role: general               # exec | technical | general
slides: 8                   # count, appendix included
updated: 2026-10-04         # date the claims were last checked against the wiki
sources:                    # wiki slugs the slides draw from
  - wiki-layer
  - ingest
summary: One line for the reader's deck list.   # optional
---
```

`sources` must be real slugs, and the deck's Sources slide lists the same ones.

## Freshness

Lifecycle (`status`) and freshness are separate. A ready deck can be stale and still be presented. A deck is stale when either holds:

- **The wiki moved.** A slug in `sources` has a `wiki/log.md` entry dated after the deck's `updated`. Re-check the slides against those pages, then bump `updated`.
- **The shell moved.** The `shellSig` recorded for the deck in `shares/manifest.json` differs from `shellSigFromCss()` of the current `shell/base.css`. Rebuild.

`shares/manifest.json` is written by the build:

```json
{ "slugs": ["intro"], "meta": { "intro": { "builtAt": "<ISO time>", "shellSig": "<hash>" } } }
```

## Build

From the repo root:

```bash
npm --prefix presentations install
npm --prefix presentations run build             # every deck to shares/<slug>.html
npm --prefix presentations run build -- intro    # one deck
npm --prefix presentations run dev -- intro      # live reload one deck
npm --prefix presentations run lint
```

In a deck: arrow keys, Space or click to move, T for theme, Z for zoom. To make a PDF, switch to the light theme and print; each slide becomes a 16:9 page.

## Layout

| Path | What |
| --- | --- |
| `shell/` | The shared engine: runner, theme, kit, `base.css`, `shellSig.mjs` |
| `_template/` | Copy this to start a deck. Folders starting with `_` are never built. |
| `<slug>/` | A deck: `deck.md`, `index.html`, `slides.jsx`, `deck.css` |
| `shares/` | Built decks and `manifest.json` |
| `scripts/` | Build and dev |
