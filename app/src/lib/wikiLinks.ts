import DOMPurify from 'dompurify'
import { Marked, type Tokens } from 'marked'
import { graph, proseOnly } from './wiki'

export type LinkTarget =
  | { kind: 'page'; slug: string }
  | { kind: 'raw'; path: string }
  | { kind: 'external'; href: string }
  | { kind: 'file'; path: string }

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Resolve `href` against the directory of `fromPath`, both repo-relative. */
function resolvePath(fromPath: string, href: string): string {
  const parts = fromPath.split('/').slice(0, -1)
  for (const seg of href.split('/')) {
    if (seg === '..') parts.pop()
    else if (seg && seg !== '.') parts.push(seg)
  }
  return parts.join('/')
}

/**
 * The one place that decides what a markdown link means. Wiki pages navigate
 * in-app, raw sources become citation markers, anything else in the repo is
 * shown as a path because the reader does not serve it.
 */
export function classifyHref(fromPath: string, href: string): LinkTarget {
  if (/^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(href)) return { kind: 'external', href }
  const path = resolvePath(fromPath, decodeURI(href.replace(/[?#].*$/, '')))
  const page = path.match(/^wiki\/([^/]+)\/([^/]+)\.md$/)
  if (page && graph.pages[page[2]]?.folder === page[1]) return { kind: 'page', slug: page[2] }
  if (/^raw\/.+\.md$/.test(path)) return { kind: 'raw', path }
  return { kind: 'file', path }
}

let citations: Map<string, string[]> | undefined

/** Slugs of the pages that cite a raw file, in prose or in an evidence ledger. */
export function citedBy(rawPath: string): string[] {
  if (!citations) {
    citations = new Map()
    for (const page of Object.values(graph.pages)) {
      const paths = new Set<string>()
      for (const m of proseOnly(page.body).matchAll(/\]\(([^)\s]+)\)/g)) {
        const target = classifyHref(page.path, m[1])
        if (target.kind === 'raw') paths.add(target.path)
      }
      for (const item of [...(page.evidence?.for ?? []), ...(page.evidence?.against ?? [])]) paths.add(item.raw)
      for (const path of paths) citations.set(path, [...(citations.get(path) ?? []), page.slug])
    }
  }
  return citations.get(rawPath) ?? []
}

export function pageLink(slug: string, label: string): string {
  return `<a href="#" data-slug="${esc(slug)}" class="wikilink">${label}</a>`
}

export function rawCite(path: string, label: string): string {
  return `<span class="rawcite" role="button" tabindex="0" data-raw="${esc(path)}" aria-label="Show source">${label}</span>`
}

function renderLink(fromPath: string, href: string, label: string): string {
  const target = classifyHref(fromPath, href)
  switch (target.kind) {
    case 'page':
      return pageLink(target.slug, label)
    case 'raw':
      return rawCite(target.path, label === 'raw' ? '§' : label)
    case 'file':
      return `<span class="filelink" title="${esc(target.path)}">${label}</span>`
    case 'external':
      return target.href.startsWith('#')
        ? label
        : `<a href="${esc(target.href)}" class="extlink" target="_blank" rel="noopener noreferrer">${label}</a>`
  }
}

interface WikilinkToken extends Tokens.Generic {
  type: 'wikilink'
  slug: string
  label?: string
}

function createParser(fromPath: string): Marked {
  return new Marked({
    gfm: true,
    extensions: [
      {
        // A real tokenizer rather than a regex pass over the source, so
        // `[[examples]]` inside code stay literal.
        name: 'wikilink',
        level: 'inline',
        start: (src) => src.indexOf('[['),
        tokenizer(src) {
          const m = src.match(/^\[\[([^\]|\\]+)(?:\\?\|([^\]]+))?\]\]/)
          if (!m) return undefined
          return { type: 'wikilink', raw: m[0], slug: m[1].trim(), label: m[2]?.trim() }
        },
        renderer(token) {
          const { slug, label } = token as WikilinkToken
          const page = graph.pages[slug]
          const words = slug.replace(/-/g, ' ')
          // `[[wiki-layer]]` sits mid-sentence, so keep it lowercase when the
          // title says the same thing; otherwise the title reads better.
          const text = esc(label ?? (page && page.title.toLowerCase() !== words ? page.title : words))
          return page
            ? pageLink(slug, text)
            : `<span class="deadlink" title="No wiki page: ${esc(slug)}">${text}</span>`
        },
      },
    ],
    renderer: {
      link({ href, tokens }) {
        return renderLink(fromPath, href, this.parser.parseInline(tokens))
      },
    },
  })
}

const parsers = new Map<string, Marked>()

/** Markdown from the file at `fromPath` (repo-relative) to sanitized HTML. */
export function renderMarkdown(md: string, fromPath: string): string {
  const dir = fromPath.split('/').slice(0, -1).join('/')
  let parser = parsers.get(dir)
  if (!parser) parsers.set(dir, (parser = createParser(fromPath)))
  const body = md.replace(/^---\n[\s\S]*?\n---\n/, '')
  return DOMPurify.sanitize(parser.parse(body, { async: false }), {
    ADD_ATTR: ['data-slug', 'data-raw', 'target'],
  })
}
