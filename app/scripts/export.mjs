// Builds the reader and inlines its CSS and JS into one HTML file that opens from
// file:// and can be sent as an attachment. Fonts still load from Google when online.
import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { inlineBuild } from '../../scripts/inline-html.mjs'

const app = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(app, 'dist-export')
const tmp = resolve(outDir, '.build')

rmSync(outDir, { recursive: true, force: true })
execFileSync('npx', ['vite', 'build', '--base', './', '--outDir', tmp, '--emptyOutDir'], {
  cwd: app,
  stdio: 'inherit',
})

const html = inlineBuild(tmp)

mkdirSync(outDir, { recursive: true })
const output = resolve(outDir, 'wiki.html')
writeFileSync(output, html)
rmSync(tmp, { recursive: true, force: true })
console.log(`${output} (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`)
