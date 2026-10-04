import { mountDeck, Slide, sourcesSlide } from '../shell/index.jsx'
import './deck.css'

// Keep sources in step with deck.md. Titles are for the Sources slide.
const DECK_META = {
  title: 'Deck title',
  asOf: '2026-10-04',
  sources: [{ slug: 'llm-wiki-kit', title: 'llm-wiki-kit' }],
}

const SLIDES = [
  // 1. Title
  () => (
    <div className="slide-content anim">
      <p className="wordmark">Deck</p>
      <h1>{DECK_META.title}</h1>
      <p className="subtitle">The one sentence the room should leave with.</p>
    </div>
  ),
  // 2. A claim slide: the title is an assertion, the body is its evidence
  () => (
    <Slide
      legend="Section"
      title="Each title states a claim the wiki backs"
      lede="Read only the titles in order. They should make the whole argument."
      cite={['llm-wiki-kit']}
    >
      <ul className="steps" data-cascade>
        <li>Items in a data-cascade container reveal one after another.</li>
        <li>Cite the wiki slugs each slide draws from.</li>
      </ul>
    </Slide>
  ),
  // 3. Sources (appendix)
  sourcesSlide(DECK_META),
]

mountDeck({ slides: SLIDES, meta: DECK_META })
