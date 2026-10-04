import { useEffect } from 'react'
import { BookOpen, Moon, Network, Sun, ZoomIn } from 'lucide-react'
import { useAppStore, type PrimaryView } from './store/useAppStore'
import { graph } from './lib/wiki'
import { CommandPalette } from './components/CommandPalette'
import { ReaderView } from './views/ReaderView'
import { GraphView } from './views/GraphView'

const NAV: { view: PrimaryView; label: string; icon: typeof BookOpen }[] = [
  { view: 'reader', label: 'Read', icon: BookOpen },
  { view: 'graph', label: 'Graph', icon: Network },
]

export default function App() {
  const view = useAppStore((s) => s.view)
  const selected = useAppStore((s) => s.selected)
  const theme = useAppStore((s) => s.theme)
  const setView = useAppStore((s) => s.setView)
  const toggleTheme = useAppStore((s) => s.toggleTheme)
  const uiScale = useAppStore((s) => s.uiScale)
  const cycleScale = useAppStore((s) => s.cycleScale)
  const goHome = useAppStore((s) => s.goHome)
  const pageCount = Object.keys(graph.pages).length

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  // Presentation scale: CSS zoom on the root so everything grows together for a
  // projector or screen share, layout included.
  useEffect(() => {
    document.documentElement.style.zoom = uiScale === 1 ? '' : String(uiScale)
  }, [uiScale])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [view, selected])

  return (
    <div className="flex min-h-dvh w-full flex-col bg-void font-sans text-fg">
      <header className="sticky top-0 z-20 w-full border-b border-edge bg-void/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-2.5 sm:gap-4">
          <button
            type="button"
            onClick={goHome}
            title="Home"
            className="display shrink-0 text-[1.4rem] leading-none text-fg transition-colors hover:text-amber"
          >
            Wiki
          </button>
          <span className="hidden font-mono text-chrome tabular-nums text-faint sm:inline">{pageCount} pages</span>
          <span className="hidden h-5 w-px shrink-0 bg-edge sm:block" aria-hidden />
          <nav className="flex min-w-0 flex-1 items-center gap-0.5">
            {NAV.map(({ view: v, label, icon: Icon }) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-current={view === v ? 'page' : undefined}
                className={`display flex items-center gap-1.5 whitespace-nowrap border-b-2 px-2 pb-1.5 pt-1 text-[12.5px] tracking-label transition-colors ${
                  view === v ? 'border-amber text-fg' : 'border-transparent text-faint hover:text-dim'
                }`}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <CommandPalette />
            <button
              type="button"
              onClick={cycleScale}
              title={`Presentation scale ${uiScale}x. Click to cycle.`}
              aria-label={`Presentation scale ${uiScale}x`}
              className={`flex items-center gap-1 rounded border p-1.5 font-mono text-chrome tabular-nums transition-colors hover:text-amber ${
                uiScale === 1 ? 'border-edge text-faint' : 'border-amber text-amber'
              }`}
            >
              <ZoomIn size={14} />
              {uiScale !== 1 && <span>{uiScale}x</span>}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className="rounded border border-edge p-1.5 text-faint transition-colors hover:text-amber"
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5">
        {view === 'graph' ? <GraphView /> : <ReaderView />}
      </main>
    </div>
  )
}
