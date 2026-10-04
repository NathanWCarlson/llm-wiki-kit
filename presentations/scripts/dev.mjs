// Live-reload one deck.
//   npm run dev -- intro     or     DECK=intro npm run dev
import { createServer } from 'vite'
import { deckConfig, deckSlugs } from './decks.mjs'

const all = deckSlugs()
const slug = process.argv[2] ?? process.env.DECK ?? all[0]
if (!all.includes(slug)) {
  console.error(`No deck named ${slug}. Decks: ${all.join(', ')}`)
  process.exit(1)
}

const server = await createServer({ ...deckConfig(slug), logLevel: 'info' })
await server.listen()
server.printUrls()
