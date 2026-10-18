// src/index.ts
import z from "@deepseek-ai/schemastery";

// src/shared.ts
var TEAMO_EFFORT_NS = "teamo-effort";
var TEAMO_EFFORT_FIELD = "reasoning_effort";
var TEAMO_EFFORTS = ["off", "low", "medium", "high"];
var DEFAULT_TEAMO_ENDPOINTS = ["https://api.teamorouter.cn"];
var DEFAULT_TEAMO_PROVIDERS = ["teamo"];
function normalizeEffort(value) {
  return value === "low" || value === "medium" || value === "high" ? value : "off";
}
function matchesFilter(filter, value) {
  if (filter === void 0 || filter.length === 0) return true;
  return filter.some((entry) => entry === "*" || entry === value);
}
function normalizeList(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((entry) => typeof entry === "string").map((entry) => entry.trim()).filter((entry) => entry.length > 0);
}
function endpointOwns(url, endpoints) {
  if (endpoints === void 0 || endpoints.length === 0) return false;
  const target = url.trim().toLowerCase();
  return endpoints.some((raw) => {
    const prefix = raw.trim().toLowerCase().replace(/\/+$/, "");
    if (prefix.length === 0 || !target.startsWith(prefix)) return false;
    const rest = target.slice(prefix.length);
    return rest === "" || rest.startsWith("/") || rest.startsWith("?");
  });
}

// src/index.ts
var name = TEAMO_EFFORT_NS;
var inject = ["settings", "llm"];
function volatile(schema) {
  const markable = schema;
  return typeof markable.volatile === "function" ? markable.volatile() : schema;
}
var Config = z.object({
  effort: volatile(z.union([...TEAMO_EFFORTS]).default("off")),
  providers: volatile(z.array(z.string()).default([...DEFAULT_TEAMO_PROVIDERS])),
  models: volatile(z.array(z.string()).default([])),
  endpoints: volatile(z.array(z.string()).default([...DEFAULT_TEAMO_ENDPOINTS]))
}).description(TEAMO_EFFORT_NS);
var VOLATILE_WRITE = Symbol.for("cosmokit.volatile.write");
function plainValue(value) {
  if (value === null || typeof value !== "object") return value;
  const getter = value.get;
  const writer = value[VOLATILE_WRITE];
  if (writer === void 0 && typeof getter !== "function") return value;
  try {
    return value.get();
  } catch {
    return void 0;
  }
}
function resolveConfig(input) {
  const config = input ?? {};
  const providers = plainValue(config.providers);
  const endpoints = plainValue(config.endpoints);
  return {
    effort: normalizeEffort(plainValue(config.effort)),
    // An absent filter means the packaged default; an explicit empty array means
    // "no restriction", so the two cases stay distinguishable.
    providers: providers === void 0 || providers === null ? [...DEFAULT_TEAMO_PROVIDERS] : normalizeList(providers),
    models: normalizeList(plainValue(config.models)),
    endpoints: endpoints === void 0 || endpoints === null ? [...DEFAULT_TEAMO_ENDPOINTS] : normalizeList(endpoints)
  };
}
function requestUrl(input) {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  if (typeof Request !== "undefined" && input instanceof Request) return input.url;
  return void 0;
}
function withoutEffort(config) {
  if (config.reasoningEffort === void 0) return config;
  const { reasoningEffort: _dropped, ...rest } = config;
  return rest;
}
var OutboundInjector = class {
  efforts = /* @__PURE__ */ new Map();
  policy;
  warn;
  constructor(policy, warn) {
    this.policy = policy;
    this.warn = warn;
  }
  /** Bind one model id to a strength for the requests that follow. */
  remember(model, effort) {
    this.efforts.set(model, effort);
  }
  /** Forget a model id, so a stale strength never survives the next step. */
  forget(model) {
    this.efforts.delete(model);
  }
  /**
   * Install the wrapper and return its disposer.
   *
   * The disposer restores the previous implementation only when this wrapper is
   * still the installed one, so a later plugin in the chain keeps its own patch.
   */
  install() {
    const owner = globalThis;
    const previous = owner.fetch;
    const injector = this;
    const patched = async function teamoEffortFetch(input, init) {
      const rewritten = injector.rewrite(input, init);
      return rewritten === void 0 ? previous(input, init) : previous(rewritten.input, rewritten.init);
    };
    owner.fetch = patched;
    return () => {
      if (owner.fetch === patched) owner.fetch = previous;
    };
  }
  /** Return a rewritten request body, or undefined to pass the request through. */
  rewrite(input, init) {
    if ((init?.method ?? "GET").toUpperCase() !== "POST") return void 0;
    const endpoints = this.policy().endpoints;
    if (endpoints.length === 0) return void 0;
    const url = requestUrl(input);
    if (url === void 0 || !endpointOwns(url, endpoints)) return void 0;
    if (typeof init?.body !== "string") return void 0;
    let payload;
    try {
      payload = JSON.parse(init.body);
    } catch {
      return void 0;
    }
    if (typeof payload !== "object" || payload === null || Array.isArray(payload)) return void 0;
    const body = payload;
    const model = typeof body.model === "string" ? body.model : void 0;
    if (model === void 0) return void 0;
    const effort = this.efforts.get(model);
    if (effort === void 0) return void 0;
    if (body[TEAMO_EFFORT_FIELD] !== void 0) return void 0;
    body[TEAMO_EFFORT_FIELD] = effort;
    try {
      return { input, init: { ...init, body: JSON.stringify(body) } };
    } catch (error) {
      this.warn(`could not rewrite the TeamoRouter request body: ${String(error)}`);
      return void 0;
    }
  }
};
var NO_CAPABILITIES = { native: false, efforts: [] };
function apply(ctx, config) {
  const readPolicy = () => resolveConfig(config);
  const injector = new OutboundInjector(
    () => ({ endpoints: readPolicy().endpoints }),
    (message) => ctx.logger.warn(`[${TEAMO_EFFORT_NS}] ${message}`)
  );
  const settings = ctx.settings;
  if (typeof settings.configure === "function") {
    ctx.effect(() => settings.configure({ auto: false }), "teamo-effort: settings presentation");
  }
  const capabilitiesCache = /* @__PURE__ */ new Map();
  const capabilities = (provider, model) => {
    const key = `${provider}\0${model}`;
    let pending = capabilitiesCache.get(key);
    if (pending === void 0) {
      const llm = ctx.llm;
      pending = typeof llm?.resolveModelInfo === "function" ? llm.resolveModelInfo(provider, model).then(
        (info) => {
          const efforts = (info.reasoning?.efforts ?? []).map((entry) => entry.id);
          return { native: efforts.length > 0, efforts };
        },
        () => NO_CAPABILITIES
      ) : Promise.resolve(NO_CAPABILITIES);
      capabilitiesCache.set(key, pending);
    }
    return pending;
  };
  ctx.effect(() => injector.install(), "teamo-effort: outbound TeamoRouter bodies");
  ctx.effect(
    () => ctx.on("agent/request", async (_payload, next) => {
      const policy = readPolicy();
      const proposed = await next();
      const applies = matchesFilter(policy.providers, proposed.provider) && matchesFilter(policy.models, proposed.model);
      if (!applies) {
        injector.forget(proposed.model);
        return proposed;
      }
      const caps = await capabilities(proposed.provider, proposed.model);
      if (!caps.native) {
        if (policy.effort === "off") {
          injector.forget(proposed.model);
        } else {
          injector.remember(proposed.model, policy.effort);
        }
        return withoutEffort(proposed);
      }
      injector.forget(proposed.model);
      if (policy.effort === "off" || !caps.efforts.includes(policy.effort)) return proposed;
      if (proposed.reasoningEffort !== void 0) return proposed;
      return {
        ...proposed,
        reasoningEffort: policy.effort
      };
    }),
    "teamo-effort: request policy"
  );
}
export {
  Config,
  apply,
  inject,
  name,
  resolveConfig
};
