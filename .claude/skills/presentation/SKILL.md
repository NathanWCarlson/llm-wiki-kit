---
name: presentation
description: "Build or update a slide deck from this repo's wiki. Use when asked for a deck, slides, a presentation or a talk built from wiki pages, or to refresh a stale deck. Triggers: 'make a deck', 'build slides', 'presentation about', 'update the deck'."
---

# Presentation builder

Decks live in `presentations/<slug>/` and build to one HTML file in `presentations/shares/`. The contract (deck.md fields, freshness, build commands) is in [presentations/README.md](../../../presentations/README.md). Read it first.

A deck renders the wiki. It never adds knowledge. If the wiki can't back a slide, the slide doesn't exist yet.

## Before writing a slide

1. Read `wiki/index.md` and every page the deck will draw from. Read the pages, not just the index summaries.
2. Check `wiki/_canon.json`. A fact registered there may only be restated on its home page, so a slide names the idea and cites the home slug instead of repeating the registered string.
3. Read the other decks' `deck.md` files. Each deck has one job: one question for one audience. If another deck already owns the idea, point to it in a sentence. Don't teach it twice.
4. Write down the topic, the audience, the one sentence the room should leave with, and the source slugs.

## Build steps

1. `cp -R presentations/_template presentations/<slug>`.
2. Fill in `deck.md`: `slug`, `title`, `audience`, `status: draft`, `role`, `slides`, `updated` (today), `sources`.
3. Write the titles of every slide on their own, before any JSX. Read only the titles. They should make the whole argument, each one a full claim, never a topic label.
4. Write `slides.jsx`. Use `Slide` from the shell with `legend`, `title`, `lede` and `cite`. End with `sourcesSlide(DECK_META)`. Keep `DECK_META.sources` equal to `sources` in `deck.md`.
5. Put deck-only styles in `deck.css`. If a second deck wants the same style, move it to `shell/base.css`.
6. `npm --prefix presentations run dev -- <slug>` while working, then `npm --prefix presentations run build -- <slug>` and `npm --prefix presentations run lint`.
7. Check every slide in both themes (T) and at each zoom step (Z). Nothing may overlap the frame, the title line or the nav. If a slide is too tall, split it or cut it. Don't shrink the type.
8. Set `status: ready` when it is presentable.

## Sources and numbers

- Every claim slide ends with a `cite` line naming the wiki slugs it draws from. A doc path such as `docs/GUIDE.md` is fine for setup steps and history.
- Never invent a number, date, count or quote. Copy figures from the page that owns them, with the same units. If the wiki gives no figure, the slide gives none.
- Never cite a deck, a chat or memory. If the answer isn't in the wiki, run an ingest first.
- A claim that would be wrong tomorrow morning without anyone doing anything wrong belongs to a report, not a slide.

## Structure

- One idea per slide. A slide that needs two titles is two slides.
- Put the answer early. A new reader should know the point by slide two or three.
- Close on the next step. Don't end with "Questions?" or a thank-you slide.
- Vary density. Some slides are one sentence; not every list has three items.
- Reference material after the close goes in the appendix: `{ render, appendix: true }`.

## Voice

Slides are read aloud. Write what the presenter would say.

- Plain words. Verbs carry the slide. Cut adjectives first and adverbs always.
- Sentence-case prose. The shell sets titles and legends in caps; write them in normal case.
- No em dashes. Use a period or a colon.
- No "not just X but Y", no rhetorical questions in titles, no exclamation marks, no emoji.
- No puffery: seamless, robust, powerful, cutting-edge, unlock, leverage, empower, game-changing.
- Say it once. If the takeaway line repeats the title, delete one.
- Bold the one phrase per slide the presenter would stress, or nothing.
- The generic test: if a sentence would fit any project's deck unchanged, it isn't specific enough.

## Layout

- Use the shell primitives: `.ledger` rows, `.steps`, `.cards`, `.layers`, `.cols`, `.code`, `.takeaway`.
- Text fills its container. No `max-width` on paragraphs, list items or headings. The slide column is the only measure.
- `faint` is for chrome only. Text that carries information uses `dim` or `fg`.
- Motion is the shell's reveal cascade. Mark a list or grid `data-cascade` so its items reveal in turn. Add no other animation.

## After the wiki changes

A deck is stale when a page in its `sources` gets a newer `wiki/log.md` entry than the deck's `updated`, or when `shell/base.css` changed since the last build.

1. Read the log entries for the stale slugs and re-read those pages.
2. Fix every slide whose claim moved. Re-run the title-only read.
3. Set `updated:` to today.
4. Rebuild: `npm --prefix presentations run build -- <slug>`.

A shell change needs only the rebuild.
