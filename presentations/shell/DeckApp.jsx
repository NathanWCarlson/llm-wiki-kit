// Runs a deck: arrow keys, Space and click change slides, T flips the theme,
// Z cycles the zoom, and the browser's print command lays out every slide as
// its own 16:9 page.
//
// slides: functions returning a .slide-content.anim block, or
//   { render, appendix: true } for reference slides after the close.
// meta: { title, asOf, sources: [{ slug, title }] }
import { useCallback, useEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import { applyTheme, READER_STORE_KEY, resolveTheme, toggleTheme, urlParam } from './theme.js'

// Same steps as the reader's UI_SCALES in app/src/store/useAppStore.ts.
const SCALE_STEPS = [1, 1.15, 1.3]
const SCALE_KEY = 'llm-wiki-deck-scale'

// Same order as the theme: ?scale=, the deck's saved step, the reader's saved
// uiScale, then 1.
function readScale() {
  const candidates = [
    () => urlParam('scale'),
    () => localStorage.getItem(SCALE_KEY),
    () => JSON.parse(localStorage.getItem(READER_STORE_KEY) ?? 'null')?.state?.uiScale,
  ]
  for (const read of candidates) {
    try {
      const v = Number.parseFloat(read() ?? '')
      if (SCALE_STEPS.includes(v)) return v
    } catch {
      // storage blocked or not JSON
    }
  }
  return 1
}

const nextScale = (s) => SCALE_STEPS[(SCALE_STEPS.indexOf(s) + 1) % SCALE_STEPS.length]

// The closing appendix that lists every wiki page the deck draws from.
export function sourcesSlide(meta, { intro } = {}) {
  return {
    appendix: true,
    render: () => (
      <div className="slide-content anim">
        <p className="legend">Sources</p>
        <h2>From the wiki</h2>
        <p className="subtitle">
          {intro ??
            'Every claim on these slides comes from these wiki pages. The wiki is the source of truth. This deck is a rendering of it.'}
        </p>
        <ul className="sources-list" data-cascade>
          {meta.sources.map((s) => (
            <li key={s.slug}>
              <span className="src-title">{s.title}</span>
              <span className="src-slug">{s.slug}</span>
            </li>
          ))}
        </ul>
        <p className="as-of">Claims as of {meta.asOf}</p>
      </div>
    ),
  }
}

function Nav({ cur, deck, go, jump }) {
  return (
    <nav className="deck-nav">
      <button type="button" onClick={() => go(-1)} disabled={cur === 0} aria-label="Previous slide">
        ←
      </button>
      <div className="dots">
        {deck.map((s, i) => (
          <button
            key={i}
            type="button"
            className={`dot${i === cur ? ' on' : ''}${s.appendix ? ' appendix' : ''}`}
            onClick={() => jump(i)}
            aria-label={`Slide ${i + 1}${s.appendix ? ' (appendix)' : ''}`}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={() => go(1)}
        disabled={cur === deck.length - 1}
        aria-label="Next slide"
      >
        →
      </button>
      <span className="slide-number">
        {cur + 1} / {deck.length}
      </span>
    </nav>
  )
}

export default function DeckApp({ slides, meta }) {
  const deck = useMemo(
    () => slides.map((s) => (typeof s === 'function' ? { render: s, appendix: false } : { appendix: false, ...s })),
    [slides],
  )

  const [cur, setCur] = useState(0)
  const [printing, setPrinting] = useState(false)
  const [theme, setTheme] = useState(() => applyTheme(resolveTheme()))
  const [scale, setScale] = useState(readScale)

  const jump = useCallback((i) => setCur(Math.max(0, Math.min(deck.length - 1, i))), [deck.length])
  const go = useCallback(
    (d) => setCur((c) => Math.max(0, Math.min(deck.length - 1, c + d))),
    [deck.length],
  )

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.target.closest?.('input, textarea')) return
      const key = e.key.toLowerCase()
      if (key === 'arrowright' || key === ' ' || key === 'pagedown') go(1)
      else if (key === 'arrowleft' || key === 'pageup') go(-1)
      else if (key === 'home') jump(0)
      else if (key === 'end') jump(deck.length - 1)
      else if (key === 't') setTheme((t) => toggleTheme(t))
      else if (key === 'z') setScale(nextScale)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, jump, deck.length])

  // Zoom scales the slide body with transform, not CSS zoom: zoom grows from
  // the top-left corner and pushes centered content down and right. The chrome
  // stays at its size; only the slide grows for a far-off screen.
  useEffect(() => {
    document.documentElement.style.setProperty('--deck-scale', String(scale))
    try {
      localStorage.setItem(SCALE_KEY, String(scale))
    } catch {
      // storage blocked
    }
  }, [scale])

  // Click advances. The left part of the screen goes back. Chrome and links are left alone.
  useEffect(() => {
    const onClick = (e) => {
      if (e.button !== 0) return
      if (e.target.closest('a, button, input, textarea, nav.deck-nav')) return
      go(e.clientX / window.innerWidth < 0.28 ? -1 : 1)
    }
    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  }, [go])

  // Print renders every slide. flushSync so the pages exist before the print engine looks.
  useEffect(() => {
    const before = () => flushSync(() => setPrinting(true))
    const after = () => setPrinting(false)
    window.addEventListener('beforeprint', before)
    window.addEventListener('afterprint', after)
    return () => {
      window.removeEventListener('beforeprint', before)
      window.removeEventListener('afterprint', after)
    }
  }, [])

  // Progress fills on the last main slide; the appendix does not extend it.
  const lastMain = deck.reduce((m, s, i) => (s.appendix ? m : i), 0)
  const progress = lastMain === 0 ? 100 : (Math.min(cur, lastMain) / lastMain) * 100
  const themeLabel = theme === 'dark' ? 'Switch to light theme (T)' : 'Switch to dark theme (T)'

  return (
    <>
      <div className="progress-track">
        <div className="progress" style={{ width: `${progress}%` }} />
      </div>
      <button
        type="button"
        className={`scale-toggle${scale !== 1 ? ' active' : ''}`}
        onClick={() => setScale(nextScale)}
        title={`Zoom ${scale}x, click to change (Z)`}
        aria-label={`Zoom ${scale}x`}
      >
        ⛶{scale !== 1 && <span className="scale-label">{scale}×</span>}
      </button>
      <button
        type="button"
        className="theme-toggle"
        onClick={() => setTheme((t) => toggleTheme(t))}
        title={themeLabel}
        aria-label={themeLabel}
      >
        {theme === 'dark' ? '☀' : '☾'}
      </button>
      {cur > 0 && !printing && <div className="watermark">{meta.title}</div>}
      {deck.map((s, i) => {
        const Render = s.render
        const active = i === cur
        return (
          <section
            key={i}
            className={`slide${active ? ' active' : ''}${s.appendix ? ' appendix' : ''}`}
            aria-hidden={!active && !printing}
          >
            {(printing || active) && <Render />}
          </section>
        )
      })}
      <Nav cur={cur} deck={deck} go={go} jump={jump} />
    </>
  )
}
