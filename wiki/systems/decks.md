---
type: system
edges:
  fed-by: [wiki-layer]
  owned-by: [agent-maintainers]
last-verified: 2026-10-04
---

# Decks

## Overview

`presentations/` turns wiki pages into slide decks for a room. A deck is a rendering of the [[wiki-layer]], never a source of truth: it cites the pages it draws from, and a fact a deck needs that the wiki lacks is a reason to [[ingest]], not to type it onto a slide.

## Start here (as of 2026-10-04)

| Part | Role |
| --- | --- |
| `presentations/<slug>/deck.md` | Title, audience, status, role, slide count, `updated` date, and `sources`: the wiki slugs it draws from |
| `presentations/<slug>/slides.jsx` | The slides, built on the shared shell |
| `presentations/shell/` | Navigation, theme, zoom, print, slide components |
| `presentations/shares/` | One self-contained HTML file per deck, plus a manifest of build times |
| `npm run decks` | Builds every deck into `shares/` |

The [[reader-app]] lists decks in its Decks tab and presents them in a new tab with the reader's theme and scale.

## Freshness

A deck goes stale when any page in its `sources` appears in the [[operations-log]] with a date after the deck's `updated`, or when it was built against an older shell. Stale decks still present; the lamp is a warning, not a block. Rebuild after updating the slides and bumping `updated`.

Freshness reads the log's page bullets, which is one more reason each bullet names a single page.

## Known Unknowns

- Whether a deck should go stale on any change to a source page or only on changes to the parts it quotes. The log does not record which section changed.
