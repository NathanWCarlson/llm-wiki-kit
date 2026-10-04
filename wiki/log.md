# Log

Newest first. Never edit an old entry. Heading shape: `## [YYYY-MM-DD] kind | title`.

## [2026-10-04] hygiene | wiki pass after first compile

- Fossil grep: 6 hits, all pages quoting the phrases rather than using them. None fixed.
- Updated: questions/q-automate-fossil-check.md
- Duplicate tables: none; each table appears on one page.
- Longest page is 39 lines, well under every soft limit.
- Question statuses match their evidence.

## [2026-10-04] lint | 1 issue found, 0 fixed

- Ran: npm run lint:wiki
- Found: the hygiene kind was declared in _kinds.json before any entry used it. Resolved by running the pass above, not by deleting the kind.

## [2026-10-04] decision | Schema shared by linter and reader

- Updated: concepts/shared-schema.md
- Updated: systems/wiki-linter.md
- Updated: systems/reader-app.md

## [2026-10-04] ingest | Enforcement lessons from the first instance

- Source: raw/design-notes/2026-10-04-enforcement-lessons.md
- Created: concepts/canon-map.md
- Created: concepts/fact-registry.md
- Created: concepts/operations-log.md
- Created: concepts/update-over-create.md
- Created: concepts/tomorrow-morning-test.md
- Created: systems/wiki-linter.md
- Created: systems/pre-commit-hook.md
- Created: processes/hygiene-pass.md
- Created: processes/lint.md
- Created: questions/q-lint-vs-review.md
- Created: questions/q-automate-fossil-check.md

## [2026-10-04] ingest | Origin and shape of the wiki pattern

- Source: raw/design-notes/2026-10-04-origin-and-shape.md
- Created: systems/raw-layer.md
- Created: systems/wiki-layer.md
- Created: systems/reader-app.md
- Created: concepts/shared-schema.md
- Created: concepts/typed-edges.md
- Created: concepts/known-unknowns.md
- Created: concepts/supersede-in-place.md
- Created: concepts/page-zones.md
- Created: processes/ingest.md
- Created: processes/query.md
- Created: people-teams/agent-maintainers.md
- Created: people-teams/human-readers.md
- Created: projects/llm-wiki-kit.md
- Created: questions/q-scale-ceiling.md
