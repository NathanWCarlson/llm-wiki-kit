import schemaJson from '../../../wiki/_schema.json'
import type {
  EdgeKey,
  Evidence,
  EvidenceItem,
  Folder,
  GraphEdge,
  Inbound,
  WikiGraph,
  WikiPage,
} from '../types/wiki'

export const schema = schemaJson

/** Folders in schema order; the sidebar and graph legend follow it. */
export const FOLDERS = Object.keys(schema.folders) as Folder[]

/** Page types in schema order, one per folder. */
export const TYPES = FOLDERS.map((f) => schema.folders[f])

export const EDGE_KEYS: readonly EdgeKey[] = schema.edges

const INVERSE: Record<string, string> = schema.inverse

/** Both directions of every inverse pair: feeds <-> fed-by. */
export const INVERSE_OF: Record<string, string> = {
  ...INVERSE,
  ...Object.fromEntries(Object.entries(INVERSE).map(([k, v]) => [v, k])),
}

const files = import.meta.glob('../../../wiki/*/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const indexFile = import.meta.glob('../../../wiki/index.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n/
const WIKILINK_RE = /\[\[([^\]|\\]+)(?:\\?\|[^\]]+)?\]\]/g

function isFolder(name: string): name is Folder {
  return Object.hasOwn(schema.folders, name)
}

function unquote(s: string): string {
  return /^(["']).*\1$/.test(s) ? s.slice(1, -1) : s
}

/** Body with fenced blocks and inline code blanked, the same view the linter takes. */
export function proseOnly(body: string): string {
  let fenced = false
  return body
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        fenced = !fenced
        return ''
      }
      return fenced ? '' : line.replace(/`[^`]*`/g, '')
    })
    .join('\n')
}

/** Inline lists only (`  key: [a, b]`), the one shape wiki-lint accepts; `edges: {}` is empty. */
function parseEdges(fmLines: string[]): Record<EdgeKey, string[]> {
  const edges: Record<EdgeKey, string[]> = {}
  const start = fmLines.findIndex((l) => /^edges:/.test(l))
  if (start < 0 || /^edges:\s*\{\s*\}\s*$/.test(fmLines[start])) return edges
  for (let i = start + 1; i < fmLines.length && /^ {2}\S/.test(fmLines[i]); i++) {
    const m = fmLines[i].match(/^ {2}([\w-]+):\s*\[([^\]]*)\]\s*$/)
    if (!m) continue
    const values = m[2].split(',').map((s) => s.trim()).filter(Boolean)
    edges[m[1]] = [...new Set([...(edges[m[1]] ?? []), ...values])]
  }
  return edges
}

function parseEvidence(fmLines: string[]): Evidence | undefined {
  const start = fmLines.findIndex((l) => /^evidence:\s*$/.test(l))
  if (start < 0) return undefined
  const evidence: Evidence = { for: [], against: [] }
  let side: EvidenceItem[] | null = null
  for (let i = start + 1; i < fmLines.length && /^\s/.test(fmLines[i]); i++) {
    const line = fmLines[i]
    const sideMatch = line.match(/^ {2}(for|against):/)
    if (sideMatch) {
      side = evidence[sideMatch[1] as 'for' | 'against']
      continue
    }
    const raw = line.match(/^\s+- raw:\s*(\S+)/)
    if (raw && side) {
      side.push({ raw: raw[1] })
      continue
    }
    const note = line.match(/^\s+note:\s*(.+)$/)
    const last = side?.at(-1)
    if (note && last) last.note = unquote(note[1].trim())
  }
  return evidence.for.length || evidence.against.length ? evidence : undefined
}

/** First prose paragraph after the title: no heading, quote, list, or table. */
function firstParagraph(body: string): string {
  for (const block of body.split(/\n\s*\n/)) {
    const text = block.trim()
    if (!text || /^(#|>|-|\*|\||\d+\.|```)/.test(text)) continue
    return text.replace(/\n/g, ' ')
  }
  return ''
}

export function parsePage(folder: Folder, slug: string, text: string): WikiPage {
  const fmMatch = text.match(FRONTMATTER_RE)
  const fm = fmMatch ? fmMatch[1] : ''
  const fmLines = fm.split('\n')
  const body = fmMatch ? text.slice(fmMatch[0].length) : text
  const field = (name: string) => {
    const v = fm.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'))?.[1].trim()
    return v ? unquote(v) : undefined
  }

  const mentions = new Set<string>()
  for (const m of proseOnly(body).matchAll(WIKILINK_RE)) mentions.add(m[1].trim())

  return {
    slug,
    folder,
    path: `wiki/${folder}/${slug}.md`,
    title: body.match(/^# (.+)$/m)?.[1].trim() ?? slug,
    type: field('type') ?? '',
    lastVerified: field('last-verified'),
    status: field('status'),
    horizon: field('horizon'),
    hypothesis: field('hypothesis'),
    evidence: parseEvidence(fmLines),
    edges: parseEdges(fmLines),
    body,
    summary: firstParagraph(body.replace(/^# .+$/m, '')),
    mentions: [...mentions],
  }
}

function buildGraph(): WikiGraph {
  const pages: Record<string, WikiPage> = {}
  for (const [path, text] of Object.entries(files)) {
    const [folder, file] = path.split('/').slice(-2)
    // The linter only reads schema folders, so anything else is not a page.
    if (!isFolder(folder)) continue
    const page = parsePage(folder, file.replace(/\.md$/, ''), text)
    pages[page.slug] = page
  }

  // One drawn line per relation: an inverse key (fed-by) folds into its
  // forward key (feeds), so a pair declared on both pages is not drawn twice.
  const forwardOf = Object.fromEntries(Object.entries(INVERSE).map(([f, inv]) => [inv, f]))
  const edges: GraphEdge[] = []
  const seen = new Set<string>()
  for (const page of Object.values(pages)) {
    for (const [key, targets] of Object.entries(page.edges)) {
      for (const target of targets) {
        if (!pages[target] || target === page.slug) continue
        const edge = forwardOf[key]
          ? { from: target, to: page.slug, key: forwardOf[key] }
          : { from: page.slug, to: target, key }
        const id = `${edge.from}|${edge.key}|${edge.to}`
        if (seen.has(id)) continue
        seen.add(id)
        edges.push(edge)
      }
    }
  }

  const inbound: Record<string, Inbound[]> = {}
  const add = (to: string, entry: Inbound) => {
    if (to === entry.from || !pages[to]) return
    const list = (inbound[to] ??= [])
    if (!list.some((b) => b.from === entry.from && b.via === entry.via)) list.push(entry)
  }
  for (const page of Object.values(pages)) {
    for (const [key, targets] of Object.entries(page.edges)) {
      for (const t of targets) add(t, { from: page.slug, via: key })
    }
    for (const m of page.mentions) add(m, { from: page.slug, via: 'mention' })
  }

  return { pages, edges, inbound }
}

export const graph: WikiGraph = buildGraph()

const indexText = Object.values(indexFile)[0] ?? '# Wiki\n'

/** wiki/index.md, rendered as the home page. */
export const home = {
  path: 'wiki/index.md',
  title: indexText.match(/^# (.+)$/m)?.[1].trim() ?? 'Wiki',
  body: indexText,
}

export function pagesInFolder(folder: Folder): WikiPage[] {
  return Object.values(graph.pages)
    .filter((p) => p.folder === folder)
    .sort((a, b) => a.title.localeCompare(b.title))
}

export function stripLinks(s: string): string {
  return s
    .replace(/\[\[([^\]|\\]+)\\?\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, (_, slug: string) => graph.pages[slug.trim()]?.title ?? slug)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim()
}

/** 'fed-by' -> 'fed by' */
export function edgeLabel(key: EdgeKey): string {
  return key.replace(/-/g, ' ')
}

export interface ArticleStats {
  words: number
  minutes: number
  /** outbound edge targets that resolve to a page */
  edges: number
  /** distinct pages that point here by edge or wikilink */
  backlinks: number
}

/** Counts read from the prose only; code blocks and inline code are not words. */
export function articleStats(body: string, slug?: string): ArticleStats {
  const plain = proseOnly(body)
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\[\[([^\]|\\]+)(?:\\?\|([^\]]+))?\]\]/g, (_, s: string, label?: string) => label ?? s.replace(/-/g, ' '))
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_>|#-]+/g, ' ')
  const words = plain.split(/\s+/).filter((w) => /\w/.test(w)).length
  const page = slug ? graph.pages[slug] : undefined
  return {
    words,
    minutes: Math.max(1, Math.round(words / 220)),
    edges: page ? Object.values(page.edges).flat().filter((t) => graph.pages[t]).length : 0,
    backlinks: page ? new Set((graph.inbound[page.slug] ?? []).map((b) => b.from)).size : 0,
  }
}
