# Reader app

Renders `../wiki` as a website. It reads the wiki and `../wiki/_schema.json` at build time and holds no knowledge of its own. Citation popovers show the header of a `../raw` file and nothing else. Source bodies never enter the bundle.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server. Restart it after adding raw files. |
| `npm run build` | Type-check, then build to `dist/`. |
| `npm run lint` | Run oxlint. Any warning fails. |
| `npm test` | Run the vitest suite against the real wiki. |
| `npm run export` | Write `dist-export/wiki.html`, one file with CSS and JS inlined. It opens from disk. |
| `npm run verify` | Run lint, test, build and export in that order. |

The tests fail if a page's type disagrees with its folder, if a page uses an edge key the schema lacks, if a `[[wikilink]]` renders as bare text, if a cited raw file has no header entry, or if search can't find a page by its title.

Press ⌘K (Ctrl+K) to search. The theme toggle and the last page you opened persist in localStorage under `llm-wiki-reader`.
