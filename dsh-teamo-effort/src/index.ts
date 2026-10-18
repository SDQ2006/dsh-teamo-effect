/**
 * Host half of `dsh-teamo-effort`.
 *
 * The plugin owns one preference — the Teamo model strength — and applies it to
 * the `teamo` route TeamoRouter serves:
 *
 * 1. `agent/request` is the decision point. It runs before every model step,
 *    sees the exact provider/model the step will use, and applies the optional
 *    provider/model filter. The proposal handed to that waterfall is
 *    deep-frozen, so this module never mutates it; it returns either the
 *    proposal itself or a new object.
 * 2. When the selected model advertises the selected effort natively (its
 *    adapter publishes `reasoning.efforts`), the listener returns
 *    `{ ...config, reasoningEffort: effort }` and the adapter serializes it.
 * 3. When the model advertises no reasoning capability — which is the state of
 *    the hand-declared TeamoRouter route today — DSH would reject an explicit
 *    `reasoningEffort` with `UNSUPPORTED_REASONING_EFFORT` before any provider
 *    I/O. For those models the value is applied one layer lower, to the wire
 *    JSON of requests addressed to the configured TeamoRouter endpoints, as the
 *    protocol field `reasoning_effort`. `off` sends no field at all and lets the
 *    gateway default stand.
 *
 * @module dsh-teamo-effort
 */
import type { Context } from '@deepseek-ai/cordis'
// Type-only: loads the `Events` augmentation that types `agent/request`.
import type {} from '@deepseek-ai/dsh-agent'
import type { LlmCallConfig } from '@deepseek-ai/dsh-llm'
// Type-only: loads the `Context.settings` augmentation of the settings service.
import type {} from '@deepseek-ai/dsh-settings'
import z from '@deepseek-ai/schemastery'
import {
  DEFAULT_TEAMO_ENDPOINTS,
  DEFAULT_TEAMO_PROVIDERS,
  TEAMO_EFFORTS,
  TEAMO_EFFORT_FIELD,
  TEAMO_EFFORT_NS,
  endpointOwns,
  matchesFilter,
  normalizeEffort,
  normalizeList,
  type TeamoEffort,
} from './shared.js'

/** Loader row name of this plugin. */
export const name = TEAMO_EFFORT_NS

/**
 * `settings` owns the Config document the Client half's form edits through
 * `configForms`; `llm` answers which efforts one exact model advertises.
 */
export const inject = ['settings', 'llm']

/** Resolved preference of this plugin instance. */
export interface TeamoEffortConfig {
  /** Selected strength; `off` leaves the request untouched. */
  effort: TeamoEffort
  /** Provider routes the preference applies to; empty means every route. */
  providers: string[]
  /** Exact model ids the preference applies to; empty means every model. */
  models: string[]
  /** Endpoint prefixes whose outbound JSON bodies receive `reasoning_effort`. */
  endpoints: string[]
}

/**
 * Mark one field user-editable.
 *
 * Only volatile fields are projected into the settings document, and an entry
 * with no volatile field never reaches the Client mirror at all. Older
 * Schemastery releases have no `volatile()` builder; on those the field simply
 * stays config-layer only.
 */
function volatile<S>(schema: S): S {
  const markable = schema as S & { volatile?: () => S }
  return typeof markable.volatile === 'function' ? markable.volatile() : schema
}

/**
 * Config schema projected into the profile's settings document.
 *
 * `effort` alone drives the request; the three filters narrow where it may
 * apply. The root description carries the namespace so the browser half can
 * recognize its own entry without hardcoding a profile prefix.
 */
export const Config = z
  .object({
    effort: volatile(z.union([...TEAMO_EFFORTS]).default('off')),
    providers: volatile(z.array(z.string()).default([...DEFAULT_TEAMO_PROVIDERS])),
    models: volatile(z.array(z.string()).default([])),
    endpoints: volatile(z.array(z.string()).default([...DEFAULT_TEAMO_ENDPOINTS])),
  })
  .description(TEAMO_EFFORT_NS)

/** One decision per model step, shared with the outbound injector. */
interface WirePolicy {
  readonly endpoints: readonly string[]
}

/** Shared reference protocol of a Schemastery volatile field. */
const VOLATILE_WRITE = Symbol.for('cosmokit.volatile.write')

/**
 * Unwrap one Schemastery volatile field.
 *
 * A field marked `.volatile()` validates to a stable reference so an absent
 * value can fall back to the Host's base layer. The runner commits edits into
 * that reference in place and does not re-run the plugin, so every read goes
 * through `get()` instead of a value captured at activation time.
 */
function plainValue(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value
  const getter = (value as { get?: unknown }).get
  const writer = (value as Record<symbol, unknown>)[VOLATILE_WRITE]
  if (writer === undefined && typeof getter !== 'function') return value
  try {
    return (value as { get: () => unknown }).get()
  } catch {
    return undefined
  }
}

/** Normalize the validated row config into the shape the listeners read. */
export function resolveConfig(input: Partial<TeamoEffortConfig> | undefined): TeamoEffortConfig {
  const config = input ?? {}
  const providers = plainValue(config.providers)
  const endpoints = plainValue(config.endpoints)
  return {
    effort: normalizeEffort(plainValue(config.effort)),
    // An absent filter means the packaged default; an explicit empty array means
    // "no restriction", so the two cases stay distinguishable.
    providers:
      providers === undefined || providers === null
        ? [...DEFAULT_TEAMO_PROVIDERS]
        : normalizeList(providers),
    models: normalizeList(plainValue(config.models)),
    endpoints:
      endpoints === undefined || endpoints === null
        ? [...DEFAULT_TEAMO_ENDPOINTS]
        : normalizeList(endpoints),
  }
}

/** Read the request URL out of anything `fetch` accepts as its first argument. */
function requestUrl(input: unknown): string | undefined {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.href
  if (typeof Request !== 'undefined' && input instanceof Request) return input.url
  return undefined
}

/** Drop `reasoningEffort` without touching the frozen proposal. */
function withoutEffort(config: LlmCallConfig): LlmCallConfig {
  if (config.reasoningEffort === undefined) return config
  const { reasoningEffort: _dropped, ...rest } = config
  return rest
}

/**
 * Injectable field for the models that cannot carry a native `reasoningEffort`.
 *
 * The injector owns one process-wide wrapper around `fetch`. It stays a pure
 * pass-through except for a `POST` whose URL belongs to a configured endpoint,
 * whose JSON body names a model the request waterfall selected, and whose body
 * does not already carry the field.
 */
class OutboundInjector {
  private readonly efforts = new Map<string, TeamoEffort>()
  private readonly policy: () => WirePolicy
  private readonly warn: (message: string) => void

  constructor(policy: () => WirePolicy, warn: (message: string) => void) {
    this.policy = policy
    this.warn = warn
  }

  /** Bind one model id to a strength for the requests that follow. */
  remember(model: string, effort: TeamoEffort): void {
    this.efforts.set(model, effort)
  }

  /** Forget a model id, so a stale strength never survives the next step. */
  forget(model: string): void {
    this.efforts.delete(model)
  }

  /**
   * Install the wrapper and return its disposer.
   *
   * The disposer restores the previous implementation only when this wrapper is
   * still the installed one, so a later plugin in the chain keeps its own patch.
   */
  install(): () => void {
    const owner = globalThis as typeof globalThis & { fetch: typeof fetch }
    const previous = owner.fetch
    const injector = this
    const patched = async function teamoEffortFetch(
      input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> {
      const rewritten = injector.rewrite(input, init)
      return rewritten === undefined
        ? previous(input, init)
        : previous(rewritten.input, rewritten.init)
    }
    owner.fetch = patched as typeof fetch
    return () => {
      if (owner.fetch === patched) owner.fetch = previous
    }
  }

  /** Return a rewritten request body, or undefined to pass the request through. */
  private rewrite(
    input: RequestInfo | URL,
    init: RequestInit | undefined,
  ): { input: RequestInfo | URL; init: RequestInit } | undefined {
    if ((init?.method ?? 'GET').toUpperCase() !== 'POST') return undefined
    const endpoints = this.policy().endpoints
    if (endpoints.length === 0) return undefined
    const url = requestUrl(input)
    if (url === undefined || !endpointOwns(url, endpoints)) return undefined
    if (typeof init?.body !== 'string') return undefined

    let payload: unknown
    try {
      payload = JSON.parse(init.body)
    } catch {
      return undefined
    }
    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) return undefined

    const body = payload as Record<string, unknown>
    const model = typeof body.model === 'string' ? body.model : undefined
    if (model === undefined) return undefined
    const effort = this.efforts.get(model)
    if (effort === undefined) return undefined
    // The resolved adapter, or another extension, already stated its own value.
    if (body[TEAMO_EFFORT_FIELD] !== undefined) return undefined

    body[TEAMO_EFFORT_FIELD] = effort
    try {
      return { input, init: { ...init, body: JSON.stringify(body) } }
    } catch (error) {
      this.warn(`could not rewrite the TeamoRouter request body: ${String(error)}`)
      return undefined
    }
  }
}

/** What one exact model route advertises about reasoning. */
interface ModelCapabilities {
  /** The route advertises at least one reasoning effort. */
  readonly native: boolean
  /** The advertised effort ids. */
  readonly efforts: readonly string[]
}

const NO_CAPABILITIES: ModelCapabilities = { native: false, efforts: [] }

/**
 * Wire the preference into every model step of this profile.
 *
 * @param ctx - the plugin context; `settings` and `llm` are declared by {@link inject}.
 * @param config - the validated row config of this instance.
 */
export function apply(ctx: Context, config: TeamoEffortConfig): void {
  // Volatile fields are live references: the loader commits a settings write into
  // these handles in place and does not re-run this plugin, so every read goes
  // through the handles instead of a value captured at activation time.
  const readPolicy = (): TeamoEffortConfig => resolveConfig(config)

  const injector = new OutboundInjector(
    () => ({ endpoints: readPolicy().endpoints }),
    message => ctx.logger.warn(`[${TEAMO_EFFORT_NS}] ${message}`),
  )

  // The plugin ships its own settings page, so the Plugins page must not draw a
  // second editor for the same four fields.
  const settings = ctx.settings as typeof ctx.settings & {
    configure?: (presentation: { auto?: boolean }) => () => void
  }
  if (typeof settings.configure === 'function') {
    ctx.effect(() => settings.configure!({ auto: false }), 'teamo-effort: settings presentation')
  }

  // Which efforts a route advertises is adapter state, not user state: cache the
  // answer per route for the lifetime of this instance.
  const capabilitiesCache = new Map<string, Promise<ModelCapabilities>>()
  const capabilities = (provider: string, model: string): Promise<ModelCapabilities> => {
    const key = `${provider}\u0000${model}`
    let pending = capabilitiesCache.get(key)
    if (pending === undefined) {
      const llm = ctx.llm as typeof ctx.llm & {
        resolveModelInfo?: (provider: string, model: string) => Promise<{
          reasoning?: { efforts?: readonly { id: string }[] }
        }>
      }
      pending = typeof llm?.resolveModelInfo === 'function'
        ? llm.resolveModelInfo(provider, model).then(
            info => {
              const efforts = (info.reasoning?.efforts ?? []).map(entry => entry.id)
              return { native: efforts.length > 0, efforts }
            },
            () => NO_CAPABILITIES,
          )
        : Promise.resolve(NO_CAPABILITIES)
      capabilitiesCache.set(key, pending)
    }
    return pending
  }

  ctx.effect(() => injector.install(), 'teamo-effort: outbound TeamoRouter bodies')

  ctx.effect(
    () =>
      ctx.on('agent/request', async (_payload, next) => {
        const policy = readPolicy()
        const proposed = await next()
        const applies =
          matchesFilter(policy.providers, proposed.provider) &&
          matchesFilter(policy.models, proposed.model)

        if (!applies) {
          // The proposal belongs to a route this preference does not own.
          injector.forget(proposed.model)
          return proposed
        }

        const caps = await capabilities(proposed.provider, proposed.model)

        if (!caps.native) {
          // No native strength control on this route (the TeamoRouter state).
          // The plugin owns the field: a value the route cannot honor would be
          // rejected before dispatch, so the replacement never carries one.
          if (policy.effort === 'off') {
            injector.forget(proposed.model)
          } else {
            injector.remember(proposed.model, policy.effort)
          }
          return withoutEffort(proposed)
        }

        // The route exposes its own strength control — the composer slider that
        // dsh-effort-switcher draws. A value the proposal already carries is the
        // user's choice there, so this preference never overrides it.
        injector.forget(proposed.model)
        if (policy.effort === 'off' || !caps.efforts.includes(policy.effort)) return proposed
        if (proposed.reasoningEffort !== undefined) return proposed
        return {
          ...proposed,
          reasoningEffort: policy.effort as LlmCallConfig['reasoningEffort'],
        }
      }),
    'teamo-effort: request policy',
  )
}
