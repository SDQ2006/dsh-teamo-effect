# dsh-teamo-effort

DSH 插件：把用户选择的 **Teamo 模型强度**（`reasoning_effort`）注入发往
**TeamoRouter** 的模型请求。安装后在设置页多出一页「Teamo 模型强度」，用下拉菜单
选择 `Off / Low / Medium / High`；并在输入框右侧提供一个与 **dsh-effort-switcher 同款**
的折叠式强度控件：平时只显示 `Teamo 强度 · High`，点开才出现滑条。
下一次模型请求立即生效，无需重启。

## 与 dsh-effort-switcher 协作

两者分工明确，不会互相覆盖：

| 当前模型 | 谁控制强度 |
|---|---|
| 适配器公布了 `reasoning.efforts`（DeepSeek 官方模型等） | **输入框里的滑块**（dsh-effort-switcher / DSH 原生选择器）。`agent/request` 一旦发现提案已带 `reasoningEffort`，就原样返回，绝不覆盖 |
| 没有任何原生强度控制（TeamoRouter 现在的模型） | **本插件**：设置页 + 输入框右侧的 `Teamo 强度` 折叠控件（点开后拖动选 Off / Low / Medium / High） |

也就是说：有滑块的地方归滑块，没滑块的地方归本插件；同一时刻同一会话只有一个生效的
强度入口。折叠控件只在「当前模型命中本插件过滤条件、且没有原生滑块」时出现，其它情况
完全隐藏。设置页里也写明了这条优先级。

输入框控件的形态与 DeepSeek 官方模型完全一致（隐藏式）：composer 行里只有
`Teamo 强度 · High ▾` 这么一小段文本；点击（或键盘回车）才在它上方弹出面板，
面板里是与 switcher 同款的滑轨——26px 轨道、30px 圆形滑块、4 个刻度点、最高档渐变高亮，
以及当前档位的说明文字；点击面板外或按 `Esc` 收起。拖动时只更新本地草稿（滑块跟手），
松手（或方向键松开）才提交一个确定档位；提交后滑块先停在目标位置，等 Host 回传
新值时再对齐，写入失败会退回真实值。

## 行为

| 选择 | 发往 TeamoRouter 的请求 |
|---|---|
| `Off` | 不下发 `reasoning_effort`，走上游默认 |
| `Low` / `Medium` / `High` | JSON body 里写入 `reasoning_effort: "<档位>"` |

过滤条件（可选，留空表示全部）：

- `providers`：命中的 DSH provider 路由，默认 `["teamo"]`；
- `models`：命中的模型 id，默认空 = 该 provider 下的所有模型；
- `endpoints`：只有发往这些地址前缀的请求才会被改写，默认
  `["https://api.teamorouter.cn"]`，避免误注入到别的服务。

## 两层注入（为什么不是只改 `agent/request`）

`agent/request` 是决定点：它拿到本步真实的 `provider` / `model`，据此判断过滤条件，
并把结论交给外发层。但 DSH 会在任何 provider I/O 之前用**模型自身公布的能力**校验
`reasoningEffort`（`UNSUPPORTED_REASONING_EFFORT`）——TeamoRouter 目前按手工声明的
路由接入（`llm-pi-ai` 的 `models` 没有 `reasoningEfforts`），模型不公布任何档位，
直接把 `reasoningEffort` 写进冻结提案会让每一步请求失败。

因此：

1. 模型**公布**了该档位（例如以后给 Teamo 模型补上 `reasoningEfforts`，或把
   `deepseek-official` 也纳入过滤）→ 监听器返回
   `{ ...config, reasoningEffort: effort }`，由适配器序列化；
2. 模型**没有**公布档位 → 监听器只做决策与记账（并清掉路由无法兑现的残留
   `reasoningEffort`），真正的外发字段由 Host 半在 `fetch` 边界写入 TeamoRouter 的
   JSON body。这个包装只劫持「配置里的端点 + POST + body 里带命中的 `model` +
   body 里尚未出现该字段」的请求，其余请求原样透传，插件卸载时自动还原。

`agent/request` 交给监听器的提案是 deep-frozen 的，两半都**从不就地修改**它：需要
改动时返回新对象，不需要改动时原样返回。

## 文件结构

```text
dsh-teamo-effort/
├── package.json          # dsh.bundle / dsh.client / exports['./client']
├── cordis.patch.yml      # 安装时插入的插件行（id: teamo-effort）
├── tsconfig.json         # 源码类型检查（构建用 esbuild）
├── scripts/build.mjs     # Host: ESM；Client: CJS 工厂 + __ModuleLoader__ 包装
├── locale/{zh,en}.json   # 插件页显示用的标题与描述
├── icon.svg
└── src/
    ├── shared.ts         # 两半共用的 TEAMO_EFFORT_NS 与档位定义
    ├── index.ts          # Host 半：Config、agent/request 瀑布、外发注入
    └── client/index.tsx  # Client 半：设置页 + 输入框右侧的折叠强度控件
```

`lib/` 是构建产物，随包提交，安装后无需在 profile 里执行构建。

## 安装

```powershell
# 在 package.json / cordis.patch.yml 所在的包目录执行
dsh plugin --profile desktop add .
```

命令会把本包链接进 profile 并（因为 `dsh.bundle`）把 `teamo-effort` 行加入
`dsh.profile.bundles`。随后**完整重启对应 profile**（DSH 只在进程启动时扫描
`dsh.client`）。

打开 设置 → 侧栏「Teamo 模型强度」→ 选择档位。下一次请求即生效。

卸载：

```powershell
dsh plugin --profile desktop remove dsh-teamo-effort
```

## 从源码构建

```powershell
pnpm add -D esbuild typescript
pnpm run build
```

## 与其他插件的边界

- 只使用**类型**导入做跨插件协作，不导入其他插件的运行时值；
- 设置读写走 `configForms`（0.2.x）对应的 Host 配置文档，不写别的插件的配置；
- 输入框控件通过可选的嵌套 `ctx.inject(['slots', 'modelDirectories'])` 读取当前会话的
  模型目录：`modelDirectories` 不存在时只是不显示滑条，设置页照常工作；
- 命名空间常量 `TEAMO_EFFORT_NS = 'teamo-effort'` 由 `src/shared.ts` 提供，
  Host 半与 Client 半共用同一个字面量；profile 可能给 entry id 加 include 前缀，
  Client 半按 `teamo-effort` 或 `:<name>` 后缀识别。

## 已知限制

- 外发注入依赖 `debug` 层的 `fetch` 包装，只有 `body` 为 JSON 字符串的
  `POST` 会被改写；流式上传或 `Request` 对象的请求会原样透传。
- 若 TeamoRouter 后续要求别的字段名（例如某些网关用 `reasoning.effort`），
  改 `src/shared.ts` 的 `TEAMO_EFFORT_FIELD` 重新构建即可。
- 一旦给 Teamo 模型声明了 `reasoningEfforts`，这些模型就进入「有滑块」的一类：
  强度由输入框滑块决定，本插件不再覆盖（设置页和小按钮都会按这条规则退让）。
