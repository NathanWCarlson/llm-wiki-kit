import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PrimaryView = 'reader' | 'graph'
export type Theme = 'light' | 'dark'

interface AppState {
  view: PrimaryView
  /** null is the home page, wiki/index.md */
  selected: string | null
  graphFocus: string | null
  theme: Theme
  setView: (view: PrimaryView) => void
  openPage: (slug: string) => void
  goHome: () => void
  showOnGraph: (slug: string) => void
  clearGraphFocus: () => void
  toggleTheme: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      view: 'reader',
      selected: null,
      graphFocus: null,
      theme: 'light',
      setView: (view) => set({ view }),
      openPage: (slug) => set({ view: 'reader', selected: slug }),
      goHome: () => set({ view: 'reader', selected: null }),
      showOnGraph: (slug) => set({ view: 'graph', graphFocus: slug }),
      clearGraphFocus: () => set({ graphFocus: null }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
    }),
    {
      name: 'llm-wiki-reader',
      version: 1,
      partialize: (s) => ({ view: s.view, selected: s.selected, theme: s.theme }),
    },
  ),
)
