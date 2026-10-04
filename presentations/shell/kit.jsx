// Pieces a slide is built from. Layout primitives that are only CSS
// (.cards, .steps, .ledger, .layers, .code) live in base.css.

// The wiki pages a slide's claims come from, as a small source line.
// Pass wiki slugs; other strings (a doc path) show as given.
export function Cite({ from }) {
  return (
    <p className="cite">
      {from.map((s) => (
        <span key={s}>{s}</span>
      ))}
    </p>
  )
}

// One slide: legend label, an assertion for a title, an optional lede, the
// body, and the source line. Children join the reveal cascade in order.
export function Slide({ legend, title, lede, cite, wide = false, children }) {
  return (
    <div className={`slide-content anim${wide ? ' wide' : ''}`}>
      {legend && <p className="legend">{legend}</p>}
      {title && <h2>{title}</h2>}
      {lede && <p className="subtitle">{lede}</p>}
      {children}
      {cite && <Cite from={cite} />}
    </div>
  )
}
