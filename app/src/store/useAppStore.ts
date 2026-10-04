import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PrimaryView = 'reader' | 'graph' | 'decks'
export type Theme = 'light' | 'dark'

/** Presentation scale steps for projectors and screen shares. */
export const UI_SCALES = [1, 1.15, 1.3] as const

interface AppState {
  view: PrimaryView
  /** null is the home page, wiki/index.md */
  selected: string | null
  graphFocus: string | null
  theme: Theme
  uiScale: number
  setView: (view: PrimaryView) => void
  openPage: (slug: string) => void
  goHome: () => void
  showOnGraph: (slug: string) => void
  clearGraphFocus: () => void
  toggleTheme: () => void
  cycleScale: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      view: 'reader',
      selected: null,
      graphFocus: null,
      theme: 'light',
      uiScale: 1,
      setView: (view) => set({ view }),
      openPage: (slug) => set({ view: 'reader', selected: slug }),
      goHome: () => set({ view: 'reader', selected: null }),
      showOnGraph: (slug) => set({ view: 'graph', graphFocus: slug }),
      clearGraphFocus: () => set({ graphFocus: null }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      cycleScale: () =>
        set((s) => {
          const i = (UI_SCALES as readonly number[]).indexOf(s.uiScale)
          return { uiScale: UI_SCALES[(i + 1) % UI_SCALES.length] }
        }),
    }),
    {
      name: 'llm-wiki-reader',
      version: 1,
      partialize: (s) => ({ view: s.view, selected: s.selected, theme: s.theme, uiScale: s.uiScale }),
    },
  ),
)
