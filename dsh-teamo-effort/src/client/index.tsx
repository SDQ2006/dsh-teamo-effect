/**
 * Browser half of `dsh-teamo-effort`.
 *
 * It contributes two surfaces:
 *
 * - a settings page — "Teamo 模型强度" — that edits the Host config namespace
 *   {@link TEAMO_EFFORT_NS} through the shared `configForms` service;
 * - a compact composer slider for the models that have **no** native strength
 *   control, so dsh-effort-switcher (which owns the composer model seat and
 *   draws its own slider wherever an adapter advertises efforts) keeps working
 *   untouched: when its slider exists, this one stays hidden; when the model
 *   has no slider — the state of the TeamoRouter route today — this slider
 *   fills that gap with the same drag-and-release interaction.
 *
 * Cross-plugin collaboration is type-only: this module imports no value from
 * another plugin. `slots`, `locale`, and `configForms` arrive as Cordis
 * services, `modelDirectories` arrives through an optional nested inject, and
 * the namespace resolves from the live settings mirror rather than from a
 * profile-specific entry id.
 *
 * @module dsh-teamo-effort/client
 */
import * as React from 'react'
import {
  TEAMO_EFFORTS,
  TEAMO_EFFORT_NS,
  matchesFilter,
  normalizeEffort,
  splitList,
  type TeamoEffort,
} from '../shared.js'

/** Dictionaries this page owns. */
const NS = TEAMO_EFFORT_NS

/** Cordis services this Client half needs before it can render. */
export const inject = ['slots', 'locale', 'configForms']

/** Translate one key of this plugin's dictionary. */
type Translate = (key: string) => string

/** One namespace row of the Host settings document. */
interface SettingsNamespaceRow {
  ns: string
  schema?: unknown
  value?: unknown
}

/** Snapshot of the shared settings mirror. */
interface SettingsMirrorSnapshot {
  view?: { namespaces: SettingsNamespaceRow[] }
}

/** The shared settings mirror the Host document is folded into. */
interface SettingsMirror {
  getSnapshot(): SettingsMirrorSnapshot
  subscribe(listener: () => void): () => void
  ensure(): void
}

/** Snapshot of one editable namespace form. */
interface ConfigFormSnapshot {
  status: 'loading' | 'idle' | 'ready' | 'unavailable'
  value?: Record<string, unknown>
  writable: boolean
  revision?: number
}

/** One editable namespace form owned by `configForms`. */
interface ConfigForm {
  getSnapshot(): ConfigFormSnapshot
  subscribe(listener: () => void): () => void
  set(field: string, value: unknown): Promise<boolean>
}

/** Client face of the settings domain. */
interface ConfigForms {
  get(namespace: string): ConfigForm
  describe(): SettingsMirror
}

/** Client face of the slot registry. */
interface SlotService {
  inject(name: string, callback: () => unknown): () => void
  register(options: Record<string, unknown>, component: unknown): unknown
}

/** One client context created by a nested `ctx.inject`. */
interface ClientScope {
  slots: SlotService
  get(name: string): unknown
}

/** Client face of the locale registry. */
interface LocaleService {
  register(ns: string, dictionaries: Record<string, Record<string, string>>): () => void
  bind(ns: string): Translate
}

/** The subset of the Client context this plugin reads. */
interface ClientContext {
  slots: SlotService
  locale: LocaleService
  configForms: ConfigForms
  effect(callback: () => () => void, label?: string): () => void
  /** Cordis nested inject; waits for the named services before running. */
  inject?(services: string[], callback: (scope: ClientScope) => unknown): unknown
  logger?: { warn(message: string): void }
}

/** One model as the shared selection directory describes it. */
interface DirectoryModel {
  id: string
  name: string
  reasoning?: { efforts?: readonly { id: string }[] }
}

/** One provider group of the shared selection directory. */
interface DirectoryGroup {
  id: string
  name: string
  models: readonly DirectoryModel[]
}

/** Snapshot of one Session's model directory. */
interface DirectorySnapshot {
  current?: { provider: string; model: string; reasoningEffort?: string } | null
  groups?: readonly DirectoryGroup[]
}

/** Snapshot store owned by one Session's model directory. */
interface DirectoryStore {
  getSnapshot(): DirectorySnapshot
  subscribe(listener: () => void): () => void
}

/** One Session's model selection directory (`modelDirectories.directoryFor`). */
interface ModelDirectory {
  store: DirectoryStore
  load(): Promise<unknown>
}

/** Client face of the shared model directory service. */
interface ModelDirectories {
  directoryFor(sessionId: string): ModelDirectory
}

/** Style sheet id, so a reload never stacks a second copy. */
const STYLE_ID = 'dsh-teamo-effort/settings.css'

/** Page copy. */
const zh: Record<string, string> = {
  'section.title': 'Teamo 模型强度',
  'page.title': 'Teamo 模型强度',
  'page.description': '把选定的推理强度注入发往 TeamoRouter 的模型请求。修改后下一次请求立即生效，无需重启。',
  'page.sliderNote': '模型自带强度控件时（例如 DeepSeek 官方模型，或已为 Teamo 模型声明 reasoningEfforts），输入框里的滑块优先，本页不再覆盖它；没有原生控件的模型（TeamoRouter 现状）由输入框右侧的 Teamo 滑条控制，本页与它是同一个值。',
  'slider.label': 'Teamo 强度',
  'slider.title': 'Teamo 模型强度',
  'slider.hint': '点击展开滑条',
  'slider.off': 'Off',
  'slider.low': 'Low',
  'slider.medium': 'Medium',
  'slider.high': 'High',
  'effort.label': '推理强度',
  'effort.off': 'Off（跟随上游默认）',
  'effort.low': 'Low',
  'effort.medium': 'Medium',
  'effort.high': 'High',
  'effort.off.hint': '不下发 reasoning_effort，完全由 TeamoRouter 与该模型的默认行为决定。',
  'effort.low.hint': '轻量推理：适合日常问答和低延迟场景。',
  'effort.medium.hint': '均衡推理：质量与耗时的折中。',
  'effort.high.hint': '重度推理：适合复杂任务，token 消耗更高。',
  'filter.providers': '适用 provider',
  'filter.models': '适用 model',
  'filter.providers.hint': '逗号分隔，留空表示所有 provider；* 为通配。',
  'filter.models.hint': '逗号分隔，留空表示所有 model；* 为通配。',
  'filter.save': '保存过滤',
  'endpoint.note': '注入目标：',
  'state.loading': '正在读取配置…',
  'state.unavailable': '配置尚未加载，请确认 teamo-effort 插件行已生效。',
  'state.readonly': '当前 profile 不接受表单写入。',
  'error.write': '保存失败，已回滚到 Host 上的实际值。',
}

const en: Record<string, string> = {
  'section.title': 'Teamo model strength',
  'page.title': 'Teamo model strength',
  'page.description': 'Injects the selected reasoning strength into model requests addressed to TeamoRouter. A change applies to the next request, without a restart.',
  'page.sliderNote': 'When the model already has a strength control (a DeepSeek official model, or a Teamo model whose reasoningEfforts are declared), the composer slider wins and this page never overrides it; models without a native control (the TeamoRouter state) are driven by the Teamo slider at the right of the composer, which edits this same value.',
  'slider.label': 'Teamo strength',
  'slider.title': 'Teamo model strength',
  'slider.hint': 'Click to open the slider',
  'slider.off': 'Off',
  'slider.low': 'Low',
  'slider.medium': 'Medium',
  'slider.high': 'High',
  'effort.label': 'Reasoning strength',
  'effort.off': 'Off (gateway default)',
  'effort.low': 'Low',
  'effort.medium': 'Medium',
  'effort.high': 'High',
  'effort.off.hint': 'Sends no reasoning_effort; the gateway and the model keep their own default.',
  'effort.low.hint': 'Light reasoning for routine, latency-sensitive work.',
  'effort.medium.hint': 'Balanced reasoning: a trade-off between quality and time.',
  'effort.high.hint': 'Heavy reasoning for complex work; more reasoning tokens.',
  'filter.providers': 'Applies to providers',
  'filter.models': 'Applies to models',
  'filter.providers.hint': 'Comma separated; empty means every provider. * is a wildcard.',
  'filter.models.hint': 'Comma separated; empty means every model. * is a wildcard.',
  'filter.save': 'Save filters',
  'endpoint.note': 'Injected into: ',
  'state.loading': 'Reading configuration…',
  'state.unavailable': 'The configuration is not served yet; check that the teamo-effort row is active.',
  'state.readonly': 'This profile does not accept form writes.',
  'error.write': 'Save failed; the form was rolled back to the Host value.',
}

/** Page styles, expressed with the host theme tokens. */
const css = `
.dte-page { display: flex; flex-direction: column; gap: 18px; color: var(--dsw-alias-label-primary); }
.dte-head { display: flex; flex-direction: column; gap: 6px; }
.dte-title { margin: 0; font-size: 16px; line-height: 24px; font-weight: 600; }
.dte-desc { margin: 0; font-size: 13px; line-height: 20px; color: var(--dsw-alias-label-secondary); }
.dte-card { display: flex; flex-direction: column; gap: 12px; padding: 14px; border: 1px solid var(--dsw-alias-border-l1); border-radius: var(--dsw-radius-lg, 12px); background: var(--dsw-alias-bg-base, transparent); }
.dte-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.dte-label { font-size: 13px; line-height: 20px; color: var(--dsw-alias-label-primary); }
.dte-select { min-width: 220px; height: 30px; padding: 0 8px; font: inherit; font-size: 13px; color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-base, transparent); border: 1px solid var(--dsw-alias-border-l2); border-radius: var(--dsw-radius-sm, 8px); }
.dte-select:disabled { color: var(--dsw-alias-label-dimmed); cursor: default; }
.dte-select:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--dsw-alias-border-l3); }
.dte-hint { margin: 0; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-caption); }
.dte-filters { display: flex; flex-direction: column; gap: 10px; padding-top: 4px; border-top: 1px solid var(--dsw-alias-border-l1); }
.dte-field { display: flex; flex-direction: column; gap: 4px; }
.dte-input { height: 30px; padding: 0 8px; font: inherit; font-size: 13px; color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-base, transparent); border: 1px solid var(--dsw-alias-border-l2); border-radius: var(--dsw-radius-sm, 8px); }
.dte-input:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--dsw-alias-border-l3); }
.dte-note { font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-tertiary); word-break: break-all; }
.dte-error { margin: 0; font-size: 12px; line-height: 18px; color: var(--dsw-alias-state-error-primary); }
.dte-root { --dte-panel-bg: linear-gradient(var(--dsw-specific-menu, transparent), var(--dsw-specific-menu, transparent)), var(--dsw-alias-bg-base, #fff); position: relative; display: inline-flex; }
.dte-trigger { display: inline-flex; align-items: center; gap: 4px; height: 28px; padding: 0 4px 0 8px; border: none; border-radius: var(--dsw-radius-sm, 8px); background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 12px; line-height: 20px; cursor: pointer; }
.dte-trigger:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); }
.dte-trigger:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--dsw-alias-border-l3); }
.dte-trigger:disabled { color: var(--dsw-alias-label-dimmed); cursor: default; }
.dte-triggerName { color: var(--dsw-alias-label-caption); white-space: nowrap; }
.dte-triggerValue { color: var(--dsw-alias-label-primary); font-weight: 500; white-space: nowrap; }
.dte-chevron { color: var(--dsw-alias-label-caption); flex: none; transition: transform .12s; }
.dte-chevronOpen { transform: rotate(180deg); }
.dte-menu { position: absolute; right: 0; bottom: calc(100% + 8px); z-index: 9999; width: min(240px, calc(100vw - 32px)); padding: 8px 10px 10px; display: flex; flex-direction: column; gap: 2px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: var(--dsw-radius-lg, 10px); background: var(--dte-panel-bg); box-shadow: var(--dsw-shadow-lv3); animation: dte-pop .12s ease-out; }
.dte-menuHead { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-secondary); }
.dte-menuValue { color: var(--dsw-alias-label-primary); font-weight: 600; }
.dte-sliderRail { position: relative; height: 26px; margin: 10px 0 6px; }
.dte-sliderGroove { position: absolute; inset: 0; overflow: hidden; corner-shape: round; border-radius: 13px; pointer-events: none; }
.dte-sliderTrack { position: absolute; inset: 0; corner-shape: round; border-radius: 13px; background: var(--dsw-alias-interactive-bg-hover); }
.dte-sliderFill { position: absolute; z-index: 1; top: 0; bottom: 0; left: 0; overflow: hidden; corner-shape: round; border-radius: 13px; background: #4c8dff; transition: width .2s ease; }
.dte-sliderBloom { position: absolute; inset: 0; background: linear-gradient(90deg, #4c8dff 0%, #7b6cff 52%, #b56bff 100%); opacity: 0; transition: opacity .2s ease; }
.dte-sliderFillMax .dte-sliderBloom { opacity: 1; }
.dte-sliderKnob { position: absolute; z-index: 4; top: 50%; width: 30px; height: 30px; margin-left: -15px; pointer-events: none; transform: translateY(-50%); transition: left .2s ease; }
.dte-sliderKnobFace { width: 100%; height: 100%; corner-shape: round; border-radius: 50%; background: #ffffff; }
.dte-sliderTicks { position: absolute; z-index: 2; top: 0; right: 15px; bottom: 0; left: 15px; display: flex; align-items: center; justify-content: space-between; pointer-events: none; }
.dte-sliderTick { width: 4px; height: 4px; corner-shape: round; border-radius: 50%; background: rgb(255 255 255 / 38%); }
.dte-sliderInput { -webkit-appearance: none; appearance: none; position: absolute; z-index: 3; inset: 0; width: 100%; height: 26px; margin: 0; opacity: 0; cursor: pointer; background: transparent; }
.dte-sliderInput:disabled { cursor: default; }
.dte-menuDesc { margin: 2px 0 0; color: var(--dsw-alias-label-caption); font-size: 11px; line-height: 15px; }
@keyframes dte-pop { from { opacity: 0; transform: translateY(6px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
`

/** Insert the page style sheet once, and remove it with this Client run. */
function installStyles(): () => void {
  if (typeof document === 'undefined') return () => {}
  const existing = document.querySelector(`style[data-plugin-css="${STYLE_ID}"]`)
  if (existing !== null) return () => {}
  const tag = document.createElement('style')
  tag.dataset.plugin = NS
  tag.dataset.pluginCss = STYLE_ID
  tag.textContent = css
  document.head.appendChild(tag)
  return () => {
    tag.remove()
  }
}

/**
 * Match the namespace this plugin owns inside the settings document.
 *
 * A profile may nest bundle rows under an include layer (`include:teamo-effort`),
 * so the entry is recognized by its bare name or by a `:<name>` suffix.
 */
function isOwnNamespace(ns: string): boolean {
  return ns === NS || ns.endsWith(`:${NS}`)
}

/** Resolve this plugin's namespace from the live settings mirror. */
function findNamespace(mirror: SettingsMirror): string | undefined {
  const rows = mirror.getSnapshot().view?.namespaces ?? []
  return rows.find(row => isOwnNamespace(row.ns))?.ns
}

/** Read one string-array field out of a form value. */
function listOf(value: Record<string, unknown> | undefined, field: string): string[] {
  const raw = value?.[field]
  return Array.isArray(raw) ? raw.filter((entry): entry is string => typeof entry === 'string') : []
}

/** Props of one mounted settings page. */
interface PageProps {
  forms: ConfigForms
  namespace: string
  t: Translate
}

/**
 * The settings page.
 *
 * The form controller is derived from the shared settings mirror, so the page
 * shows the Host value even when it changes from somewhere else, and a rejected
 * write falls back to the Host state instead of holding an unsaved value.
 */
function TeamoEffortPage({ forms, namespace, t }: PageProps): React.ReactElement {
  const form = React.useMemo(() => forms.get(namespace), [forms, namespace])
  const subscribe = React.useCallback(
    (listener: () => void) => form.subscribe(listener),
    [form],
  )
  const snapshot = React.useSyncExternalStore(subscribe, () => form.getSnapshot(), () => form.getSnapshot())

  const [providersDraft, setProvidersDraft] = React.useState<string | undefined>(undefined)
  const [modelsDraft, setModelsDraft] = React.useState<string | undefined>(undefined)
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const value = snapshot.status === 'ready' ? snapshot.value : undefined
  const effort = normalizeEffort(value?.effort)
  const providers = listOf(value, 'providers')
  const models = listOf(value, 'models')
  const endpoints = listOf(value, 'endpoints')
  const disabled = busy || !snapshot.writable || snapshot.status !== 'ready'

  const write = React.useCallback(
    async (field: string, next: unknown) => {
      setBusy(true)
      setError(null)
      try {
        const accepted = await form.set(field, next)
        if (!accepted) setError(t('error.write'))
        return accepted
      } catch (caught) {
        setError(caught instanceof Error && caught.message.length > 0 ? caught.message : t('error.write'))
        return false
      } finally {
        setBusy(false)
      }
    },
    [form, t],
  )

  const commitFilter = React.useCallback(
    async (field: 'providers' | 'models', draft: string | undefined) => {
      if (draft === undefined) return
      const accepted = await write(field, splitList(draft))
      if (accepted) {
        if (field === 'providers') setProvidersDraft(undefined)
        else setModelsDraft(undefined)
      }
    },
    [write],
  )

  if (snapshot.status === 'unavailable') {
    return React.createElement('div', { className: 'dte-page' }, React.createElement('p', { className: 'dte-hint' }, t('state.unavailable')))
  }
  if (snapshot.status === 'loading' || snapshot.status === 'idle') {
    return React.createElement('div', { className: 'dte-page' }, React.createElement('p', { className: 'dte-hint' }, t('state.loading')))
  }

  const providerText = providersDraft ?? providers.join(', ')
  const modelText = modelsDraft ?? models.join(', ')

  return React.createElement(
    'div',
    { className: 'dte-page' },
    React.createElement(
      'header',
      { className: 'dte-head' },
      React.createElement('h2', { className: 'dte-title' }, t('page.title')),
      React.createElement('p', { className: 'dte-desc' }, t('page.description')),
      React.createElement('p', { className: 'dte-hint' }, t('page.sliderNote')),
    ),
    React.createElement(
      'section',
      { className: 'dte-card' },
      React.createElement(
        'label',
        { className: 'dte-row' },
        React.createElement('span', { className: 'dte-label' }, t('effort.label')),
        React.createElement(
          'select',
          {
            className: 'dte-select',
            value: effort,
            disabled,
            onChange: (event: React.ChangeEvent<HTMLSelectElement>) => {
              void write('effort', event.target.value as TeamoEffort)
            },
          },
          TEAMO_EFFORTS.map(level =>
            React.createElement('option', { key: level, value: level }, t(`effort.${level}`)),
          ),
        ),
      ),
      React.createElement('p', { className: 'dte-hint' }, t(`effort.${effort}.hint`)),
      error === null ? null : React.createElement('p', { className: 'dte-error', role: 'status' }, error),
      !snapshot.writable ? React.createElement('p', { className: 'dte-hint' }, t('state.readonly')) : null,
      React.createElement(
        'div',
        { className: 'dte-filters' },
        React.createElement(
          'label',
          { className: 'dte-field' },
          React.createElement('span', { className: 'dte-label' }, t('filter.providers')),
          React.createElement('input', {
            className: 'dte-input',
            type: 'text',
            value: providerText,
            disabled: busy || !snapshot.writable,
            placeholder: 'teamo',
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => setProvidersDraft(event.target.value),
            onBlur: () => {
              void commitFilter('providers', providersDraft)
            },
            onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => {
              if (event.key === 'Enter') void commitFilter('providers', providersDraft)
            },
          }),
          React.createElement('span', { className: 'dte-hint' }, t('filter.providers.hint')),
        ),
        React.createElement(
          'label',
          { className: 'dte-field' },
          React.createElement('span', { className: 'dte-label' }, t('filter.models')),
          React.createElement('input', {
            className: 'dte-input',
            type: 'text',
            value: modelText,
            disabled: busy || !snapshot.writable,
            placeholder: 'deepseek-v4-pro, gpt-5.5',
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => setModelsDraft(event.target.value),
            onBlur: () => {
              void commitFilter('models', modelsDraft)
            },
            onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => {
              if (event.key === 'Enter') void commitFilter('models', modelsDraft)
            },
          }),
          React.createElement('span', { className: 'dte-hint' }, t('filter.models.hint')),
        ),
        React.createElement(
          'p',
          { className: 'dte-note' },
          `${t('endpoint.note')}${endpoints.length === 0 ? '—' : endpoints.join(', ')}`,
        ),
      ),
    ),
  )
}

/** The effort at one slider stop, clamped to the weakest level. */
export function effortAt(index: number): TeamoEffort {
  return TEAMO_EFFORTS[index] ?? 'off'
}

/** Keys that move a native range input; the value is committed on keyup. */
const COMMIT_KEYS = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
  'PageUp',
  'PageDown',
])

/** Props of one mounted composer slider. */
interface SliderProps {
  sessionId: string
  directories: ModelDirectories
  forms: ConfigForms
  namespace: string
  t: Translate
}

/**
 * Compact composer control for a model without a native strength control.
 *
 * dsh-effort-switcher owns the composer model seat and draws a strength slider
 * for every model whose adapter advertises efforts. This control deliberately
 * appears only in the complementary case — a model in this plugin's filter that
 * has no native slider — so the two controls never compete. Like the switcher,
 * the slider itself stays hidden until the trigger is opened: the composer only
 * shows `Teamo 强度 · High`, and the panel repeats the same drag-and-release
 * interaction (draft while dragging, one committed level on release, the thumb
 * pinned until the Host value catches up).
 */
function TeamoEffortSlider({ sessionId, directories, forms, namespace, t }: SliderProps): React.ReactElement | null {
  const form = React.useMemo(() => forms.get(namespace), [forms, namespace])
  const subscribeForm = React.useCallback((listener: () => void) => form.subscribe(listener), [form])
  const formSnapshot = React.useSyncExternalStore(
    subscribeForm,
    () => form.getSnapshot(),
    () => form.getSnapshot(),
  )

  const directory = React.useMemo(() => directories.directoryFor(sessionId), [directories, sessionId])
  const subscribeDirectory = React.useCallback(
    (listener: () => void) => directory.store.subscribe(listener),
    [directory],
  )
  const directorySnapshot = React.useSyncExternalStore(
    subscribeDirectory,
    () => directory.store.getSnapshot(),
    () => directory.store.getSnapshot(),
  )

  React.useEffect(() => {
    void directory.load().catch(() => {})
  }, [directory])

  const [draft, setDraft] = React.useState<number | null>(null)
  const [pending, setPending] = React.useState<number | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement | null>(null)

  // Click outside or Escape closes the panel, exactly like the switcher's menu.
  React.useEffect(() => {
    if (!open || typeof document === 'undefined') return
    const closeOutside = (event: MouseEvent): void => {
      if (rootRef.current?.contains(event.target as Node) === true) return
      setOpen(false)
    }
    const closeEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', closeOutside)
    document.addEventListener('keydown', closeEscape)
    return () => {
      document.removeEventListener('mousedown', closeOutside)
      document.removeEventListener('keydown', closeEscape)
    }
  }, [open])

  const value = formSnapshot.status === 'ready' ? formSnapshot.value : undefined
  const current = directorySnapshot.current
  const model = current === undefined || current === null
    ? undefined
    : directorySnapshot.groups
        ?.find(group => group.id === current.provider)
        ?.models.find(entry => entry.id === current.model)
  const effort = normalizeEffort(value?.effort)

  // Keep the pinned thumb only until the Host reports the committed value.
  React.useEffect(() => {
    if (pending !== null && effortAt(pending) === effort) setPending(null)
  }, [pending, effort])

  if (value === undefined || current === undefined || current === null || model === undefined) return null

  // A native slider exists: dsh-effort-switcher (or the shipped selector) owns it.
  if ((model.reasoning?.efforts?.length ?? 0) > 0) return null
  if (!matchesFilter(listOf(value, 'providers'), current.provider)) return null
  if (!matchesFilter(listOf(value, 'models'), current.model)) return null

  const last = TEAMO_EFFORTS.length - 1
  const shown = draft ?? pending ?? Math.max(TEAMO_EFFORTS.indexOf(effort), 0)
  const level = effortAt(shown)
  const disabled = busy || !formSnapshot.writable

  const commit = (next: number | null | undefined): void => {
    const index = next ?? draft
    setDraft(null)
    if (index === null || index === undefined || index < 0 || index > last) return
    const nextLevel = effortAt(index)
    if (nextLevel === effort) {
      setPending(null)
      return
    }
    setPending(index)
    setBusy(true)
    void (async () => {
      try {
        await form.set('effort', nextLevel)
      } catch {
        // The settings page reports write failures; the thumb snaps back below.
        setPending(null)
      } finally {
        setBusy(false)
      }
    })()
  }

  return React.createElement(
    'div',
    { className: 'dte-root', ref: rootRef, 'data-dsh-plugin': NS },
    React.createElement(
      'button',
      {
        type: 'button',
        className: 'dte-trigger',
        'aria-haspopup': 'dialog',
        'aria-expanded': open,
        'aria-label': `${t('slider.title')}：${t(`slider.${level}`)}`,
        title: `${t('slider.title')}：${t(`slider.${level}`)}（${t('slider.hint')}）`,
        disabled,
        onClick: () => setOpen(value => !value),
      },
      React.createElement('span', { className: 'dte-triggerName' }, t('slider.label')),
      React.createElement('span', { className: 'dte-triggerValue' }, t(`slider.${level}`)),
      React.createElement(
        'svg',
        {
          className: open ? 'dte-chevron dte-chevronOpen' : 'dte-chevron',
          width: 14,
          height: 14,
          viewBox: '0 0 14 14',
          fill: 'none',
          'aria-hidden': true,
        },
        React.createElement('path', {
          d: 'M3.2 5.4 7 9.2l3.8-3.8',
          stroke: 'currentColor',
          strokeWidth: 1.4,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
      ),
    ),
    open
      ? React.createElement(TeamoEffortPanel, {
          shown,
          last,
          level,
          disabled,
          t,
          onDraft: (index: number) => setDraft(index),
          onCommit: (index: number) => commit(index),
        })
      : null,
  )
}

/** Props of the hidden strength panel. */
interface PanelProps {
  shown: number
  last: number
  level: TeamoEffort
  disabled: boolean
  t: Translate
  onDraft(index: number): void
  onCommit(index: number): void
}

/**
 * The panel behind the trigger: the same rail, ticks and knob as the switcher's
 * strength slider, for the four Teamo stops. Exported so a test can render it
 * without opening the trigger.
 */
export function TeamoEffortPanel({ shown, last, level, disabled, t, onDraft, onCommit }: PanelProps): React.ReactElement {
  const percent = last === 0 ? 100 : Math.round((shown / last) * 100)
  const radius = 15
  const travel = `calc(${percent}% + ${Math.round(radius - (radius * 2 * percent) / 100)}px)`
  const knobLeft = shown >= last ? `calc(100% - ${radius}px)` : percent <= 0 ? `${radius}px` : travel
  const fillWidth = percent <= 0 ? '0px' : travel
  const readIndex = (event: React.SyntheticEvent<HTMLInputElement>): number => Number(event.currentTarget.value)

  return React.createElement(
    'div',
    { className: 'dte-menu', role: 'dialog', 'aria-label': t('slider.title') },
    React.createElement(
      'div',
      { className: 'dte-menuHead' },
      React.createElement('span', null, t('slider.title')),
      React.createElement('strong', { className: 'dte-menuValue' }, t(`slider.${level}`)),
    ),
    React.createElement(
      'div',
      { className: 'dte-sliderRail' },
      React.createElement(
        'div',
        { className: 'dte-sliderGroove', 'aria-hidden': true },
        React.createElement('div', { className: 'dte-sliderTrack' }),
        React.createElement(
          'div',
          {
            className: shown >= last ? 'dte-sliderFill dte-sliderFillMax' : 'dte-sliderFill',
            style: { width: fillWidth },
          },
          React.createElement('div', { className: 'dte-sliderBloom' }),
        ),
      ),
      React.createElement(
        'div',
        { className: 'dte-sliderKnob', 'aria-hidden': true, style: { left: knobLeft } },
        React.createElement('div', { className: 'dte-sliderKnobFace' }),
      ),
      React.createElement(
        'div',
        { className: 'dte-sliderTicks', 'aria-hidden': true },
        TEAMO_EFFORTS.map((stop, index) =>
          React.createElement('span', {
            key: stop,
            className: index <= shown ? 'dte-sliderTick dte-sliderTickActive' : 'dte-sliderTick',
          }),
        ),
      ),
      React.createElement('input', {
        className: 'dte-sliderInput',
        type: 'range',
        min: 0,
        max: last,
        step: 1,
        value: shown,
        disabled,
        'aria-label': `${t('slider.title')}：${t(`slider.${level}`)}`,
        'aria-valuetext': t(`slider.${level}`),
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => onDraft(readIndex(event)),
        onMouseUp: (event: React.MouseEvent<HTMLInputElement>) => onCommit(readIndex(event)),
        onTouchEnd: (event: React.TouchEvent<HTMLInputElement>) => onCommit(readIndex(event)),
        onKeyUp: (event: React.KeyboardEvent<HTMLInputElement>) => {
          if (COMMIT_KEYS.has(event.key)) onCommit(readIndex(event))
        },
      }),
    ),
    React.createElement('p', { className: 'dte-menuDesc' }, t(`effort.${level}.hint`)),
  )
}

/** Contribute the composer slider while the namespace and the directory service exist. */
function mountComposerSlider(ctx: ClientContext, t: Translate): () => void {
  const mirror = ctx.configForms.describe()
  let mounted: string | undefined
  let registration: (() => void) | undefined

  const sync = (): void => {
    const namespace = findNamespace(mirror)
    if (namespace === mounted) return
    registration?.()
    registration = undefined
    mounted = namespace
    if (namespace === undefined || typeof ctx.inject !== 'function') return
    const dispose = ctx.inject(['slots', 'modelDirectories'], scope => {
      const directories = scope.get('modelDirectories') as ModelDirectories | undefined
      if (directories === undefined || typeof directories.directoryFor !== 'function') return () => {}
      return scope.slots.inject('conversation.input.right', () =>
        scope.slots.register(
          { name: 'conversation.input.right', id: NS, order: 40 },
          (props: { sessionId: string }) =>
            React.createElement(TeamoEffortSlider, {
              sessionId: props.sessionId,
              directories,
              forms: ctx.configForms,
              namespace,
              t,
            }),
        ),
      )
    })
    registration = typeof dispose === 'function' ? (dispose as () => void) : undefined
  }

  mirror.ensure()
  const unsubscribe = mirror.subscribe(sync)
  sync()

  return () => {
    unsubscribe()
    registration?.()
    registration = undefined
    mounted = undefined
  }
}

/**
 * Contribute the settings page while the Host serves this plugin's namespace.
 *
 * Registration follows the settings mirror: the namespace may be served under a
 * profile prefix, and it may arrive after the first read.
 */
function mountSettingsPage(ctx: ClientContext, t: Translate): () => void {
  const mirror = ctx.configForms.describe()
  let registration: (() => void) | undefined
  let mounted: string | undefined

  const sync = (): void => {
    const namespace = findNamespace(mirror)
    if (namespace === mounted && registration !== undefined) return
    registration?.()
    registration = undefined
    mounted = namespace
    if (namespace === undefined) return
    registration = ctx.slots.inject('settings.section', () =>
      ctx.slots.register(
        {
          name: 'settings.section',
          id: NS,
          order: 22,
          // A thunk is re-read on every projection, so the nav label follows the
          // active locale without re-registering the page.
          label: () => t('section.title'),
        },
        () => React.createElement(TeamoEffortPage, { forms: ctx.configForms, namespace, t }),
      ),
    )
  }

  mirror.ensure()
  const unsubscribe = mirror.subscribe(sync)
  sync()

  return () => {
    unsubscribe()
    registration?.()
    registration = undefined
    mounted = undefined
  }
}

/**
 * Mount the browser half.
 *
 * @param ctx - the Client plugin context; every service read is declared in {@link inject}.
 */
export function apply(ctx: ClientContext): void {
  const t = ctx.locale.bind(NS)
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'teamo-effort: dictionaries')
  ctx.effect(() => installStyles(), 'teamo-effort: settings styles')
  ctx.effect(() => mountSettingsPage(ctx, t), 'teamo-effort: settings page')
  ctx.effect(() => mountComposerSlider(ctx, t), 'teamo-effort: composer slider')
}
