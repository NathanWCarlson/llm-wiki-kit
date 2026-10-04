# Origin and shape of the wiki pattern

> Source: Author's design notes from running the first instance of this pattern (an internal operations knowledge base, about 90 pages and 200 sources over three months)
> Collected: 2026-10-04
> Published: 2026-10-04

## Where the idea came from

Two ideas, combined.

Andrej Karpathy's framing of an LLM-maintained wiki: the LLM writes and maintains the wiki; the human reads and asks questions. The wiki is a persistent artifact that compounds, unlike a chat that ends.

Garry Tan's "gbrain" framing: every page is an entity with typed edges to other entities; answers are synthesized and cited; every page states what it does not know yet.

## Shape we landed on

- `raw/` holds sources converted to markdown, append-only, one file per source, dated by publish date, with a three-line header (source, collected, published).
- `wiki/` holds compiled pages. One level of topic folders. Each folder maps to one page type.
- The markdown files are the graph. No graph database. Frontmatter edges plus `[[wikilinks]]` are enough for about 50 to 100 entities.
- `wiki/index.md` is the entry point for both people and agents. `wiki/log.md` is newest-first operations history.
- A reader app renders the wiki. It may not hold knowledge of its own. Everything downstream fails closed: it renders or cites a wiki claim, or the claim does not exist.

## Uncertainty as structure

Four layers, each with a home:

1. Known Unknowns: a section at the end of a page for what its sources don't settle.
2. Questions: a page per open research thread, with a status and a horizon (now, next, later, parked).
3. Working claim: one falsifiable sentence on the question page (`hypothesis`).
4. Evidence ledger: `for` and `against` lists pointing at raw paths only, never at wiki pages, so sources stay out of the entity graph.

The working claim is the headline and the Answer section is the cited detail. The worst failure we saw was a headline that said one thing while the Answer section, updated later, said another.

## Where it does not fit

- Single owner, short horizon, low ambiguity. A README is enough.
- No one will run the weekly hygiene pass. The wiki then rots faster than a plain doc because agents keep adding to it.
- Thousands of entities or heavy multi-hop queries. A real graph store would serve better.
- Garbage in still compiles. A bad transcript becomes a tidy, confident page. Evidence ledgers and Known Unknowns reduce that; they do not remove it.
