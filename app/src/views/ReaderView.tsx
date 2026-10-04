import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUp, ArrowUpRight, ChevronRight, Network, Presentation, Search } from 'lucide-react'
import { edgeLabel, FOLDERS, graph, home, INVERSE_OF, pagesInFolder } from '../lib/wiki'
import { STATUS_COLOR } from '../lib/theme'
import { useAppStore } from '../store/useAppStore'
import { CitePopover, Markdown, type CiteAnchor } from '../components/Markdown'
import { sectionsOf, type Section } from '../lib/wikiLinks'
import { decksCiting } from '../lib/decks'
import { Legend, Panel, TypeBadge } from '../components/ui'
import type { WikiPage } from '../types/wiki'

/** The header shows the title, so the body's own `# Title` line is dropped. */
function withoutTitle(body: string): string {
  return body.replace(/^\s*# .+\n?/, '')
}

export function ReaderView() {
  const selected = useAppStore((s) => s.selected)
  const openPage = useAppStore((s) => s.openPage)
  const page = selected ? graph.pages[selected] : undefined
  const body = withoutTitle(page ? page.body : home.body)
  const sections = useMemo(() => sectionsOf(body), [body])
  const pageKey = page?.slug ?? 'home'

  return (
    <div className="rise grid grid-cols-1 gap-5 lg:grid-cols-[210px_minmax(0,1fr)_250px]">
      <PageList current={page?.slug} openPage={openPage} />

      <Panel id="article-top" className={`min-w-0 scroll-mt-20 px-4 py-5 sm:px-7 sm:py-6 ${page ? '' : 'lg:col-span-2'}`}>
        {page ? (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <TypeBadge type={page.type} />
              {page.lastVerified && (
                <span className="font-mono text-chrome text-faint">verified {page.lastVerified}</span>
              )}
              <span className="ml-auto break-all font-mono text-chrome text-faint">{page.path}</span>
              {sections.length >= 3 && <SectionsMenu items={sections} pageKey={pageKey} />}
            </div>
            <h1 className="display mb-5 border-b border-edge pb-4 text-[1.85rem] leading-[1.15] text-fg [overflow-wrap:anywhere]">
              {page.title}
            </h1>
            {page.type === 'question' && <QuestionPanel page={page} openPage={openPage} />}
            <Markdown md={body} path={page.path} onNavigate={openPage} />
          </>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <Legend>Home</Legend>
              <span className="ml-auto font-mono text-chrome text-faint">{home.path}</span>
              {sections.length >= 3 && <SectionsMenu items={sections} pageKey={pageKey} />}
            </div>
            <h1 className="display mb-5 border-b border-edge pb-4 text-[1.85rem] leading-[1.15] text-fg">
              {home.title}
            </h1>
            <Markdown md={body} path={home.path} onNavigate={openPage} />
          </>
        )}
      </Panel>

      {page && (
        <aside className="min-w-0">
          <ConnectionsPanel page={page} openPage={openPage} />
        </aside>
      )}
      <BackToTop pageKey={pageKey} />
    </div>
  )
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/** Jump-to list in the meta strip, beside the path and never over the title. */
function SectionsMenu({ items, pageKey }: { items: Section[]; pageKey: string }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // A new page closes the menu. Resetting during render avoids an effect round-trip.
  const [lastKey, setLastKey] = useState(pageKey)
  if (lastKey !== pageKey) {
    setLastKey(pageKey)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    const onDoc = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const go = (id: string) => {
    scrollToId(id)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={open ? 'Hide section list' : 'Jump to section'}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded border border-edge bg-console px-2 py-1 font-mono text-chrome uppercase tracking-label text-dim transition-colors hover:border-amber hover:text-amber"
      >
        <ChevronRight size={11} strokeWidth={2.5} className={`text-faint transition-transform ${open ? 'rotate-90' : ''}`} />
        Sections
        <span className="tabular-nums text-faint">{items.length}</span>
      </button>
      {open && (
        <ul className="absolute right-0 top-full z-30 mt-1 max-h-[min(60vh,24rem)] w-56 overflow-y-auto rounded border border-edge bg-void py-1.5 shadow-md">
          <li>
            <button
              type="button"
              onClick={() => go('article-top')}
              className="flex w-full items-center gap-1.5 px-2.5 py-1.5 font-mono text-data text-dim transition-colors hover:bg-console hover:text-amber"
            >
              <ArrowUp size={11} className="text-faint" />
              Top
            </button>
          </li>
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                title={item.label}
                onClick={() => go(item.id)}
                className="block w-full truncate px-2.5 py-1.5 font-mono text-data text-dim transition-colors hover:bg-console hover:text-amber"
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Bottom-right return control, shown once the article header has scrolled away. */
function BackToTop({ pageKey }: { pageKey: string }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pageKey])

  if (!visible) return null
  return (
    <button
      type="button"
      onClick={() => scrollToId('article-top')}
      title="Back to the top of the page"
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-1.5 rounded border border-edge bg-void/95 px-3 py-2 font-mono text-data uppercase tracking-label text-dim shadow-md backdrop-blur-sm transition-colors hover:border-amber hover:text-amber sm:bottom-6 sm:right-6"
    >
      <ArrowUp size={14} strokeWidth={2.25} className="text-amber" />
      Top
    </button>
  )
}

function PageList({ current, openPage }: { current?: string; openPage: (slug: string) => void }) {
  const goHome = useAppStore((s) => s.goHome)
  const [filter, setFilter] = useState('')
  // Phone width: the list folds behind one button so the article comes first.
  const [openOnPhone, setOpenOnPhone] = useState(false)
  const q = filter.trim().toLowerCase()
  const total = Object.keys(graph.pages).length

  return (
    <aside className="min-w-0 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:pr-1">
      <button
        type="button"
        onClick={() => setOpenOnPhone((o) => !o)}
        aria-expanded={openOnPhone}
        className="flex w-full items-center gap-1.5 rounded border border-edge bg-console px-3 py-2 text-sm text-dim lg:hidden"
      >
        <ChevronRight size={13} className={`transition-transform ${openOnPhone ? 'rotate-90' : ''}`} />
        Pages
        <span className="ml-auto font-mono text-chrome text-faint">{total}</span>
      </button>

      <div className={`${openOnPhone ? 'block' : 'hidden'} mt-3 lg:mt-0 lg:block`}>
        <label className="mb-3 flex items-center gap-1.5 rounded border border-edge bg-console px-2 py-1.5 text-faint">
          <Search size={12} className="shrink-0" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter pages"
            aria-label="Filter pages"
            className="w-full min-w-0 bg-transparent text-body text-fg placeholder:text-faint focus:outline-none"
          />
        </label>
        <button
          type="button"
          onClick={goHome}
          className={`mb-3 block w-full rounded-[3px] px-2 py-1 text-lede transition-colors ${
            current ? 'text-dim hover:bg-console hover:text-fg' : 'bg-console text-amber'
          }`}
        >
          {home.title}
        </button>
        {FOLDERS.map((folder) => {
          const pages = pagesInFolder(folder).filter(
            (p) => !q || p.title.toLowerCase().includes(q) || p.slug.includes(q),
          )
          if (!pages.length) return null
          return (
            <div key={folder} className="mb-3">
              <div className="legend mb-1 px-1">
                <span className="flex-1">{folder}</span>
                <span className="font-mono text-label tracking-normal">{pages.length}</span>
              </div>
              {pages.map((p) => (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => {
                    openPage(p.slug)
                    setOpenOnPhone(false)
                  }}
                  className={`block w-full truncate rounded-[3px] px-2 py-[3.5px] text-lede transition-colors ${
                    p.slug === current ? 'bg-console text-amber' : 'text-dim hover:bg-console hover:text-fg'
                  }`}
                >
                  {p.title}
                </button>
              ))}
            </div>
          )
        })}
      </div>
    </aside>
  )
}

/** Question pages: status, horizon, the working claim and its raw-only evidence ledger. */
function QuestionPanel({ page, openPage }: { page: WikiPage; openPage: (slug: string) => void }) {
  const [cite, setCite] = useState<CiteAnchor | null>(null)
  const sides = [
    { key: 'for' as const, label: 'evidence for', mark: '+', color: 'var(--color-gauge)' },
    { key: 'against' as const, label: 'evidence against', mark: '−', color: 'var(--color-alert)' },
  ]

  return (
    <div className="mb-6 border-l-2 border-amber bg-void/40 py-3 pl-4 pr-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-chrome uppercase tracking-label">
        {page.status && (
          <span style={{ color: STATUS_COLOR[page.status] ?? 'var(--color-faint)' }}>● {page.status}</span>
        )}
        {page.horizon && <span className="text-faint">horizon · {page.horizon}</span>}
      </div>
      {page.hypothesis && (
        <>
          <div className="mt-3 font-mono text-chrome uppercase tracking-label text-amber">Working claim</div>
          <p className="mt-1 text-figure font-semibold leading-snug text-fg">{page.hypothesis}</p>
        </>
      )}
      {sides.map(({ key, label, mark, color }) => {
        const items = page.evidence?.[key] ?? []
        if (!items.length) return null
        return (
          <div key={key} className="mt-3">
            <div className="font-mono text-chrome uppercase tracking-label" style={{ color }}>
              {label} · {items.length}
            </div>
            <ul className="mt-1 space-y-1.5">
              {items.map((item) => (
                <li key={item.raw} className="flex gap-2 text-body leading-relaxed text-dim">
                  <span className="shrink-0 font-mono" style={{ color }}>
                    {mark}
                  </span>
                  <span className="min-w-0">
                    {item.note}
                    <button
                      type="button"
                      onClick={(e) => {
                        const r = e.currentTarget.getBoundingClientRect()
                        setCite({ path: item.raw, x: r.left, y: r.bottom })
                      }}
                      className="rawcite mt-0.5 block break-all text-left"
                    >
                      {item.raw}
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
      {cite && <CitePopover anchor={cite} onClose={() => setCite(null)} onNavigate={openPage} />}
    </div>
  )
}

function PageChip({ slug, openPage }: { slug: string; openPage: (slug: string) => void }) {
  const target = graph.pages[slug]
  if (!target) {
    return (
      <span className="deadlink mr-1 mt-1 inline-block font-mono text-data" title="No wiki page">
        {slug}
      </span>
    )
  }
  return (
    <button
      type="button"
      onClick={() => openPage(slug)}
      className="mr-1 mt-1 inline-flex max-w-full items-center gap-1 rounded-[3px] border border-edge bg-console px-1.5 py-1 text-data text-dim transition-colors hover:border-amber hover:text-amber"
    >
      <ArrowUpRight size={10} className="shrink-0" />
      <span className="truncate">{target.title}</span>
    </button>
  )
}

function ChipGroup({ label, slugs, openPage }: { label: string; slugs: string[]; openPage: (slug: string) => void }) {
  return (
    <div className="mb-2.5">
      <div className="font-mono text-chrome text-faint">{label}</div>
      {slugs.map((s) => (
        <PageChip key={s} slug={s} openPage={openPage} />
      ))}
    </div>
  )
}

function ConnectionsPanel({ page, openPage }: { page: WikiPage; openPage: (slug: string) => void }) {
  const showOnGraph = useAppStore((s) => s.showOnGraph)
  const setView = useAppStore((s) => s.setView)
  const inDecks = decksCiting(page.slug)

  const { outbound, inbound, mentions } = useMemo(() => {
    const outbound = Object.entries(page.edges).filter(([, targets]) => targets.length)
    const linked = new Set(outbound.flatMap(([, targets]) => targets))

    // An inbound edge this page already declares from its side (fed-by for an
    // incoming feeds) is shown once, as the outbound edge.
    const byKey = new Map<string, string[]>()
    const mentions: string[] = []
    for (const b of graph.inbound[page.slug] ?? []) {
      if (b.via === 'mention') continue
      const mirror = INVERSE_OF[b.via]
      if (mirror && page.edges[mirror]?.includes(b.from)) continue
      byKey.set(b.via, [...(byKey.get(b.via) ?? []), b.from])
      linked.add(b.from)
    }
    for (const b of graph.inbound[page.slug] ?? []) {
      if (b.via === 'mention' && !linked.has(b.from)) mentions.push(b.from)
    }
    const byTitle = (a: string, b: string) => graph.pages[a].title.localeCompare(graph.pages[b].title)
    const inbound = [...byKey].map(([key, from]) => [key, from.sort(byTitle)] as const)
    return { outbound, inbound, mentions: mentions.sort(byTitle) }
  }, [page])

  const empty = !outbound.length && !inbound.length && !mentions.length

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => showOnGraph(page.slug)}
        className="inline-flex w-full items-center gap-1.5 rounded border border-edge bg-console px-2.5 py-2 text-body font-medium text-fg transition-colors hover:border-amber hover:text-amber"
      >
        <Network size={13} className="shrink-0 text-amber" />
        Show on graph
      </button>

      {outbound.length > 0 && (
        <section>
          <Legend>Edges</Legend>
          <div className="mt-2">
            {outbound.map(([key, targets]) => (
              <ChipGroup key={key} label={edgeLabel(key)} slugs={targets} openPage={openPage} />
            ))}
          </div>
        </section>
      )}

      {(inbound.length > 0 || mentions.length > 0) && (
        <section>
          <Legend>Connections</Legend>
          <div className="mt-2">
            {inbound.map(([key, from]) => (
              <ChipGroup key={key} label={`${edgeLabel(key)} this`} slugs={from} openPage={openPage} />
            ))}
            {mentions.length > 0 && <ChipGroup label="mentioned by" slugs={mentions} openPage={openPage} />}
          </div>
        </section>
      )}

      {inDecks.length > 0 && (
        <section>
          <Legend>In decks</Legend>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {inDecks.map((d) => (
              <button
                key={d.slug}
                type="button"
                onClick={() => setView('decks')}
                className="inline-flex items-center gap-1.5 rounded-sm border border-edge px-1.5 py-0.5 text-data text-dim transition-colors hover:border-amber hover:text-amber"
              >
                <Presentation size={11} className="text-faint" />
                {d.title}
              </button>
            ))}
          </div>
        </section>
      )}

      {empty && <div className="text-body text-faint">No edges or links yet.</div>}
    </div>
  )
}
