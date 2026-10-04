import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const HEADER_KEYS = ['source', 'collected', 'published']

/**
 * virtual:raw-meta exposes the header of every raw/ source, keyed by
 * `raw/<topic>/<file>.md`: title, the source/collected/published lines and a
 * word count. Only the header block is read for fields, so a blockquote further
 * down a source can never leak into the bundle. Restart dev to pick up new files.
 */
function rawMeta(): Plugin {
  const VIRTUAL = 'virtual:raw-meta'
  const RESOLVED = '\0' + VIRTUAL

  function build(): string {
    const root = join(import.meta.dirname, '..', 'raw')
    const meta: Record<string, unknown> = {}
    for (const topic of readdirSync(root, { withFileTypes: true })) {
      if (!topic.isDirectory()) continue
      for (const f of readdirSync(join(root, topic.name))) {
        if (!f.endsWith('.md')) continue
        const lines = readFileSync(join(root, topic.name, f), 'utf8').split('\n')
        const titleAt = lines.findIndex((l) => l.startsWith('# '))
        const fields: Record<string, string> = {}
        let i = titleAt + 1
        while (i < lines.length && !lines[i].trim()) i++
        for (; i < lines.length && lines[i].startsWith('>'); i++) {
          const m = lines[i].match(/^>\s*([A-Za-z]+):\s*(.+)$/)
          if (m && HEADER_KEYS.includes(m[1].toLowerCase())) fields[m[1].toLowerCase()] = m[2].trim()
        }
        meta[`raw/${topic.name}/${f}`] = {
          title: titleAt >= 0 ? lines[titleAt].slice(2).trim() : undefined,
          topic: topic.name,
          fields,
          words: lines.slice(i).join(' ').split(/\s+/).filter(Boolean).length,
        }
      }
    }
    return `export const RAW_META = ${JSON.stringify(meta)}`
  }

  return {
    name: 'raw-meta',
    resolveId(id) {
      return id === VIRTUAL ? RESOLVED : undefined
    },
    load(id) {
      return id === RESOLVED ? build() : undefined
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), rawMeta()],
  server: {
    fs: {
      // wiki/ lives one level above the app root and is imported via import.meta.glob
      allow: ['..'],
    },
  },
  build: {
    // Built decks are bundled as text so Present works from the single-file
    // export; each adds ~250 KB to the one chunk on purpose.
    chunkSizeWarningLimit: 2000,
  },
  test: {
    environment: 'jsdom',
  },
})
