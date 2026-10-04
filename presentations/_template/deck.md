---
slug: _template
title: Deck title
audience: Who will be in the room
status: draft
role: general
slides: 3
updated: 2026-10-04
sources:
  - llm-wiki-kit
summary: One line for the reader's deck list.
---

Folders starting with `_` are never built. To start a deck:

1. `cp -R presentations/_template presentations/<slug>`
2. Set every field above. `slug` matches the folder name; `sources` lists the wiki slugs the slides draw from.
3. Write the slides in `slides.jsx` and keep `DECK_META.sources` in step with `sources` here.
4. `npm --prefix presentations run dev -- <slug>` to work on it, `npm --prefix presentations run build -- <slug>` to publish it to `shares/`.
