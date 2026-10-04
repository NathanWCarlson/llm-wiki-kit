import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const sharesDir = resolve(root, 'shares')

const FONTS =
  'https://fonts.googleapis.com/css2?family=Saira:wdth,wght@62.5..125,100..900&family=Atkinson+Hyperlegible+Next:ital,wght@0,200..800;1,200..800&family=Fragment+Mono:ital@0;1&display=swap'

// A deck is any folder with a deck.md. Folders starting with _ and the shell are not decks.
export function deckSlugs() {
  return readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_') && d.name !== 'shell')
    .filter((d) => existsSync(resolve(root, d.name, 'deck.md')))
    .map((d) => d.name)
    .sort()
}

export function deckTitle(slug) {
  const text = readFileSync(resolve(root, slug, 'deck.md'), 'utf8')
  return text.match(/^title:\s*(.+)$/m)?.[1].trim() ?? slug
}

// Every deck gets the same head: title from deck.md, fonts, nothing else to keep in sync.
function deckHead(slug) {
  const title = deckTitle(slug).replace(/[<&]/g, (c) => (c === '<' ? '&lt;' : '&amp;'))
  return {
    name: 'deck-head',
    transformIndexHtml: () => [
      { tag: 'title', children: title, injectTo: 'head' },
      { tag: 'link', attrs: { rel: 'stylesheet', href: FONTS }, injectTo: 'head' },
    ],
  }
}

export function deckConfig(slug) {
  return {
    configFile: false,
    root: resolve(root, slug),
    base: './',
    plugins: [react(), deckHead(slug)],
    logLevel: 'warn',
    build: {
      outDir: resolve(root, 'dist', slug),
      emptyOutDir: true,
    },
  }
}
