import type schema from '../../../wiki/_schema.json'

/** A wiki folder, as declared in wiki/_schema.json. */
export type Folder = keyof typeof schema.folders

/**
 * Page types and edge keys are plain strings on purpose: the schema file is the
 * only list, so adding a type or key there needs no change here.
 */
export type EntityType = string
export type EdgeKey = string

export interface EvidenceItem {
  raw: string
  note?: string
}

export interface Evidence {
  for: EvidenceItem[]
  against: EvidenceItem[]
}

export interface WikiPage {
  slug: string
  folder: Folder
  /** repo-relative, e.g. wiki/concepts/typed-edges.md */
  path: string
  title: string
  type: EntityType
  lastVerified?: string
  status?: string
  horizon?: string
  hypothesis?: string
  evidence?: Evidence
  edges: Record<EdgeKey, string[]>
  body: string
  summary: string
  /** slugs named by [[wikilinks]] in prose, code excluded */
  mentions: string[]
}

export interface GraphEdge {
  from: string
  to: string
  key: EdgeKey
}

export interface Inbound {
  from: string
  /** the edge key declared on the other page, or 'mention' for a wikilink */
  via: EdgeKey | 'mention'
}

export interface WikiGraph {
  pages: Record<string, WikiPage>
  edges: GraphEdge[]
  inbound: Record<string, Inbound[]>
}
