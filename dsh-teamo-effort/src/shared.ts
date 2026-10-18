/**
 * Vocabulary shared by both halves of `dsh-teamo-effort`.
 *
 * This module is bundled into the Host entry and into the browser entry, so the
 * namespace literal and the effort ids exist exactly once in the source tree.
 * It imports nothing: the browser bundle must stay free of Node and Cordis
 * runtime values.
 */

/**
 * Settings namespace of this plugin, and the row id its bundle patch inserts.
 *
 * The Host half registers the Config namespace under this name; the Client half
 * resolves the same namespace inside the settings document (a profile may prefix
 * entry ids with its include layer, so the client matches the bare name or a
 * `:<name>` suffix).
 */
export const TEAMO_EFFORT_NS = 'teamo-effort'

/** The protocol field this plugin writes into an outbound TeamoRouter request. */
export const TEAMO_EFFORT_FIELD = 'reasoning_effort'

/** Selectable strengths, weakest first. `off` sends no field at all. */
export const TEAMO_EFFORTS = ['off', 'low', 'medium', 'high'] as const

/** One selectable strength. */
export type TeamoEffort = (typeof TEAMO_EFFORTS)[number]

/** Endpoint prefixes owned by TeamoRouter when the config names none. */
export const DEFAULT_TEAMO_ENDPOINTS = ['https://api.teamorouter.cn']

/** Provider routes the selector applies to when the config names none. */
export const DEFAULT_TEAMO_PROVIDERS = ['teamo']

/** Clamp an arbitrary stored value to a selectable strength. */
export function normalizeEffort(value: unknown): TeamoEffort {
  return value === 'low' || value === 'medium' || value === 'high' ? value : 'off'
}

/** Whether a name is a member of a filter: an empty filter matches everything. */
export function matchesFilter(filter: readonly string[] | undefined, value: string): boolean {
  if (filter === undefined || filter.length === 0) return true
  return filter.some(entry => entry === '*' || entry === value)
}

/** Normalize a stored string array, dropping blanks and non-strings. */
export function normalizeList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map(entry => entry.trim())
    .filter(entry => entry.length > 0)
}

/** Parse the comma separated text the settings page edits into a filter list. */
export function splitList(text: string): string[] {
  return text.split(',').map(entry => entry.trim()).filter(entry => entry.length > 0)
}

/**
 * Whether an outbound URL belongs to one of the configured endpoints.
 *
 * Matching is a prefix match on the endpoint text with a path boundary, so
 * `https://api.teamorouter.cn` covers `/v1/chat/completions` but never
 * `https://api.teamorouter.cn.example.net`.
 */
export function endpointOwns(url: string, endpoints: readonly string[] | undefined): boolean {
  if (endpoints === undefined || endpoints.length === 0) return false
  const target = url.trim().toLowerCase()
  return endpoints.some(raw => {
    const prefix = raw.trim().toLowerCase().replace(/\/+$/, '')
    if (prefix.length === 0 || !target.startsWith(prefix)) return false
    const rest = target.slice(prefix.length)
    return rest === '' || rest.startsWith('/') || rest.startsWith('?')
  })
}
