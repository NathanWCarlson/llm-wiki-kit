import { useEffect, useMemo, useState } from 'react'
import { CornerDownRight, MousePointerClick } from 'lucide-react'
import { edgeLabel, graph, stripLinks, TYPES } from '../lib/wiki'
import { typeColor } from '../lib/theme'
import { useAppStore } from '../store/useAppStore'
import { Panel, TypeBadge } from '../components/ui'
import type { EntityType, GraphEdge } from '../types/wiki'

const W = 1100
const H = 720

/** rough glyph width for the label fonts at graph sizes */
const CHAR_W = 0.56
const LABEL_PAD = 5
const LABEL_H = 12

interface Node {
  slug: string
  type: EntityType
  x: number
  y: number
  degree: number
}

interface Box {
  left: number
  right: number
  top: number
  bottom: number
}

/** Deterministic force layout, run once per filter. No animation loop needed at wiki scale. */
function layout(activeTypes: Set<EntityType>): { nodes: Node[]; edges: GraphEdge[] } {
  const pages = Object.values(graph.pages).filter((p) => activeTypes.has(p.type))
  const slugs = new Set(pages.map((p) => p.slug))
  const edges = graph.edges.filter((e) => slugs.has(e.from) && slugs.has(e.to))
  const degree: Record<string, number> = {}
  for (const e of edges) {
    degree[e.from] = (degree[e.from] ?? 0) + 1
    degree[e.to] = (degree[e.to] ?? 0) + 1
  }
  // Golden-angle spiral seed, so the same wiki always lays out the same way.
  const nodes: Node[] = pages.map((p, i) => {
    const a = i * 2.39996
    const r = 40 + 14 * Math.sqrt(i)
    return {
      slug: p.slug,
      type: p.type,
      x: W / 2 + r * Math.cos(a),
      y: H / 2 + r * Math.sin(a) * 0.72,
      degree: degree[p.slug] ?? 0,
    }
  })
  const bySlug = new Map(nodes.map((n) => [n.slug, n]))

  for (let iter = 0; iter < 320; iter++) {
    const t = 1 - iter / 320
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]
        const b = nodes[j]
        let dx = a.x - b.x
        let dy = a.y - b.y
        const d2 = Math.max(dx * dx + dy * dy, 40)
        const f = (11000 / d2) * t
        const d = Math.sqrt(d2)
        dx /= d
        dy /= d
        a.x += dx * f
        a.y += dy * f
        b.x -= dx * f
        b.y -= dy * f
      }
    }
    for (const e of edges) {
      const a = bySlug.get(e.from)!
      const b = bySlug.get(e.to)!
      const dx = b.x - a.x
      const dy = b.y - a.y
      const d = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
      const f = ((d - 165) / d) * 0.028 * t
      a.x += dx * f
      a.y += dy * f
      b.x -= dx * f
      b.y -= dy * f
    }
    for (const n of nodes) {
      n.x += (W / 2 - n.x) * 0.006 * t
      n.y += (H / 2 - n.y) * 0.011 * t
      n.x = Math.min(W - 90, Math.max(90, n.x))
      n.y = Math.min(H - 46, Math.max(34, n.y))
    }
  }
  return { nodes, edges }
}

function nodeRadius(degree: number) {
  return 6 + Math.min(degree, 14) * 0.9
}

function labelText(slug: string): string {
  const title = graph.pages[slug]?.title ?? slug
  return title.length > 26 ? slug : title
}

function labelBox(n: Node, text: string, fontSize: number): Box {
  const midY = n.y + nodeRadius(n.degree) + 12
  const halfW = (text.length * fontSize * CHAR_W) / 2 + LABEL_PAD
  return { left: n.x - halfW, right: n.x + halfW, top: midY - LABEL_H / 2, bottom: midY + LABEL_H / 2 }
}

function overlaps(a: Box, b: Box): boolean {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom)
}

/**
 * Which labels to draw: the focus and its neighbours first, then everything else
 * by degree, dropping any label that would collide with one already placed.
 */
function visibleLabels(nodes: Node[], near: Set<string> | null, focus: string | null): Set<string> {
  const rank = (n: Node) => (n.slug === focus ? 2 : near?.has(n.slug) ? 1 : 0)
  const ordered = [...nodes].sort(
    (a, b) => rank(b) - rank(a) || b.degree - a.degree || a.slug.localeCompare(b.slug),
  )
  const placed: Box[] = []
  const out = new Set<string>()
  for (const n of ordered) {
    const box = labelBox(n, labelText(n.slug), n.slug === focus ? 11.5 : 9.5)
    if (n.slug !== focus && placed.some((p) => overlaps(p, box))) continue
    placed.push(box)
    out.add(n.slug)
  }
  return out
}

/** Put the card in the corner away from the node so it never hides the neighbourhood. */
function cardStyle(x: number, y: number): React.CSSProperties {
  const inset = 12
  return {
    position: 'absolute',
    zIndex: 10,
    width: 'min(22rem, calc(100% - 1.5rem))',
    ...(x >= W / 2 ? { left: inset } : { right: inset }),
    ...(y >= H / 2 ? { top: inset } : { bottom: inset }),
  }
}

function FocusCard({ slug, x, y }: { slug: string; x: number; y: number }) {
  const page = graph.pages[slug]
  if (!page) return null
  const inbound = new Set((graph.inbound[slug] ?? []).map((b) => b.from)).size
  const edgeLines = Object.entries(page.edges).map(
    ([key, targets]) => `${edgeLabel(key)}: ${targets.map((t) => graph.pages[t]?.title ?? t).join(', ')}`,
  )

  return (
    <div
      className="graph-hover-card pointer-events-none rounded border border-edge bg-console/95 p-3.5 shadow-2xl backdrop-blur"
      style={cardStyle(x, y)}
    >
      <div className="mb-1.5 flex min-w-0 items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-fg">{page.title}</span>
        <TypeBadge type={page.type} />
      </div>
      <p className="mb-2.5 line-clamp-3 text-xs leading-relaxed text-dim">{stripLinks(page.summary)}</p>
      {edgeLines.length > 0 && (
        <div className="mb-2.5 space-y-1">
          {edgeLines.map((line) => (
            <div key={line} className="truncate font-mono text-data leading-snug text-dim">
              {line}
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 border-t border-edge pt-2 font-mono text-chrome text-faint">
        <CornerDownRight size={11} />
        {inbound} inbound
        <span className="ml-auto inline-flex items-center gap-1 text-amber">
          <MousePointerClick size={11} />
          click to open
        </span>
      </div>
    </div>
  )
}

// Only types with pages get a legend chip; an empty schema folder is not a filter.
const PRESENT_TYPES = TYPES.filter((t) => Object.values(graph.pages).some((p) => p.type === t))

export function GraphView() {
  const openPage = useAppStore((s) => s.openPage)
  const graphFocus = useAppStore((s) => s.graphFocus)
  const clearGraphFocus = useAppStore((s) => s.clearGraphFocus)
  const [active, setActive] = useState<Set<EntityType>>(() => new Set(TYPES))
  const [hover, setHover] = useState<string | null>(null)
  // "Show on graph" from the reader arrives as graphFocus: hold that node.
  const [held, setHeld] = useState<string | null>(graphFocus)
  const [entered, setEntered] = useState(false)

  const { nodes, edges } = useMemo(() => layout(active), [active])
  const bySlug = useMemo(() => new Map(nodes.map((n) => [n.slug, n])), [nodes])

  useEffect(() => {
    if (graphFocus) clearGraphFocus()
  }, [graphFocus, clearGraphFocus])

  // Entrance: edges and nodes fade in on the frame after mount.
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const focus = hover ?? (held && bySlug.has(held) ? held : null)

  const near = useMemo(() => {
    if (!focus) return null
    const set = new Set([focus])
    for (const e of edges) {
      if (e.from === focus) set.add(e.to)
      if (e.to === focus) set.add(e.from)
    }
    return set
  }, [focus, edges])

  const labels = useMemo(() => visibleLabels(nodes, near, focus), [nodes, near, focus])
  const focusNode = focus ? bySlug.get(focus) : undefined

  const toggle = (t: EntityType) =>
    setActive((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })

  return (
    <div className="rise space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {PRESENT_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => toggle(t)}
            aria-pressed={active.has(t)}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-opacity ${
              active.has(t) ? 'border-edge bg-console' : 'border-transparent opacity-40'
            }`}
            style={{ color: typeColor(t) }}
          >
            <span className="size-2 rounded-full bg-current" />
            {t}
          </button>
        ))}
        <span className="ml-auto font-mono text-chrome text-faint">
          {nodes.length} pages · {edges.length} edges · hover to peek · click to open
        </span>
      </div>
      <Panel className="relative overflow-hidden">
        {focus && focusNode && <FocusCard slug={focus} x={focusNode.x} y={focusNode.y} />}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className={`graph-canvas block h-auto w-full ${entered ? 'graph-canvas--in' : ''}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setHeld(null)
          }}
          role="img"
          aria-label="Graph of typed edges between wiki pages"
        >
          <defs>
            <filter id="graph-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {edges.map((e, i) => {
            const a = bySlug.get(e.from)!
            const b = bySlug.get(e.to)!
            const dim = near && !(near.has(e.from) && near.has(e.to))
            const lit = focus && (e.from === focus || e.to === focus)
            return (
              <line
                key={`${e.from}-${e.key}-${e.to}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                className="graph-edge"
                stroke={lit ? typeColor(a.type) : 'var(--color-edge)'}
                strokeOpacity={dim ? 0.12 : lit ? 0.95 : 0.8}
                strokeWidth={lit ? 1.75 : 1}
                style={{ transitionDelay: entered ? `${Math.min(i, 40) * 8}ms` : '0ms' }}
              >
                <title>{`${graph.pages[e.from].title} ${edgeLabel(e.key)} ${graph.pages[e.to].title}`}</title>
              </line>
            )
          })}
          {nodes.map((n, i) => {
            const hot = focus === n.slug
            const r = nodeRadius(n.degree)
            const scale = hot ? 1.35 : near?.has(n.slug) ? 1.12 : 1
            return (
              <g
                key={n.slug}
                className="graph-node cursor-pointer"
                style={{
                  transform: `translate(${n.x}px, ${n.y}px) scale(${scale})`,
                  opacity: near && !near.has(n.slug) ? 0.2 : 1,
                  transitionDelay: entered ? `${40 + Math.min(i, 46) * 12}ms` : '0ms',
                }}
                onMouseEnter={() => setHover(n.slug)}
                onMouseLeave={() => setHover(null)}
                onClick={() => openPage(n.slug)}
              >
                {hot && (
                  <circle r={r + 6} fill="none" stroke={typeColor(n.type)} strokeOpacity={0.35} className="graph-ring" />
                )}
                {/* a larger transparent target so small nodes are tappable */}
                <circle r={Math.max(r, 14)} fill="transparent" />
                <circle
                  r={r}
                  fill={typeColor(n.type)}
                  fillOpacity={hot ? 1 : 0.85}
                  stroke="var(--color-console)"
                  strokeWidth={1.5}
                  filter={hot ? 'url(#graph-glow)' : undefined}
                />
              </g>
            )
          })}
          {/* Labels paint after every node: SVG z-order is document order, so a
              label inside its node group would sit under later circles. */}
          {nodes.map((n) => {
            if (!labels.has(n.slug)) return null
            const hot = focus === n.slug
            const scale = hot ? 1.35 : near?.has(n.slug) ? 1.12 : 1
            return (
              <text
                key={`label-${n.slug}`}
                x={n.x}
                y={n.y + nodeRadius(n.degree) * scale + 12}
                textAnchor="middle"
                className="graph-label pointer-events-none select-none"
                opacity={near && !near.has(n.slug) ? 0.2 : 1}
                fill={hot ? 'var(--color-fg)' : 'var(--color-faint)'}
                fontSize={hot ? 11.5 : 9.5}
                fontWeight={hot ? 600 : 400}
              >
                {labelText(n.slug)}
              </text>
            )
          })}
        </svg>
      </Panel>
    </div>
  )
}
