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
- `npm run export` writes one self-contained HTML file.

## Rule

The app may not originate knowledge. It renders or cites a wiki claim, or the claim does not exist. A screen that needs a fact the wiki lacks is a reason to [[ingest]] a source, not to hardcode a string. [raw](../../raw/design-notes/2026-10-04-origin-and-shape.md)
