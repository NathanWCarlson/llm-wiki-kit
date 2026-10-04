// Fingerprint of shell/base.css. A share built against a different
// fingerprint is behind the current shell and needs a rebuild.
//
// Pure (no fs, no async crypto) so the build script and the reader app can
// import this one function and always agree:
//   import { shellSigFromCss } from '../../presentations/shell/shellSig.mjs'
//   import css from '../../presentations/shell/base.css?raw'
//   shellSigFromCss(css)
// Whitespace is collapsed first, so reformatting the file does not count as a change.
export function shellSigFromCss(css) {
  const material = css.replace(/\s+/g, ' ').trim()
  let h1 = 2166136261 >>> 0
  let h2 = 0x811c9dc5 >>> 0
  for (let i = 0; i < material.length; i++) {
    const c = material.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0
    h2 = Math.imul(h2 ^ c, 16777619) >>> 0
    h2 = (h2 + Math.imul(h1, 0x5bd1e995)) >>> 0
  }
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0').slice(0, 4)
}
