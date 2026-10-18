window.__ModuleLoader__.load({ id: "dsh-teamo-effort", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.tsx
var index_exports = {};
__export(index_exports, {
  TeamoEffortPanel: () => TeamoEffortPanel,
  apply: () => apply,
  effortAt: () => effortAt,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);
var React = __toESM(require("react"), 1);

// src/shared.ts
var TEAMO_EFFORT_NS = "teamo-effort";
var TEAMO_EFFORTS = ["off", "low", "medium", "high"];
function normalizeEffort(value) {
  return value === "low" || value === "medium" || value === "high" ? value : "off";
}
function matchesFilter(filter, value) {
  if (filter === void 0 || filter.length === 0) return true;
  return filter.some((entry) => entry === "*" || entry === value);
}
function splitList(text) {
  return text.split(",").map((entry) => entry.trim()).filter((entry) => entry.length > 0);
}

// src/client/index.tsx
var NS = TEAMO_EFFORT_NS;
var inject = ["slots", "locale", "configForms"];
var STYLE_ID = "dsh-teamo-effort/settings.css";
var zh = {
  "section.title": "Teamo \u6A21\u578B\u5F3A\u5EA6",
  "page.title": "Teamo \u6A21\u578B\u5F3A\u5EA6",
  "page.description": "\u628A\u9009\u5B9A\u7684\u63A8\u7406\u5F3A\u5EA6\u6CE8\u5165\u53D1\u5F80 TeamoRouter \u7684\u6A21\u578B\u8BF7\u6C42\u3002\u4FEE\u6539\u540E\u4E0B\u4E00\u6B21\u8BF7\u6C42\u7ACB\u5373\u751F\u6548\uFF0C\u65E0\u9700\u91CD\u542F\u3002",
  "page.sliderNote": "\u6A21\u578B\u81EA\u5E26\u5F3A\u5EA6\u63A7\u4EF6\u65F6\uFF08\u4F8B\u5982 DeepSeek \u5B98\u65B9\u6A21\u578B\uFF0C\u6216\u5DF2\u4E3A Teamo \u6A21\u578B\u58F0\u660E reasoningEfforts\uFF09\uFF0C\u8F93\u5165\u6846\u91CC\u7684\u6ED1\u5757\u4F18\u5148\uFF0C\u672C\u9875\u4E0D\u518D\u8986\u76D6\u5B83\uFF1B\u6CA1\u6709\u539F\u751F\u63A7\u4EF6\u7684\u6A21\u578B\uFF08TeamoRouter \u73B0\u72B6\uFF09\u7531\u8F93\u5165\u6846\u53F3\u4FA7\u7684 Teamo \u6ED1\u6761\u63A7\u5236\uFF0C\u672C\u9875\u4E0E\u5B83\u662F\u540C\u4E00\u4E2A\u503C\u3002",
  "slider.label": "Teamo \u5F3A\u5EA6",
  "slider.title": "Teamo \u6A21\u578B\u5F3A\u5EA6",
  "slider.hint": "\u70B9\u51FB\u5C55\u5F00\u6ED1\u6761",
  "slider.off": "Off",
  "slider.low": "Low",
  "slider.medium": "Medium",
  "slider.high": "High",
  "effort.label": "\u63A8\u7406\u5F3A\u5EA6",
  "effort.off": "Off\uFF08\u8DDF\u968F\u4E0A\u6E38\u9ED8\u8BA4\uFF09",
  "effort.low": "Low",
  "effort.medium": "Medium",
  "effort.high": "High",
  "effort.off.hint": "\u4E0D\u4E0B\u53D1 reasoning_effort\uFF0C\u5B8C\u5168\u7531 TeamoRouter \u4E0E\u8BE5\u6A21\u578B\u7684\u9ED8\u8BA4\u884C\u4E3A\u51B3\u5B9A\u3002",
  "effort.low.hint": "\u8F7B\u91CF\u63A8\u7406\uFF1A\u9002\u5408\u65E5\u5E38\u95EE\u7B54\u548C\u4F4E\u5EF6\u8FDF\u573A\u666F\u3002",
  "effort.medium.hint": "\u5747\u8861\u63A8\u7406\uFF1A\u8D28\u91CF\u4E0E\u8017\u65F6\u7684\u6298\u4E2D\u3002",
  "effort.high.hint": "\u91CD\u5EA6\u63A8\u7406\uFF1A\u9002\u5408\u590D\u6742\u4EFB\u52A1\uFF0Ctoken \u6D88\u8017\u66F4\u9AD8\u3002",
  "filter.providers": "\u9002\u7528 provider",
  "filter.models": "\u9002\u7528 model",
  "filter.providers.hint": "\u9017\u53F7\u5206\u9694\uFF0C\u7559\u7A7A\u8868\u793A\u6240\u6709 provider\uFF1B* \u4E3A\u901A\u914D\u3002",
  "filter.models.hint": "\u9017\u53F7\u5206\u9694\uFF0C\u7559\u7A7A\u8868\u793A\u6240\u6709 model\uFF1B* \u4E3A\u901A\u914D\u3002",
  "filter.save": "\u4FDD\u5B58\u8FC7\u6EE4",
  "endpoint.note": "\u6CE8\u5165\u76EE\u6807\uFF1A",
  "state.loading": "\u6B63\u5728\u8BFB\u53D6\u914D\u7F6E\u2026",
  "state.unavailable": "\u914D\u7F6E\u5C1A\u672A\u52A0\u8F7D\uFF0C\u8BF7\u786E\u8BA4 teamo-effort \u63D2\u4EF6\u884C\u5DF2\u751F\u6548\u3002",
  "state.readonly": "\u5F53\u524D profile \u4E0D\u63A5\u53D7\u8868\u5355\u5199\u5165\u3002",
  "error.write": "\u4FDD\u5B58\u5931\u8D25\uFF0C\u5DF2\u56DE\u6EDA\u5230 Host \u4E0A\u7684\u5B9E\u9645\u503C\u3002"
};
var en = {
  "section.title": "Teamo model strength",
  "page.title": "Teamo model strength",
  "page.description": "Injects the selected reasoning strength into model requests addressed to TeamoRouter. A change applies to the next request, without a restart.",
  "page.sliderNote": "When the model already has a strength control (a DeepSeek official model, or a Teamo model whose reasoningEfforts are declared), the composer slider wins and this page never overrides it; models without a native control (the TeamoRouter state) are driven by the Teamo slider at the right of the composer, which edits this same value.",
  "slider.label": "Teamo strength",
  "slider.title": "Teamo model strength",
  "slider.hint": "Click to open the slider",
  "slider.off": "Off",
  "slider.low": "Low",
  "slider.medium": "Medium",
  "slider.high": "High",
  "effort.label": "Reasoning strength",
  "effort.off": "Off (gateway default)",
  "effort.low": "Low",
  "effort.medium": "Medium",
  "effort.high": "High",
  "effort.off.hint": "Sends no reasoning_effort; the gateway and the model keep their own default.",
  "effort.low.hint": "Light reasoning for routine, latency-sensitive work.",
  "effort.medium.hint": "Balanced reasoning: a trade-off between quality and time.",
  "effort.high.hint": "Heavy reasoning for complex work; more reasoning tokens.",
  "filter.providers": "Applies to providers",
  "filter.models": "Applies to models",
  "filter.providers.hint": "Comma separated; empty means every provider. * is a wildcard.",
  "filter.models.hint": "Comma separated; empty means every model. * is a wildcard.",
  "filter.save": "Save filters",
  "endpoint.note": "Injected into: ",
  "state.loading": "Reading configuration\u2026",
  "state.unavailable": "The configuration is not served yet; check that the teamo-effort row is active.",
  "state.readonly": "This profile does not accept form writes.",
  "error.write": "Save failed; the form was rolled back to the Host value."
};
var css = `
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
`;
function installStyles() {
  if (typeof document === "undefined") return () => {
  };
  const existing = document.querySelector(`style[data-plugin-css="${STYLE_ID}"]`);
  if (existing !== null) return () => {
  };
  const tag = document.createElement("style");
  tag.dataset.plugin = NS;
  tag.dataset.pluginCss = STYLE_ID;
  tag.textContent = css;
  document.head.appendChild(tag);
  return () => {
    tag.remove();
  };
}
function isOwnNamespace(ns) {
  return ns === NS || ns.endsWith(`:${NS}`);
}
function findNamespace(mirror) {
  const rows = mirror.getSnapshot().view?.namespaces ?? [];
  return rows.find((row) => isOwnNamespace(row.ns))?.ns;
}
function listOf(value, field) {
  const raw = value?.[field];
  return Array.isArray(raw) ? raw.filter((entry) => typeof entry === "string") : [];
}
function TeamoEffortPage({ forms, namespace, t }) {
  const form = React.useMemo(() => forms.get(namespace), [forms, namespace]);
  const subscribe = React.useCallback(
    (listener) => form.subscribe(listener),
    [form]
  );
  const snapshot = React.useSyncExternalStore(subscribe, () => form.getSnapshot(), () => form.getSnapshot());
  const [providersDraft, setProvidersDraft] = React.useState(void 0);
  const [modelsDraft, setModelsDraft] = React.useState(void 0);
  const [error, setError] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const value = snapshot.status === "ready" ? snapshot.value : void 0;
  const effort = normalizeEffort(value?.effort);
  const providers = listOf(value, "providers");
  const models = listOf(value, "models");
  const endpoints = listOf(value, "endpoints");
  const disabled = busy || !snapshot.writable || snapshot.status !== "ready";
  const write = React.useCallback(
    async (field, next) => {
      setBusy(true);
      setError(null);
      try {
        const accepted = await form.set(field, next);
        if (!accepted) setError(t("error.write"));
        return accepted;
      } catch (caught) {
        setError(caught instanceof Error && caught.message.length > 0 ? caught.message : t("error.write"));
        return false;
      } finally {
        setBusy(false);
      }
    },
    [form, t]
  );
  const commitFilter = React.useCallback(
    async (field, draft) => {
      if (draft === void 0) return;
      const accepted = await write(field, splitList(draft));
      if (accepted) {
        if (field === "providers") setProvidersDraft(void 0);
        else setModelsDraft(void 0);
      }
    },
    [write]
  );
  if (snapshot.status === "unavailable") {
    return React.createElement("div", { className: "dte-page" }, React.createElement("p", { className: "dte-hint" }, t("state.unavailable")));
  }
  if (snapshot.status === "loading" || snapshot.status === "idle") {
    return React.createElement("div", { className: "dte-page" }, React.createElement("p", { className: "dte-hint" }, t("state.loading")));
  }
  const providerText = providersDraft ?? providers.join(", ");
  const modelText = modelsDraft ?? models.join(", ");
  return React.createElement(
    "div",
    { className: "dte-page" },
    React.createElement(
      "header",
      { className: "dte-head" },
      React.createElement("h2", { className: "dte-title" }, t("page.title")),
      React.createElement("p", { className: "dte-desc" }, t("page.description")),
      React.createElement("p", { className: "dte-hint" }, t("page.sliderNote"))
    ),
    React.createElement(
      "section",
      { className: "dte-card" },
      React.createElement(
        "label",
        { className: "dte-row" },
        React.createElement("span", { className: "dte-label" }, t("effort.label")),
        React.createElement(
          "select",
          {
            className: "dte-select",
            value: effort,
            disabled,
            onChange: (event) => {
              void write("effort", event.target.value);
            }
          },
          TEAMO_EFFORTS.map(
            (level) => React.createElement("option", { key: level, value: level }, t(`effort.${level}`))
          )
        )
      ),
      React.createElement("p", { className: "dte-hint" }, t(`effort.${effort}.hint`)),
      error === null ? null : React.createElement("p", { className: "dte-error", role: "status" }, error),
      !snapshot.writable ? React.createElement("p", { className: "dte-hint" }, t("state.readonly")) : null,
      React.createElement(
        "div",
        { className: "dte-filters" },
        React.createElement(
          "label",
          { className: "dte-field" },
          React.createElement("span", { className: "dte-label" }, t("filter.providers")),
          React.createElement("input", {
            className: "dte-input",
            type: "text",
            value: providerText,
            disabled: busy || !snapshot.writable,
            placeholder: "teamo",
            onChange: (event) => setProvidersDraft(event.target.value),
            onBlur: () => {
              void commitFilter("providers", providersDraft);
            },
            onKeyDown: (event) => {
              if (event.key === "Enter") void commitFilter("providers", providersDraft);
            }
          }),
          React.createElement("span", { className: "dte-hint" }, t("filter.providers.hint"))
        ),
        React.createElement(
          "label",
          { className: "dte-field" },
          React.createElement("span", { className: "dte-label" }, t("filter.models")),
          React.createElement("input", {
            className: "dte-input",
            type: "text",
            value: modelText,
            disabled: busy || !snapshot.writable,
            placeholder: "deepseek-v4-pro, gpt-5.5",
            onChange: (event) => setModelsDraft(event.target.value),
            onBlur: () => {
              void commitFilter("models", modelsDraft);
            },
            onKeyDown: (event) => {
              if (event.key === "Enter") void commitFilter("models", modelsDraft);
            }
          }),
          React.createElement("span", { className: "dte-hint" }, t("filter.models.hint"))
        ),
        React.createElement(
          "p",
          { className: "dte-note" },
          `${t("endpoint.note")}${endpoints.length === 0 ? "\u2014" : endpoints.join(", ")}`
        )
      )
    )
  );
}
function effortAt(index) {
  return TEAMO_EFFORTS[index] ?? "off";
}
var COMMIT_KEYS = /* @__PURE__ */ new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
  "PageUp",
  "PageDown"
]);
function TeamoEffortSlider({ sessionId, directories, forms, namespace, t }) {
  const form = React.useMemo(() => forms.get(namespace), [forms, namespace]);
  const subscribeForm = React.useCallback((listener) => form.subscribe(listener), [form]);
  const formSnapshot = React.useSyncExternalStore(
    subscribeForm,
    () => form.getSnapshot(),
    () => form.getSnapshot()
  );
  const directory = React.useMemo(() => directories.directoryFor(sessionId), [directories, sessionId]);
  const subscribeDirectory = React.useCallback(
    (listener) => directory.store.subscribe(listener),
    [directory]
  );
  const directorySnapshot = React.useSyncExternalStore(
    subscribeDirectory,
    () => directory.store.getSnapshot(),
    () => directory.store.getSnapshot()
  );
  React.useEffect(() => {
    void directory.load().catch(() => {
    });
  }, [directory]);
  const [draft, setDraft] = React.useState(null);
  const [pending, setPending] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef(null);
  React.useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const closeOutside = (event) => {
      if (rootRef.current?.contains(event.target) === true) return;
      setOpen(false);
    };
    const closeEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
    };
  }, [open]);
  const value = formSnapshot.status === "ready" ? formSnapshot.value : void 0;
  const current = directorySnapshot.current;
  const model = current === void 0 || current === null ? void 0 : directorySnapshot.groups?.find((group) => group.id === current.provider)?.models.find((entry) => entry.id === current.model);
  const effort = normalizeEffort(value?.effort);
  React.useEffect(() => {
    if (pending !== null && effortAt(pending) === effort) setPending(null);
  }, [pending, effort]);
  if (value === void 0 || current === void 0 || current === null || model === void 0) return null;
  if ((model.reasoning?.efforts?.length ?? 0) > 0) return null;
  if (!matchesFilter(listOf(value, "providers"), current.provider)) return null;
  if (!matchesFilter(listOf(value, "models"), current.model)) return null;
  const last = TEAMO_EFFORTS.length - 1;
  const shown = draft ?? pending ?? Math.max(TEAMO_EFFORTS.indexOf(effort), 0);
  const level = effortAt(shown);
  const disabled = busy || !formSnapshot.writable;
  const commit = (next) => {
    const index = next ?? draft;
    setDraft(null);
    if (index === null || index === void 0 || index < 0 || index > last) return;
    const nextLevel = effortAt(index);
    if (nextLevel === effort) {
      setPending(null);
      return;
    }
    setPending(index);
    setBusy(true);
    void (async () => {
      try {
        await form.set("effort", nextLevel);
      } catch {
        setPending(null);
      } finally {
        setBusy(false);
      }
    })();
  };
  return React.createElement(
    "div",
    { className: "dte-root", ref: rootRef, "data-dsh-plugin": NS },
    React.createElement(
      "button",
      {
        type: "button",
        className: "dte-trigger",
        "aria-haspopup": "dialog",
        "aria-expanded": open,
        "aria-label": `${t("slider.title")}\uFF1A${t(`slider.${level}`)}`,
        title: `${t("slider.title")}\uFF1A${t(`slider.${level}`)}\uFF08${t("slider.hint")}\uFF09`,
        disabled,
        onClick: () => setOpen((value2) => !value2)
      },
      React.createElement("span", { className: "dte-triggerName" }, t("slider.label")),
      React.createElement("span", { className: "dte-triggerValue" }, t(`slider.${level}`)),
      React.createElement(
        "svg",
        {
          className: open ? "dte-chevron dte-chevronOpen" : "dte-chevron",
          width: 14,
          height: 14,
          viewBox: "0 0 14 14",
          fill: "none",
          "aria-hidden": true
        },
        React.createElement("path", {
          d: "M3.2 5.4 7 9.2l3.8-3.8",
          stroke: "currentColor",
          strokeWidth: 1.4,
          strokeLinecap: "round",
          strokeLinejoin: "round"
        })
      )
    ),
    open ? React.createElement(TeamoEffortPanel, {
      shown,
      last,
      level,
      disabled,
      t,
      onDraft: (index) => setDraft(index),
      onCommit: (index) => commit(index)
    }) : null
  );
}
function TeamoEffortPanel({ shown, last, level, disabled, t, onDraft, onCommit }) {
  const percent = last === 0 ? 100 : Math.round(shown / last * 100);
  const radius = 15;
  const travel = `calc(${percent}% + ${Math.round(radius - radius * 2 * percent / 100)}px)`;
  const knobLeft = shown >= last ? `calc(100% - ${radius}px)` : percent <= 0 ? `${radius}px` : travel;
  const fillWidth = percent <= 0 ? "0px" : travel;
  const readIndex = (event) => Number(event.currentTarget.value);
  return React.createElement(
    "div",
    { className: "dte-menu", role: "dialog", "aria-label": t("slider.title") },
    React.createElement(
      "div",
      { className: "dte-menuHead" },
      React.createElement("span", null, t("slider.title")),
      React.createElement("strong", { className: "dte-menuValue" }, t(`slider.${level}`))
    ),
    React.createElement(
      "div",
      { className: "dte-sliderRail" },
      React.createElement(
        "div",
        { className: "dte-sliderGroove", "aria-hidden": true },
        React.createElement("div", { className: "dte-sliderTrack" }),
        React.createElement(
          "div",
          {
            className: shown >= last ? "dte-sliderFill dte-sliderFillMax" : "dte-sliderFill",
            style: { width: fillWidth }
          },
          React.createElement("div", { className: "dte-sliderBloom" })
        )
      ),
      React.createElement(
        "div",
        { className: "dte-sliderKnob", "aria-hidden": true, style: { left: knobLeft } },
        React.createElement("div", { className: "dte-sliderKnobFace" })
      ),
      React.createElement(
        "div",
        { className: "dte-sliderTicks", "aria-hidden": true },
        TEAMO_EFFORTS.map(
          (stop, index) => React.createElement("span", {
            key: stop,
            className: index <= shown ? "dte-sliderTick dte-sliderTickActive" : "dte-sliderTick"
          })
        )
      ),
      React.createElement("input", {
        className: "dte-sliderInput",
        type: "range",
        min: 0,
        max: last,
        step: 1,
        value: shown,
        disabled,
        "aria-label": `${t("slider.title")}\uFF1A${t(`slider.${level}`)}`,
        "aria-valuetext": t(`slider.${level}`),
        onChange: (event) => onDraft(readIndex(event)),
        onMouseUp: (event) => onCommit(readIndex(event)),
        onTouchEnd: (event) => onCommit(readIndex(event)),
        onKeyUp: (event) => {
          if (COMMIT_KEYS.has(event.key)) onCommit(readIndex(event));
        }
      })
    ),
    React.createElement("p", { className: "dte-menuDesc" }, t(`effort.${level}.hint`))
  );
}
function mountComposerSlider(ctx, t) {
  const mirror = ctx.configForms.describe();
  let mounted;
  let registration;
  const sync = () => {
    const namespace = findNamespace(mirror);
    if (namespace === mounted) return;
    registration?.();
    registration = void 0;
    mounted = namespace;
    if (namespace === void 0 || typeof ctx.inject !== "function") return;
    const dispose = ctx.inject(["slots", "modelDirectories"], (scope) => {
      const directories = scope.get("modelDirectories");
      if (directories === void 0 || typeof directories.directoryFor !== "function") return () => {
      };
      return scope.slots.inject(
        "conversation.input.right",
        () => scope.slots.register(
          { name: "conversation.input.right", id: NS, order: 40 },
          (props) => React.createElement(TeamoEffortSlider, {
            sessionId: props.sessionId,
            directories,
            forms: ctx.configForms,
            namespace,
            t
          })
        )
      );
    });
    registration = typeof dispose === "function" ? dispose : void 0;
  };
  mirror.ensure();
  const unsubscribe = mirror.subscribe(sync);
  sync();
  return () => {
    unsubscribe();
    registration?.();
    registration = void 0;
    mounted = void 0;
  };
}
function mountSettingsPage(ctx, t) {
  const mirror = ctx.configForms.describe();
  let registration;
  let mounted;
  const sync = () => {
    const namespace = findNamespace(mirror);
    if (namespace === mounted && registration !== void 0) return;
    registration?.();
    registration = void 0;
    mounted = namespace;
    if (namespace === void 0) return;
    registration = ctx.slots.inject(
      "settings.section",
      () => ctx.slots.register(
        {
          name: "settings.section",
          id: NS,
          order: 22,
          // A thunk is re-read on every projection, so the nav label follows the
          // active locale without re-registering the page.
          label: () => t("section.title")
        },
        () => React.createElement(TeamoEffortPage, { forms: ctx.configForms, namespace, t })
      )
    );
  };
  mirror.ensure();
  const unsubscribe = mirror.subscribe(sync);
  sync();
  return () => {
    unsubscribe();
    registration?.();
    registration = void 0;
    mounted = void 0;
  };
}
function apply(ctx) {
  const t = ctx.locale.bind(NS);
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "teamo-effort: dictionaries");
  ctx.effect(() => installStyles(), "teamo-effort: settings styles");
  ctx.effect(() => mountSettingsPage(ctx, t), "teamo-effort: settings page");
  ctx.effect(() => mountComposerSlider(ctx, t), "teamo-effort: composer slider");
}

return module.exports; } });
