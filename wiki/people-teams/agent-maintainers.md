---
type: team
edges: {}
last-verified: 2026-10-04
---

# Agent maintainers

## Overview

The coding agents that write the wiki: Claude Code, Copilot, Cursor, Codex or whatever comes next. They run [[ingest]], [[query]], [[lint]] and the [[hygiene-pass]].

## Start here (as of 2026-10-04)

- All agents follow `AGENTS.md`. Tool-specific files point to it and hold no rules of their own.
- Agents write; [[human-readers]] read and ask. A human can edit too, under the same rules.
- Agents forget between sessions. The rules that matter most are the ones the [[pre-commit-hook]] enforces.
