import { Play } from 'lucide-react'
import { canPresent, decks, presentDeck, type Deck } from '../lib/decks'
import { graph } from '../lib/wiki'
import { useAppStore } from '../store/useAppStore'
import { Legend, Panel } from '../components/ui'

const STATUS_STYLE: Record<Deck['status'], string> = {
  ready: 'border-gauge text-gauge',
  draft: 'border-edge text-faint',
  archived: 'border-edge text-faint line-through',
}

export function DecksView() {
  return (
    <div className="rise space-y-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <Legend>Decks</Legend>
        <span className="font-mono text-chrome text-faint">
          slides built from wiki pages · presentations/ · npm --prefix presentations run build
        </span>
      </div>
      {decks.length === 0 ? (
        <Panel className="px-5 py-6 text-body text-dim">
          No decks yet. Copy <code className="font-mono">presentations/_template</code> to start one.
        </Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {decks.map((d) => (
            <DeckCard key={d.slug} deck={d} />
          ))}
        </div>
      )}
    </div>
  )
}

function DeckCard({ deck }: { deck: Deck }) {
  const openPage = useAppStore((s) => s.openPage)
  const theme = useAppStore((s) => s.theme)
  const uiScale = useAppStore((s) => s.uiScale)
  const stale = deck.staleReasons.length > 0
  const presentable = canPresent(deck)

  return (
    <Panel className="flex min-w-0 flex-col gap-3 px-5 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-sm border px-1.5 py-px font-mono text-chrome uppercase tracking-label ${STATUS_STYLE[deck.status]}`}>
          {deck.status}
        </span>
        {deck.role && <span className="font-mono text-chrome uppercase tracking-label text-faint">{deck.role}</span>}
        <span className="ml-auto font-mono text-chrome tabular-nums text-faint">
          {deck.slides ? `${deck.slides} slides · ` : ''}updated {deck.updated || 'never'}
        </span>
      </div>

      <div>
        <h2 className="display text-[1.35rem] leading-tight text-fg">{deck.title}</h2>
        {deck.audience && <div className="mt-0.5 text-data text-faint">For: {deck.audience}</div>}
        {deck.summary && <p className="mt-2 text-body leading-relaxed text-dim">{deck.summary}</p>}
      </div>

      <div className="flex items-start gap-2 font-mono text-data">
        <span
          className={`mt-[5px] size-2 shrink-0 rounded-full ${stale ? 'bg-alert' : 'bg-gauge'}`}
          aria-hidden
        />
        {stale ? (
          <ul className="space-y-0.5 text-alert">
            {deck.staleReasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        ) : (
          <span className="text-gauge">fresh: no source page changed since {deck.updated}</span>
        )}
      </div>

      {deck.sources.length > 0 && (
        <div>
          <div className="mb-1 font-mono text-chrome uppercase tracking-label text-faint">
            Sources · {deck.sources.length}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {deck.sources.map((s) => {
              const page = graph.pages[s]
              const changed = deck.staleSources.includes(s)
              return page ? (
                <button
                  key={s}
                  type="button"
                  onClick={() => openPage(s)}
                  className={`rounded-sm border px-1.5 py-0.5 text-data transition-colors hover:border-amber hover:text-amber ${
                    changed ? 'border-alert text-alert' : 'border-edge text-dim'
                  }`}
                >
                  {page.title}
                </button>
              ) : (
                <span key={s} className="rounded-sm border border-dashed border-alert px-1.5 py-0.5 font-mono text-data text-alert" title="No wiki page with this slug">
                  {s}
                </span>
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-auto flex items-center gap-3 border-t border-edge pt-3">
        <button
          type="button"
          disabled={!presentable}
          onClick={() => presentDeck(deck, theme, uiScale)}
          className="inline-flex items-center gap-1.5 rounded border border-amber px-3 py-1.5 font-mono text-data uppercase tracking-label text-amber transition-colors hover:bg-amber hover:text-console disabled:border-edge disabled:text-faint disabled:hover:bg-transparent"
        >
          <Play size={12} strokeWidth={2.5} />
          Present
        </button>
        <span className="font-mono text-chrome text-faint">
          {!deck.html
            ? 'not built'
            : deck.status === 'draft'
              ? 'drafts do not present'
              : `opens in a new tab · arrows to move · Z to zoom`}
        </span>
      </div>
    </Panel>
  )
}
