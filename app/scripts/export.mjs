// Builds the reader and inlines its CSS and JS into one HTML file that opens from
// file:// and can be sent as an attachment. Fonts still load from Google when online.
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const app = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(app, 'dist-export')
const tmp = resolve(outDir, '.build')

rmSync(outDir, { recursive: true, force: true })
execFileSync('npx', ['vite', 'build', '--base', './', '--outDir', tmp, '--emptyOutDir'], {
  cwd: app,
  stdio: 'inherit',
})

let html = readFileSync(resolve(tmp, 'index.html'), 'utf8')
const asset = (href) => readFileSync(resolve(tmp, href.replace(/^\.\//, '')), 'utf8')
const scriptSafe = (text) => text.replace(/<\/script/gi, '<\\/script')

// Function replacers, so `$&` and friends inside the bundle are not read as patterns.
html = html.replace(/<link rel="stylesheet"[^>]*href="(\.\/[^"]+)"[^>]*>/g, (_, href) =>
  `<style>${asset(href)}</style>`,
)
html = html.replace(/<link rel="modulepreload"[^>]*>\s*/g, '')
html = html.replace(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g, (_, src) =>
  `<script type="module">${scriptSafe(asset(src))}</script>`,
)

mkdirSync(outDir, { recursive: true })
const output = resolve(outDir, 'wiki.html')
writeFileSync(output, html)
rmSync(tmp, { recursive: true, force: true })
console.log(`${output} (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`)
