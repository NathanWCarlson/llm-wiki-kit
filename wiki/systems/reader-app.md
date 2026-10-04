---
type: system
edges:
  fed-by: [wiki-layer]
  depends-on: [shared-schema]
  owned-by: [agent-maintainers]
last-verified: 2026-10-04
---

# Reader app

> Raw: [origin and shape](../../raw/design-notes/2026-10-04-origin-and-shape.md)

## Overview

`app/` renders the [[wiki-layer]] for [[human-readers]]: a reader view with search, backlinks and citation popovers, and a graph view of [[typed-edges]]. It builds to a single HTML file that can be sent by email.

## Start here (as of 2026-10-04)

- Reads `wiki/` at build time. Nothing to deploy beyond static files.
- Reads [[shared-schema]] for folders and edge keys, so it agrees with the [[wiki-linter]].
- Citation popovers show a raw file's header lines and every page that cites it. Source bodies never enter the bundle.
- Each page shows its word count, reading time, sections, edges and backlinks under the title. The sidebar folders collapse, with the open page's folder expanded.
- Long pages get a Sections menu and a back-to-top button. A header control scales the whole UI for screen sharing.
- The graph zooms and pans: drag, pinch, or ⌘-scroll.
- The Decks tab lists [[decks]] with a stale lamp and a Present button. Each page lists the decks that cite it.
- `npm run export` writes one self-contained HTML file.

## Rule

The app may not originate knowledge. It renders or cites a wiki claim, or the claim does not exist. A screen that needs a fact the wiki lacks is a reason to [[ingest]] a source, not to hardcode a string. [raw](../../raw/design-notes/2026-10-04-origin-and-shape.md)
