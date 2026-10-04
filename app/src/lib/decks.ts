import { shellSigFromCss } from '../../../presentations/shell/shellSig.mjs'
import shellCss from '../../../presentations/shell/base.css?raw'
import { graph } from './wiki'
import { lastLogged } from './log'

export type DeckStatus = 'draft' | 'ready' | 'archived'

export interface Deck {
  slug: string
  title: string
  audience: string
  summary: string
  status: DeckStatus
  role: string | null
  slides: number | null
  updated: string
  sources: string[]
  /** Sources that are not wiki pages; the tests fail on any. */
  unknownSources: string[]
  /** Source pages logged after `updated`. */
  staleSources: string[]
  staleReasons: string[]
  builtAt: string | null
  html: string | null
}

const deckFiles = import.meta.glob('../../../presentations/*/deck.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

// Built decks are inlined so Present works from the single-file export too.
const shareFiles = import.meta.glob('../../../presentations/shares/*.html', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const manifestFiles = import.meta.glob('../../../presentations/shares/manifest.json', {
  import: 'default',
  eager: true,
}) as Record<string, { meta?: Record<string, { builtAt: string; shellSig: string }> }>

export const CURRENT_SHELL_SIG = shellSigFromCss(shellCss)
const buildMeta = Object.values(manifestFiles)[0]?.meta ?? {}
const shareHtml = Object.fromEntries(
  Object.entries(shareFiles).map(([path, html]) => [path.split('/').pop()!.replace(/\.html$/, ''), html]),
)

const STATUS_RANK: Record<DeckStatus, number> = { ready: 0, draft: 1, archived: 2 }

export function parseDeck(folder: string, text: string): Deck | null {
  const fm = text.match(/^---\n([\s\S]*?)\n---/)?.[1]
  if (!fm) return null
  const field = (name: string) => fm.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'))?.[1].trim() ?? ''
  const slug = field('slug') || folder
  const status = (['draft', 'ready', 'archived'] as const).find((s) => s === field('status')) ?? 'draft'
  const sources = [...(fm.match(/^sources:\s*\n((?:\s+- .+\n?)+)/m)?.[1].matchAll(/-\s*(\S+)/g) ?? [])].map((m) => m[1])
  const updated = field('updated')
  const meta = buildMeta[slug]

  const staleSources = sources.filter((s) => {
    const logged = lastLogged.get(s)
    return Boolean(updated && logged && logged > updated)
  })
  const staleReasons: string[] = []
  if (staleSources.length) staleReasons.push(`wiki changed since ${updated}: ${staleSources.join(', ')}`)
  if (!meta) staleReasons.push('not built yet: npm --prefix presentations run build')
  else if (meta.shellSig !== CURRENT_SHELL_SIG) staleReasons.push('built against an older shell; rebuild')

  return {
    slug,
    title: field('title') || slug,
    audience: field('audience'),
    summary: field('summary'),
    status,
    role: field('role') || null,
    slides: Number.parseInt(field('slides'), 10) || null,
    updated,
    sources,
    unknownSources: sources.filter((s) => !graph.pages[s]),
    staleSources,
    staleReasons,
    builtAt: meta?.builtAt ?? null,
    html: shareHtml[slug] ?? null,
  }
}

export const decks: Deck[] = Object.entries(deckFiles)
  .map(([path, text]) => [path.split('/').at(-2)!, text] as const)
  .filter(([folder]) => !folder.startsWith('_'))
  .map(([folder, text]) => parseDeck(folder, text))
  .filter((d): d is Deck => d !== null)
  .sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status] || b.updated.localeCompare(a.updated) || a.title.localeCompare(b.title))

export function decksCiting(slug: string): Deck[] {
  return decks.filter((d) => d.sources.includes(slug))
}

export const canPresent = (deck: Deck) => deck.html !== null && deck.status !== 'draft'

/**
 * Opens the built deck in a new tab as a blob, so it works from a dev server, a
 * static host and the file:// export alike. Theme and scale travel in the
 * fragment because blob URLs cannot carry a query string.
 */
export function presentDeck(deck: Deck, theme: string, scale: number): void {
  if (!deck.html) return
  const url = URL.createObjectURL(new Blob([deck.html], { type: 'text/html;charset=utf-8' }))
  window.open(`${url}#theme=${theme}&scale=${scale}`, '_blank', 'noopener')
  // The new tab needs the blob while it loads; release it well after.
  window.setTimeout(() => URL.revokeObjectURL(url), 10 * 60 * 1000)
}
