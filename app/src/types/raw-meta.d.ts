declare module 'virtual:raw-meta' {
  export interface RawMeta {
    title?: string
    topic: string
    /** lowercased header lines: source, collected, published */
    fields: Partial<Record<'source' | 'collected' | 'published', string>>
    words: number
  }
  export const RAW_META: Record<string, RawMeta>
}
