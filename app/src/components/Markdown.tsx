import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { RAW_META } from 'virtual:raw-meta'
import { graph } from '../lib/wiki'
import { citedBy, renderMarkdown } from '../lib/wikiLinks'

export interface CiteAnchor {
  path: string
  x: number
  y: number
}

function anchorFrom(el: Element, path: string): CiteAnchor {
  const r = el.getBoundingClientRect()
  return { path, x: r.left, y: r.bottom }
}

function fmtWords(n: number): string {
  return n >= 1000 ? `~${(n / 1000).toFixed(1)}k words` : `~${n} words`
}

/** Raw source header only: title, source, dates, length. The body is never in the bundle. */
export function CitePopover({
  anchor,
  onClose,
  onNavigate,
}: {
  anchor: CiteAnchor
  onClose: () => void
  onNavigate: (slug: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const meta = RAW_META[anchor.path]
  const citing = citedBy(anchor.path)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  // Measure after mount, then sit below the marker, flipping above when there is
  // no room. Scrolling closes it, so no part of it may need scrolling to reach.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const h = el.offsetHeight
    const w = el.offsetWidth
    let top = anchor.y + 8
    if (top + h > window.innerHeight - 8) top = anchor.y - h - 24
    top = Math.max(8, Math.min(top, window.innerHeight - h - 8))
    const left = Math.max(8, Math.min(anchor.x, window.innerWidth - w - 8))
    setPos({ top, left })
  }, [anchor])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const onAway = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onAway)
    window.addEventListener('scroll', onClose, true)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onAway)
      window.removeEventListener('scroll', onClose, true)
    }
  }, [onClose])

  const rows: [string, string | undefined][] = [
    ['source', meta?.fields.source],
    ['collected', meta?.fields.collected],
    ['published', meta?.fields.published],
    ['length', meta ? fmtWords(meta.words) : undefined],
  ]

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-label="Source"
      className="fixed z-40 w-[min(26rem,calc(100vw-1rem))] rounded border border-edge bg-console px-3.5 py-3 shadow-[0_6px_24px_rgb(0_0_0/0.3)]"
      style={{ top: pos?.top ?? anchor.y + 8, left: pos?.left ?? 8, visibility: pos ? 'visible' : 'hidden' }}
    >
      <div className="legend">Source</div>
      {meta ? (
        <>
          {meta.title && <div className="mt-2 text-lede font-semibold leading-snug text-fg">{meta.title}</div>}
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-data">
            {rows.map(([k, v]) =>
              v ? (
                <div key={k} className="contents">
                  <dt className="font-mono text-faint">{k}</dt>
                  <dd className="text-dim">{v}</dd>
                </div>
              ) : null,
            )}
          </dl>
        </>
      ) : (
        <div className="mt-2 text-data text-alert">No raw file at this path.</div>
      )}
      {citing.length > 0 && (
        <div className="mt-2 border-t border-edge pt-2">
          <div className="legend">Cited by {citing.length}</div>
          <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
            {citing.map((slug) => (
              <li key={slug}>
                <button
                  type="button"
                  className="text-data text-amber hover:underline"
                  onClick={() => {
                    onClose()
                    onNavigate(slug)
                  }}
                >
                  {graph.pages[slug]?.title ?? slug}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-2 break-all border-t border-edge pt-2 font-mono text-chrome text-faint">{anchor.path}</div>
    </div>,
    document.body,
  )
}

export function Markdown({
  md,
  path,
  onNavigate,
}: {
  md: string
  /** repo-relative path of the file, so relative links resolve */
  path: string
  onNavigate: (slug: string) => void
}) {
  const [cite, setCite] = useState<CiteAnchor | null>(null)
  const html = useMemo(() => renderMarkdown(md, path), [md, path])

  const citeFrom = (target: EventTarget) => {
    const el = (target as HTMLElement).closest('.rawcite[data-raw]')
    return el ? anchorFrom(el, el.getAttribute('data-raw')!) : null
  }

  // Page navigation unmounts this component, which drops the popover with it.
  return (
    <>
      <div
        className="wiki-prose"
        onClick={(e) => {
          const a = (e.target as HTMLElement).closest('a[data-slug]')
          if (a) {
            e.preventDefault()
            onNavigate(a.getAttribute('data-slug')!)
            return
          }
          const c = citeFrom(e.target)
          if (c) setCite(c)
        }}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return
          const c = citeFrom(e.target)
          if (c) {
            e.preventDefault()
            setCite(c)
          }
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {cite && <CitePopover anchor={cite} onClose={() => setCite(null)} onNavigate={onNavigate} />}
    </>
  )
}
