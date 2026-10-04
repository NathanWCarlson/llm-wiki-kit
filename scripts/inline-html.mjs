// Inlines a Vite build's CSS and JS into its index.html, so the result is one file
// that opens from file:// and can be sent as an attachment. Shared by the reader
// export and the deck build. Build with `base: './'` so asset paths are relative.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export function inlineBuild(distDir) {
  const asset = (href) => readFileSync(resolve(distDir, href.replace(/^\.\//, '')), 'utf8')
  const scriptSafe = (text) => text.replace(/<\/script/gi, '<\\/script')
  // Function replacers, so `$&` and friends inside a bundle are not read as patterns.
  return readFileSync(resolve(distDir, 'index.html'), 'utf8')
    .replace(/<link rel="stylesheet"[^>]*href="(\.\/[^"]+)"[^>]*>/g, (_, href) => `<style>${asset(href)}</style>`)
    .replace(/<link rel="modulepreload"[^>]*>\s*/g, '')
    .replace(/<script type="module"[^>]*src="(\.\/[^"]+)"[^>]*><\/script>/g, (_, src) =>
      `<script type="module">${scriptSafe(asset(src))}</script>`,
    )
}
