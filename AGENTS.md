# Agent rules

This repo is a knowledge base that agents write and humans read. Every coding agent (Claude Code, Copilot, Cursor, Codex) follows this file. `CLAUDE.md` and `.github/copilot-instructions.md` point here and hold nothing else. Copies drift, so there is one copy.

## The layers

| Layer | What lives there | Who may write |
| --- | --- | --- |
| `raw/` | Source material as markdown: meeting notes, articles, exports. Append-only. | Agents add files. Nobody edits one after it lands. |
| `wiki/` | Compiled entity pages with typed edges. The single source of truth. | Agents, through the ingest operation. |
| `app/` | A reader that renders `wiki/` and shows `raw/` headers in citation popovers. | Code only. It may not hold knowledge. |
| `docs/` | How the system works. Not domain knowledge. | Anyone. |

If a fact is not in `wiki/`, or citable from `raw/`, treat it as unknown. The app, a slide or a README never originates a claim. They render or cite one, or the claim does not exist.

## Read before writing

1. `wiki/index.md` to find the page that already owns the idea.
2. `wiki/_canon.json` to confirm the idea's one home.
3. [docs/hygiene.md](docs/hygiene.md) the first time in a session, and before any page you create.
4. The operations in [.claude/skills/wiki/SKILL.md](.claude/skills/wiki/SKILL.md): ingest, query, lint.

## Invariants

- **Update over create.** A new page needs a new entity, a new question, or a new axis. Otherwise edit the page that owns the idea.
- **One home per idea.** `wiki/_canon.json` maps each concern to one page. Other pages give one to three sentences and a `[[wikilink]]`.
- **Supersede in place.** When direction changes, rewrite the canon page so its present tense is true today. History stays in `raw/` and `wiki/log.md`.
- **Date current state.** Write "Status (2026-10-04):", not "currently".
- **Cite material claims.** Link the raw file: `[raw](../../raw/<topic>/<file>.md)`.
- **Say what you don't know.** Pages end with `## Known Unknowns`. A substantial unknown becomes a `questions/` page.
- **Log every change.** New entries go at the top of `wiki/log.md` and old entries are never edited. Code changes get an entry too.
- **raw/ is immutable.** Fix a bad source by adding a corrected one and citing both.

## Schema

`wiki/_schema.json` is the one definition of folders, page types, edge keys, inverse pairs and edge target types. The linter and the app both read it. Adding a folder or edge key means editing that file and nothing else.

Frontmatter, briefly:

```yaml
---
type: concept
edges:
  part-of: [ingest]
  depends-on: [raw-layer]
---
```

Edges use inline lists only. Slugs are file names without `.md` and must be unique across the wiki. Templates in `references/` show every field.

## Gates

| Gate | Runs | Blocks on |
| --- | --- | --- |
| `npm run lint:wiki` | pre-commit, whenever `wiki/` or `raw/` is staged | any `E` code |
| docs gate | pre-commit, always | staged code or wiki pages without a `wiki/log.md` entry |
| `npm run lint:md` | pre-commit, on staged `.md` | markdownlint errors |
| `npm test` | by hand, and in `npm run verify` | linter rule tests |

Run `npm run setup` once after cloning so git uses `.githooks/`.

Bypasses exist for emergencies: `DOCS_OK=1` skips the docs gate and `WIKI_LINT_OK=1` skips wiki lint. Say why in the commit message.

## Anti-patterns

- `wiki/concepts/thing-v2.md` or `thing-updated.md`. Edit `thing.md`.
- The same table pasted onto three pages. Keep one and link it.
- "Next week we will..." with no date. Date it or delete it.
- Strategy parked in `wiki/log.md`. The log records what happened; canon pages say what is true.
- Editing a raw file to make it agree with the wiki.
- A tool-specific instructions file that copies these rules instead of pointing here.

## Doc budget

This file stays under about 150 lines. When it grows, move narrative into `docs/` or the wiki and leave a link.
