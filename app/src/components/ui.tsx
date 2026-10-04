import type { EntityType } from '../types/wiki'
import { typeColor } from '../lib/theme'

export function TypeBadge({ type }: { type: EntityType }) {
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-[3px] border px-1.5 py-[3px] font-mono text-chrome leading-none"
      style={{
        color: typeColor(type),
        borderColor: 'color-mix(in oklab, currentColor 45%, transparent)',
        background: 'color-mix(in oklab, currentColor 8%, transparent)',
      }}
    >
      {type}
    </span>
  )
}

export function Panel({ children, className = '', ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded border border-edge bg-console ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function Legend({ children }: { children: React.ReactNode }) {
  return <div className="legend">{children}</div>
}
