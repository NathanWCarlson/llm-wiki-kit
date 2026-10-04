import type { EntityType } from '../types/wiki'

/**
 * One `--color-<type>` token per schema type lives in index.css. A type added
 * to the schema before it gets a token falls back to the faint ink.
 */
export function typeColor(type: EntityType): string {
  return `var(--color-${type}, var(--color-faint))`
}

export const STATUS_COLOR: Record<string, string> = {
  open: 'var(--color-alert)',
  'partially-answered': 'var(--color-amber)',
  answered: 'var(--color-gauge)',
}
