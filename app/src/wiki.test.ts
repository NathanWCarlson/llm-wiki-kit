/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { RAW_META } from 'virtual:raw-meta'
import { citedBy, classifyHref, renderMarkdown, sectionsOf } from './lib/wikiLinks'
import { graph, home, parsePage, schema } from './lib/wiki'
import { searchPages } from './lib/search'

// Vitest stubs CSS imports to empty strings, so read the file itself.
const css = readFileSync(join(import.meta.dirname, 'index.css'), 'utf8')
const pages = Object.values(graph.pages)
const rendered = [
  ...pages.map((p) => ({ path: p.path, page: p, html: renderMarkdown(p.body, p.path) })),
  { path: home.path, page: undefined, html: renderMarkdown(home.body, home.path) },
]

const pageFiles = Object.keys(
  import.meta.glob('../../wiki/*/*.md', { query: '?raw', import: 'default', eager: true }),
).filter((p) => Object.hasOwn(schema.folders, p.split('/').at(-2)!))

const rawFiles = import.meta.glob('../../raw/*/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function dom(html: string): HTMLElement {
  const el = document.createElement('div')
  el.innerHTML = html
  return el
}

describe('pages', () => {
  it('loads every page file in a schema folder', () => {
    expect(pageFiles.length).toBeGreaterThan(0)
    expect(pages).toHaveLength(pageFiles.length)
  })

  it.each(pages.map((p) => [p.path, p] as const))('%s has the type its folder declares', (_, page) => {
    expect(page.type).toBe(schema.folders[page.folder])
  })

  it('uses only schema edge keys, and every edge target is a page', () => {
    for (const page of pages) {
      for (const [key, targets] of Object.entries(page.edges)) {
        expect(schema.edges, `${page.path}: ${key}`).toContain(key)
        for (const t of targets) expect(graph.pages[t], `${page.path}: ${key} -> ${t}`).toBeDefined()
      }
    }
  })

  it('has one color token per schema type', () => {
    for (const type of Object.values(schema.folders)) {
      expect(css, type).toMatch(new RegExp(`--color-${type}:`))
    }
  })
})

describe('frontmatter', () => {
  it('reads inline edge lists and treats edges: {} as empty', () => {
    const page = parsePage('concepts', 'a', '---\ntype: concept\nedges:\n  part-of: [b, c]\n  feeds: []\n---\n# A\n')
    expect(page.edges).toEqual({ 'part-of': ['b', 'c'], feeds: [] })
    expect(parsePage('concepts', 'a', '---\ntype: concept\nedges: {}\n---\n# A\n').edges).toEqual({})
  })

  it('reads question fields and the evidence ledger', () => {
    const text = [
      '---',
      'type: question',
      'edges: {}',
      'status: open',
      'horizon: later',
      'hypothesis: "It holds."',
      'evidence:',
      '  for:',
      '    - raw: raw/t/one.md',
      '      note: first note',
      '    - raw: raw/t/two.md',
      '  against: []',
      'last-verified: 2026-01-02',
      '---',
      '# Q?',
    ].join('\n')
    const page = parsePage('questions', 'q', text)
    expect(page).toMatchObject({ status: 'open', horizon: 'later', hypothesis: 'It holds.', lastVerified: '2026-01-02' })
    expect(page.evidence).toEqual({
      for: [{ raw: 'raw/t/one.md', note: 'first note' }, { raw: 'raw/t/two.md' }],
      against: [],
    })
  })
})

describe('rendering', () => {
  it('turns every [[wikilink]] into an in-app link and leaves no markup behind', () => {
    let links = 0
    for (const { path, page, html } of rendered) {
      const el = dom(html)
      expect(el.querySelectorAll('.deadlink'), path).toHaveLength(0)
      for (const slug of page?.mentions ?? []) {
        expect(el.querySelector(`a.wikilink[data-slug="${slug}"]`), `${path}: [[${slug}]]`).not.toBeNull()
        links++
      }
      el.querySelectorAll('code, pre').forEach((c) => c.remove())
      expect(el.textContent, path).not.toContain('[[')
    }
    expect(links).toBeGreaterThan(0)
  })

  it('gives every H2 the id its Sections menu entry points at', () => {
    for (const p of [...pages, { path: home.path, body: home.body }]) {
      const ids = sectionsOf(p.body).map((s) => s.id)
      const rendered = [...renderMarkdown(p.body, p.path).matchAll(/<h2 id="([^"]+)"/g)].map((m) => m[1])
      expect(rendered, p.path).toEqual(ids)
    }
    expect(sectionsOf('## A\n\n## A\n').map((s) => s.id)).toEqual(['sec-a', 'sec-a-2'])
  })

  it('keeps [[examples]] inside code literal', () => {
    const el = dom(renderMarkdown('Prose `[[not-a-link]]` here.', 'wiki/concepts/x.md'))
    expect(el.querySelector('code')?.textContent).toBe('[[not-a-link]]')
    expect(el.querySelector('a')).toBeNull()
  })

  it('sends relative links to wiki pages in-app and leaves no bare anchors', () => {
    for (const { path, html } of rendered) {
      const el = dom(html)
      expect(el.querySelectorAll('a:not([class])'), path).toHaveLength(0)
    }
    const index = dom(rendered.at(-1)!.html)
    const slugs = [...index.querySelectorAll('a.wikilink')].map((a) => a.getAttribute('data-slug'))
    expect(new Set(slugs)).toEqual(new Set(pages.map((p) => p.slug)))
  })

  it('classifies links by where they resolve', () => {
    expect(classifyHref('wiki/concepts/x.md', '../systems/reader-app.md')).toEqual({ kind: 'page', slug: 'reader-app' })
    expect(classifyHref('wiki/index.md', 'systems/reader-app.md')).toEqual({ kind: 'page', slug: 'reader-app' })
    expect(classifyHref('wiki/concepts/x.md', '../../raw/t/a.md')).toEqual({ kind: 'raw', path: 'raw/t/a.md' })
    expect(classifyHref('wiki/concepts/x.md', '../../docs/a.md')).toEqual({ kind: 'file', path: 'docs/a.md' })
    expect(classifyHref('wiki/concepts/x.md', 'https://example.com')).toMatchObject({ kind: 'external' })
  })
})

describe('raw citations', () => {
  it('resolve every cited raw path, in prose and in evidence, to a header entry', () => {
    const cited = new Set<string>()
    for (const { html } of rendered) {
      dom(html)
        .querySelectorAll('.rawcite[data-raw]')
        .forEach((c) => cited.add(c.getAttribute('data-raw')!))
    }
    for (const page of pages) {
      for (const item of [...(page.evidence?.for ?? []), ...(page.evidence?.against ?? [])]) cited.add(item.raw)
    }
    expect(cited.size).toBeGreaterThan(0)
    for (const path of cited) expect(RAW_META[path], path).toBeDefined()
  })

  it('indexes which pages cite each source, from prose and evidence', () => {
    const lessons = 'raw/design-notes/2026-10-04-enforcement-lessons.md'
    const citing = citedBy(lessons)
    expect(citing).toContain('canon-map')
    expect(citing).toContain('q-lint-vs-review')
    expect(citedBy('raw/nowhere.md')).toEqual([])
  })

  it('carries headers only, never source bodies', () => {
    const bundled = JSON.stringify(RAW_META)
    for (const [file, text] of Object.entries(rawFiles)) {
      const key = file.replace(/^(\.\.\/)+/, '')
      const meta = RAW_META[key]
      expect(meta, key).toBeDefined()
      expect(meta.title).toBeTruthy()
      expect(meta.words).toBeGreaterThan(0)
      const bodyLines = text.split('\n').filter((l) => l.length > 40 && !l.startsWith('>') && !l.startsWith('#'))
      expect(bodyLines.length, key).toBeGreaterThan(0)
      for (const line of bodyLines) expect(bundled).not.toContain(line.slice(0, 40))
    }
  })
})

describe('search', () => {
  it.each(pages.map((p) => [p.title, p.slug] as const))('finds "%s" by its title', (title, slug) => {
    expect(searchPages(title)[0]?.page.slug).toBe(slug)
  })
})
