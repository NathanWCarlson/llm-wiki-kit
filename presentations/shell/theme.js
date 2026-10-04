// Light by default, like the reader. Resolve order:
//   1. ?theme= or #theme=light|dark (the reader passes this when it opens a deck)
//   2. the deck's own saved choice
//   3. the reader's saved theme (its zustand store in localStorage)
//   4. light
export const DECK_THEME_KEY = 'llm-wiki-deck-theme'

// The reader opens decks as blob: URLs, which can carry a #fragment but not a
// ?query, so a parameter may arrive in either place.
export function urlParam(name) {
  try {
    const { search, hash } = window.location
    return new URLSearchParams(search).get(name) ?? new URLSearchParams(hash.slice(1)).get(name)
  } catch {
    return null
  }
}
export const READER_STORE_KEY = 'llm-wiki-reader'

const valid = (t) => t === 'light' || t === 'dark'

export function resolveTheme() {
  const q = urlParam('theme')
  if (valid(q)) return q
  try {
    const saved = localStorage.getItem(DECK_THEME_KEY)
    if (valid(saved)) return saved
  } catch {
    // storage blocked
  }
  try {
    const t = JSON.parse(localStorage.getItem(READER_STORE_KEY) ?? 'null')?.state?.theme
    if (valid(t)) return t
  } catch {
    // storage blocked or not JSON
  }
  return 'light'
}

export function applyTheme(theme) {
  const next = theme === 'dark' ? 'dark' : 'light'
  document.documentElement.dataset.theme = next
  document.documentElement.style.colorScheme = next
  try {
    localStorage.setItem(DECK_THEME_KEY, next)
  } catch {
    // storage blocked
  }
  return next
}

export function toggleTheme(current) {
  return applyTheme(current === 'light' ? 'dark' : 'light')
}
