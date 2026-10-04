import { FOLDERS } from './wiki'

const logFile = import.meta.glob('../../../wiki/log.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const HEADING_RE = /^## \[(\d{4}-\d{2}-\d{2})\] [a-z][a-z0-9+-]* \| /
const PAGE_RE = new RegExp(`\\b(?:${FOLDERS.join('|')})/([a-z0-9-]+)\\.md\\b`, 'g')

/**
 * Newest log date that names each page, keyed by slug. Log bullets name pages as
 * `folder/slug.md`, which is why the ingest rules ask for one page per bullet.
 * Lines that match nothing are skipped, never an error: this reads hand-written text.
 */
export function lastLoggedBySlug(text: string): Map<string, string> {
  const latest = new Map<string, string>()
  let date: string | null = null
  for (const line of text.split('\n')) {
    const heading = line.match(HEADING_RE)
    if (heading) {
      date = heading[1]
      continue
    }
    if (!date) continue
    for (const m of line.matchAll(PAGE_RE)) {
      const prev = latest.get(m[1])
      if (!prev || date > prev) latest.set(m[1], date)
    }
  }
  return latest
}

export const lastLogged = lastLoggedBySlug(Object.values(logFile)[0] ?? '')
