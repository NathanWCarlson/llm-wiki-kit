import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Home, Network, Search } from 'lucide-react'
import { searchPages, type SearchHit } from '../lib/search'
import { useAppStore } from '../store/useAppStore'
import { TypeBadge } from './ui'

type Jump = { id: 'home' | 'graph'; label: string; blurb: string; icon: typeof Home }

type Row = { kind: 'page'; hit: SearchHit } | { kind: 'jump'; jump: Jump }

const JUMPS: Jump[] = [
  { id: 'home', label: 'Home', blurb: 'The wiki index', icon: Home },
  { id: 'graph', label: 'Graph', blurb: 'Typed edges between pages', icon: Network },
]

function jumpMatches(jump: Jump, query: string): boolean {
  const hay = `${jump.label} ${jump.blurb}`.toLowerCase()
  return query.toLowerCase().split(/\s+/).filter(Boolean).every((t) => hay.includes(t))
}

export function CommandPalette() {
  const openPage = useAppStore((s) => s.openPage)
  const goHome = useAppStore((s) => s.goHome)
  const setView = useAppStore((s) => s.setView)
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const rows: Row[] = useMemo(
    () => [
      ...JUMPS.filter((j) => jumpMatches(j, q)).map((jump) => ({ kind: 'jump' as const, jump })),
      ...searchPages(q).map((hit) => ({ kind: 'page' as const, hit })),
    ],
    [q],
  )

  const show = () => {
    setOpen(true)
    setQ('')
    setCursor(0)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
        setQ('')
        setCursor(0)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const activate = (row: Row) => {
    if (row.kind === 'page') openPage(row.hit.page.slug)
    else if (row.jump.id === 'home') goHome()
    else setView('graph')
    setOpen(false)
  }

  const overlay =
    open &&
    createPortal(
      <div
        className="palette-scrim fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]"
        onClick={() => setOpen(false)}
        role="presentation"
      >
        <div
          className="w-full max-w-xl overflow-hidden rounded border border-edge bg-console shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
          <div className="flex items-center gap-2 border-b border-edge px-4">
            <Search size={15} className="shrink-0 text-faint" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setCursor(0)
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setCursor((c) => Math.min(c + 1, rows.length - 1))
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setCursor((c) => Math.max(c - 1, 0))
                }
                if (e.key === 'Enter' && rows[cursor]) activate(rows[cursor])
              }}
              placeholder="Search the wiki…"
              className="palette-input w-full bg-transparent py-3.5 text-sm text-fg placeholder:text-faint"
            />
          </div>
          <div className="max-h-[50vh] overflow-y-auto p-2">
            {q.trim() && rows.length === 0 && (
              <div className="px-3 py-6 text-center text-sm text-faint">
                Nothing in the wiki matches. If it should, ingest a source.
              </div>
            )}
            {rows.map((row, idx) => {
              const active = idx === cursor ? 'bg-edge/40' : ''
              if (row.kind === 'jump') {
                const Icon = row.jump.icon
                return (
                  <button
                    key={`jump-${row.jump.id}`}
                    type="button"
                    onClick={() => activate(row)}
                    onMouseEnter={() => setCursor(idx)}
                    className={`flex w-full items-center gap-2 rounded px-3 py-2 ${active}`}
                  >
                    <Icon size={13} className="shrink-0 text-amber" />
                    <span className="text-sm font-semibold text-fg">{row.jump.label}</span>
                    <span className="truncate text-xs text-faint">{row.jump.blurb}</span>
                  </button>
                )
              }
              const { page, snippet } = row.hit
              return (
                <button
                  key={page.slug}
                  type="button"
                  onClick={() => activate(row)}
                  onMouseEnter={() => setCursor(idx)}
                  className={`flex w-full flex-col gap-0.5 rounded px-3 py-2 ${active}`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-semibold text-fg">{page.title}</span>
                    <TypeBadge type={page.type} />
                  </span>
                  <span className="line-clamp-2 text-xs leading-relaxed text-faint">
                    {snippet.map((s, i) =>
                      s.match ? (
                        <mark key={i} className="palette-hit bg-transparent">
                          {s.text}
                        </mark>
                      ) : (
                        <span key={i}>{s.text}</span>
                      ),
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>,
      document.body,
    )

  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-label="Search"
        className="flex items-center gap-2 rounded border border-edge bg-console/50 px-2.5 py-1.5 text-xs text-faint transition-colors hover:text-fg"
      >
        <Search size={13} />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded border border-edge px-1 font-mono text-chrome sm:inline">⌘K</kbd>
      </button>
      {overlay}
    </>
  )
}
