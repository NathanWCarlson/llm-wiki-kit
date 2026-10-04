import MiniSearch from 'minisearch'
import { graph, proseOnly, stripLinks } from './wiki'
import type { WikiPage } from '../types/wiki'

/** A snippet run; `match` marks the part of the text the query hit. */
export interface SnippetSegment {
  text: string
  match: boolean
}

export interface SearchHit {
  page: WikiPage
  score: number
  snippet: SnippetSegment[]
}

interface SearchDoc {
  id: string
  title: string
  slug: string
  type: string
  summary: string
  body: string
}

const BOOST = { title: 5, slug: 3, summary: 2, type: 1.2, body: 1 }
const SNIPPET_LEN = 150

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean)
}

function plainBody(page: WikiPage): string {
  return stripLinks(page.body)
    .replace(/^#+\s+/gm, '')
    .replace(/[*_`>~|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const index = new MiniSearch<SearchDoc>({
  fields: ['title', 'slug', 'type', 'summary', 'body'],
  tokenize,
  processTerm: (term) => term,
  searchOptions: { boost: BOOST, fuzzy: 0.15, prefix: true, tokenize },
})

index.addAll(
  Object.values(graph.pages).map((page) => ({
    id: page.slug,
    title: page.title,
    // "typed edges" should find typed-edges without the hyphen
    slug: `${page.slug} ${page.slug.replace(/-/g, ' ')}`,
    type: page.type,
    summary: stripLinks(page.summary),
    body: plainBody(page),
  })),
)

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Markdown line to the plain text shown, so match offsets line up with the display. */
function displayText(line: string): string {
  return stripLinks(line)
    .replace(/^[>\-*+\s]+/, '')
    .replace(/^\d+\.\s+/, '')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Prose lines worth quoting: no headings, tables, code, or citation headers. */
function snippetCandidates(body: string): string[] {
  return proseOnly(body)
    .split('\n')
    .filter((l) => l.trim() && !/^(#|\||---|>\s*raw:)/i.test(l.trim()))
    .map(displayText)
    .filter((t) => t.length > 20)
}

function segment(text: string, re: RegExp): SnippetSegment[] {
  const out: SnippetSegment[] = []
  let last = 0
  for (const m of text.matchAll(re)) {
    const i = m.index ?? 0
    if (i > last) out.push({ text: text.slice(last, i), match: false })
    out.push({ text: m[0], match: true })
    last = i + m[0].length
  }
  if (last < text.length) out.push({ text: text.slice(last), match: false })
  return out
}

/** Window the text around the first hit rather than always cutting from the start. */
function snippetFrom(text: string, re: RegExp): SnippetSegment[] {
  re.lastIndex = 0
  const at = re.exec(text)?.index ?? -1
  if (text.length <= SNIPPET_LEN) return segment(text, re)
  let start = at < SNIPPET_LEN * 0.4 ? 0 : at - Math.floor(SNIPPET_LEN * 0.3)
  const space = text.indexOf(' ', start)
  if (start > 0 && space > -1 && space < start + 20) start = space + 1
  const end = Math.min(text.length, start + SNIPPET_LEN)
  const segs = segment(text.slice(start, end).trimEnd(), re)
  if (start > 0) segs.unshift({ text: '…', match: false })
  if (end < text.length) segs.push({ text: '…', match: false })
  return segs
}

/** The summary when it carries the query, else the prose line with the most hits. */
function snippetFor(page: WikiPage, terms: string[]): SnippetSegment[] {
  const summary = displayText(page.summary)
  const usable = [...new Set(terms)].sort((a, b) => b.length - a.length)
  if (!usable.length) return [{ text: summary, match: false }]
  // Prefix semantics, to match the index: "edge" highlights "edges".
  const re = new RegExp(`\\b(?:${usable.map(escapeRe).join('|')})\\w*`, 'giu')
  const hits = (text: string) => [...text.matchAll(re)].length

  if (hits(summary) > 0) return snippetFrom(summary, re)
  let best = ''
  let bestHits = 0
  for (const line of snippetCandidates(page.body)) {
    const n = hits(line)
    if (n > bestHits) {
      best = line
      bestHits = n
    }
  }
  return snippetFrom(best || summary, re)
}

export function searchPages(q: string, limit = 12): SearchHit[] {
  const query = q.trim()
  if (!query) return []
  // AND first; widen to OR only when that leaves almost nothing.
  let results = index.search(query, { combineWith: 'AND' })
  if (results.length < 3) results = index.search(query, { combineWith: 'OR' })

  const terms = tokenize(query)
  const lower = query.toLowerCase()
  return results
    .flatMap((r) => {
      const page = graph.pages[String(r.id)]
      if (!page) return []
      const title = page.title.toLowerCase()
      const exact = title === lower || page.slug === lower ? 3 : title.startsWith(lower) ? 1.8 : 1
      return [{ page, score: r.score * exact, snippet: snippetFor(page, terms) }]
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
