# llm-wiki-kit

A starter kit for a wiki that coding agents write and people read. Sources go into `raw/`, agents compile them into linked entity pages in `wiki/`, and a linter plus git hooks keep the agents from making a mess.

The wiki in this repo documents the kit itself, so it doubles as a worked example.

Start with [docs/GUIDE.md](docs/GUIDE.md). It covers the idea, how the pieces fit together, and the lessons behind each rule.

## Quick start

Needs Node 22 or newer.

```bash
npm run setup               # point git at .githooks/, install root and app deps
npm run lint:wiki           # check the wiki
npm test                    # linter rule tests
npm --prefix app run dev    # open the reader
npm --prefix app run export # one self-contained HTML file of the whole wiki
npm run verify              # everything above, warnings as errors
```

## Using it with an agent

Open the repo in Claude Code (or Copilot, Cursor, Codex) and say "add this to the wiki" with a source pasted or attached. Every agent follows [AGENTS.md](AGENTS.md); the steps are in [.claude/skills/wiki/SKILL.md](.claude/skills/wiki/SKILL.md).

## Layout

| Path | What |
| --- | --- |
| `raw/` | Sources as markdown, append-only |
| `wiki/` | Compiled pages, index, log, schema, canon map |
| `scripts/` | Linter and its tests |
| `.githooks/` | Pre-commit gates |
| `app/` | Reader with search and graph |
| `docs/` | Guide, hygiene standard, design brief |
| `references/` | Page templates |
