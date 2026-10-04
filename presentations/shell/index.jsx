// The shared deck engine. A deck imports from here and never copies these
// files; fix the shell once and every deck picks it up on its next build.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import DeckApp from './DeckApp.jsx'
import './base.css'

export { default as DeckApp, sourcesSlide } from './DeckApp.jsx'
export { Cite, Slide } from './kit.jsx'
export { applyTheme, resolveTheme, toggleTheme } from './theme.js'

export function mountDeck({ slides, meta }) {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <DeckApp slides={slides} meta={meta} />
    </StrictMode>,
  )
}
