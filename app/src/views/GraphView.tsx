import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CornerDownRight, Maximize2, MousePointerClick, ZoomIn, ZoomOut } from 'lucide-react'
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
/** fx, fy: the node's position as a fraction of the visible area, so the card
 * sits in the opposite corner whatever the zoom. */
function cardStyle(fx: number, fy: number): React.CSSProperties {
  const inset = 12
  return {
    position: 'absolute',
    zIndex: 10,
    width: 'min(22rem, calc(100% - 1.5rem))',
    ...(fx >= 0.5 ? { left: inset } : { right: inset }),
    ...(fy >= 0.5 ? { top: inset } : { bottom: inset }),
  }
}

interface ViewBox {
  x: number
  y: number
  w: number
}

const FULL: ViewBox = { x: 0, y: 0, w: W }
const MIN_W = W / 6

/** Zoom around a point given in graph units, keeping that point under the cursor. */
function zoomAt(vb: ViewBox, factor: number, px: number, py: number): ViewBox {
  const w = Math.min(W, Math.max(MIN_W, vb.w * factor))
  const k = w / vb.w
  return clampView({ x: px - (px - vb.x) * k, y: py - (py - vb.y) * k, w })
}

/** Keep at least half the view over the graph so it can't be panned away. */
function clampView(vb: ViewBox): ViewBox {
  const h = (vb.w * H) / W
  return {
    w: vb.w,
    x: Math.min(W - vb.w / 2, Math.max(-vb.w / 2, vb.x)),
    y: Math.min(H - h / 2, Math.max(-h / 2, vb.y)),
  }
}

/**
 * Pinch or ⌘/Ctrl+wheel zooms; plain wheel scrolls the page as usual. Dragging
 * pans. Pointer capture starts only once a drag passes a few pixels, so a plain
 * click still reaches the node under it; `dragged` lets click handlers ignore
 * the click that ends a pan.
 */
function usePanZoom() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [vb, setVb] = useState<ViewBox>(FULL)
  const dragged = useRef(false)

  const toGraph = useCallback((clientX: number, clientY: number, view: ViewBox) => {
    const r = svgRef.current!.getBoundingClientRect()
    return { x: view.x + ((clientX - r.left) / r.width) * view.w, y: view.y + ((clientY - r.top) / r.height) * ((view.w * H) / W) }
  }, [])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      setVb((v) => {
        const p = toGraph(e.clientX, e.clientY, v)
        // Mouse wheels send ~100 per notch, trackpads a few: cap one step at ~1.6x.
        return zoomAt(v, Math.exp(Math.max(-50, Math.min(50, e.deltaY)) * 0.01), p.x, p.y)
      })
    }
    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => svg.removeEventListener('wheel', onWheel)
  }, [toGraph])

  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const start = useRef<{ x: number; y: number; vb: ViewBox; dist: number } | null>(null)

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const pts = [...pointers.current.values()]
    const mid = pts.reduce((a, p) => ({ x: a.x + p.x / pts.length, y: a.y + p.y / pts.length }), { x: 0, y: 0 })
    const dist = pts.length > 1 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0
    start.current = { ...mid, vb, dist }
    dragged.current = false
  }

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!start.current || !pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const pts = [...pointers.current.values()]
    const mid = pts.reduce((a, p) => ({ x: a.x + p.x / pts.length, y: a.y + p.y / pts.length }), { x: 0, y: 0 })
    const s = start.current
    if (!dragged.current && Math.hypot(mid.x - s.x, mid.y - s.y) < 4 && pts.length < 2) return
    if (!dragged.current) {
      dragged.current = true
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    const r = e.currentTarget.getBoundingClientRect()
    const unit = s.vb.w / r.width
    let next: ViewBox = { ...s.vb, x: s.vb.x - (mid.x - s.x) * unit, y: s.vb.y - (mid.y - s.y) * unit }
    if (pts.length > 1 && s.dist > 0) {
      const p = toGraph(s.x, s.y, s.vb)
      next = zoomAt(next, s.dist / Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y), p.x, p.y)
    }
    setVb(clampView(next))
  }

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId)
    start.current = null
    if (pointers.current.size) {
      // One finger left after a pinch: restart the pan from where it is.
      const [p] = pointers.current.values()
      start.current = { x: p.x, y: p.y, vb, dist: 0 }
    }
  }

  const zoomBy = (factor: number) =>
    setVb((v) => zoomAt(v, factor, v.x + v.w / 2, v.y + (v.w * H) / W / 2))

  return {
    svgRef,
    vb,
    dragged,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
    zoomIn: () => zoomBy(1 / 1.4),
    zoomOut: () => zoomBy(1.4),
    reset: () => setVb(FULL),
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
  const { svgRef, vb, dragged, handlers, zoomIn, zoomOut, reset } = usePanZoom()
  const zoom = W / vb.w

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
          {nodes.length} pages · {edges.length} edges · click to open · drag to pan · pinch or ⌘-scroll to zoom
        </span>
      </div>
      <Panel className="relative overflow-hidden">
        {focus && focusNode && (
          <FocusCard slug={focus} x={(focusNode.x - vb.x) / vb.w} y={(focusNode.y - vb.y) / ((vb.w * H) / W)} />
        )}
        <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1 rounded border border-edge bg-console/95 p-0.5 backdrop-blur">
          <button type="button" onClick={zoomOut} disabled={vb.w >= W} aria-label="Zoom out" className="rounded p-1.5 text-faint transition-colors hover:text-amber disabled:opacity-30">
            <ZoomOut size={14} />
          </button>
          <span className="w-10 text-center font-mono text-chrome tabular-nums text-faint">{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={zoomIn} disabled={vb.w <= MIN_W} aria-label="Zoom in" className="rounded p-1.5 text-faint transition-colors hover:text-amber disabled:opacity-30">
            <ZoomIn size={14} />
          </button>
          <button type="button" onClick={reset} disabled={vb === FULL} aria-label="Fit the whole graph" className="rounded p-1.5 text-faint transition-colors hover:text-amber disabled:opacity-30">
            <Maximize2 size={14} />
          </button>
        </div>
        <svg
          ref={svgRef}
          viewBox={`${vb.x} ${vb.y} ${vb.w} ${(vb.w * H) / W}`}
          className={`graph-canvas block h-auto w-full touch-none cursor-grab active:cursor-grabbing ${entered ? 'graph-canvas--in' : ''}`}
          {...handlers}
          onClick={(e) => {
            if (!dragged.current && e.target === e.currentTarget) setHeld(null)
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
                onClick={() => {
                  if (!dragged.current) openPage(n.slug)
                }}
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
