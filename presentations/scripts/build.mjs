// Builds each deck to one self-contained HTML file in shares/ and records
// when it was built and against which shell, so a reader can flag stale decks.
//   npm run build            every deck
//   npm run build -- intro   one deck
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { build } from 'vite'
import { deckConfig, deckSlugs, root, sharesDir } from './decks.mjs'
import { shellSigFromCss } from '../shell/shellSig.mjs'
import { inlineBuild } from '../../scripts/inline-html.mjs'

const all = deckSlugs()
const wanted = process.argv.slice(2)
const unknown = wanted.filter((s) => !all.includes(s))
if (unknown.length > 0) {
  console.error(`No deck named ${unknown.join(', ')}. Decks: ${all.join(', ')}`)
  process.exit(1)
}
const slugs = wanted.length > 0 ? wanted : all

const shellSig = shellSigFromCss(readFileSync(resolve(root, 'shell/base.css'), 'utf8'))
mkdirSync(sharesDir, { recursive: true })

const manifestPath = resolve(sharesDir, 'manifest.json')
let prevMeta = {}
if (existsSync(manifestPath)) {
  try {
    prevMeta = JSON.parse(readFileSync(manifestPath, 'utf8')).meta ?? {}
  } catch {
    prevMeta = {}
  }
}

const built = {}
for (const slug of slugs) {
  await build(deckConfig(slug))
  writeFileSync(resolve(sharesDir, `${slug}.html`), inlineBuild(resolve(root, 'dist', slug)))
  built[slug] = { builtAt: new Date().toISOString(), shellSig }
  console.log(`built shares/${slug}.html`)
}

// The manifest lists whatever share files exist, so a deleted deck drops out.
const published = readdirSync(sharesDir)
  .filter((f) => f.endsWith('.html'))
  .map((f) => f.replace(/\.html$/, ''))
  .sort()
const meta = {}
for (const slug of published) {
  const m = built[slug] ?? prevMeta[slug]
  if (m) meta[slug] = m
}

writeFileSync(manifestPath, `${JSON.stringify({ slugs: published, meta }, null, 2)}\n`)
console.log(`wrote shares/manifest.json (${published.length} deck(s), shellSig ${shellSig})`)
