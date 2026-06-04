# 插件 Iframe 渲染协议（v1）

## 总览

每个插件的二级视图都通过 **iframe 沙箱 + `window.RS` 注入 SDK** 加载。主窗口在加载时把 SDK 内联进 `iframe.srcdoc`，握手后通过 `postMessage` 双向通信。插件可使用任意前端框架（HTML/JS/Vue/React/...），只要最终产物是单文件 HTML。

```
┌──────────── 主窗口 (Tauri webview) ────────────┐
│  PluginRenderer.vue                            │
│   <iframe sandbox="allow-scripts" srcdoc=...>  │
│                                                │
│  usePluginIframe:                              │
│   1) invoke('get_plugin_iframe_init')          │
│   2) 拼 srcdoc = injectSdk(html, sdkJs)        │
│   3) 等 rs:handshake → 发 rs:init              │
│   4) 监听所有 rs:* 消息                          │
└────────────────────────────────────────────────┘
```

## 插件产物形态

`plugin.json` 入口：

```json
{
  "id": "my_plugin",
  "dll": "my_plugin.dll",
  "renderer": "renderer/index.html",
  "commands": [...]
}
```

`renderer` 字段是**单文件 HTML**。两种来源：
- **手写 HTML+CSS+JS**（不依赖构建）
- **任意框架**（Vue/React/...）经 Vite/webpack 等编译成单文件 HTML（推荐用 `vite-plugin-singlefile`）

**禁止**在 srcdoc 中依赖外部资源（CDN、相对路径文件等），所有 JS/CSS/图片必须内联到 HTML 中。

## 协议版本

- `iframe-renderer/1`
- 在 `rs:init` 消息中携带 `version` 字段
- SDK 暴露 `window.RS.version` 给插件读取
- 协议破坏性变更走 MAJOR 升级，SDK 可拒绝握手

## `window.RS` API

```ts
interface RSContext {
  pluginId: string
  query: string
  config: { hotkey: string; [k: string]: unknown }
  theme: { mode: 'dark' | 'light'; vars: Record<string, string>; name?: string }
}

interface RSApi {
  readonly version: string                // 'iframe-renderer/1'
  readonly context: RSContext | null      // 由 rs:init 注入
  readonly theme: RSContext['theme'] | null
  readonly query: string                  // 由 rs:init / rs:query-change 同步

  invoke<T = unknown>(command: string, args?: Record<string, unknown>): Promise<T>
  openFile(path: string): Promise<void>
  hideWindow(): Promise<void>
  notifyBack(): void                       // 通知主窗口"我想退出"
  setWindowSize(width: number, height: number): void  // 通知主窗口调整大小

  on(event: 'theme-change' | 'query-change' | 'context-change' | 'keydown' | 'back', handler: Function): () => void
  off(event: string, handler: Function): void

  log(level: 'info' | 'warn' | 'error', ...args: unknown[]): void

  ready: Promise<void>                     // 等到 rs:init 接收完成
  applyTheme(theme: RSContext['theme']): void
}
```

### 调用后端

```js
const result = await window.RS.invoke('search', { query: 'foo' })
const data = typeof result === 'string' ? JSON.parse(result) : result
```

底层转发到 Rust `plugin_invoke(pluginId, command, args)` 命令。

### 打开文件

```js
await window.RS.openFile('C:\\path\\to\\file.txt')
await window.RS.hideWindow()
```

主窗口会用 `ShellExecuteW` 打开文件并隐藏自己。

### 主题

SDK 在收到 `rs:init` / `rs:theme-change` 时自动把 CSS 变量写入 `document.documentElement`：

```css
:root {
  --bg-primary: #1e1e22;
  --bg-secondary: #2a2a30;
  --accent: #4a90d9;
  /* ... */
}
```

插件 CSS 直接用 `var(--bg-primary)` 即可跟随主窗口主题。

### 搜索查询同步

主窗口输入框变化时发 `rs:query-change`：

```js
window.RS.on('query-change', (q) => {
  // 触发搜索
})
```

### 键盘事件

主窗口把 `keydown` 事件通过 `postMessage` 转发到 iframe，SDK 派发合成 `KeyboardEvent` 到 `document`：

```js
window.RS.on('keydown', (e) => {
  if (e.key === 'ArrowDown') { ... }
})
```

`e.preventDefault()` 会标记事件已处理（主窗口侧不重复处理）。

## 消息协议

所有消息都带 `protocol: 'iframe-renderer/1'` 字段。

### iframe → parent

| type | payload | 描述 |
| --- | --- | --- |
| `rs:handshake` | `{}` | SDK 加载完成，请求初始化 |
| `rs:invoke:req` | `{ id, command, args }` | `RS.invoke` 转发到 Rust |
| `rs:open-file` | `{ path }` | `RS.openFile` |
| `rs:hide-window` | `{}` | `RS.hideWindow` |
| `rs:set-size` | `{ width, height }` | `RS.setWindowSize`（显式请求窗口大小） |
| `rs:resize` | `{ width, height }` | SDK 自动（`ResizeObserver` 监听 documentElement），主窗口据此调整窗口高度 = 内容高度 + 搜索栏高度（chrome），最小 360、最大 800 |
| `rs:back` | `{}` | `RS.notifyBack` |
| `rs:log` | `{ level, args }` | `RS.log` 转发 |

### parent → iframe

| type | payload | 描述 |
| --- | --- | --- |
| `rs:init` | `{ version, context }` | 收到 `rs:handshake` 后下发 |
| `rs:invoke:res` | `{ id, ok, value?, error? }` | Rust 调用结果 |
| `rs:theme-change` | `{ theme }` | 主题变更 |
| `rs:query-change` | `{ query }` | 搜索框变化 |
| `rs:context-change` | `{ patch }` | 上下文增量更新 |
| `rs:keydown` | `{ payload }` | 合成键盘事件 |

## 握手时序

```
1. 父构造 srcdoc = injectSdk(pluginHtml, sdkJs)
2. iframe.srcdoc = srcdoc
3. iframe 解析 → SDK 同步执行
4. SDK 发 rs:handshake 给 parent
5. parent 发 rs:init (含 context + theme)
6. SDK 收到后 install window.RS，发 rs:ready
7. 双向 postMessage 正常通信
```

父端有 5s 握手超时；超时后 PluginRenderer 显示错误。

## 最小插件模板（HTML）

`plugins/my_plugin/renderer/index.html`：
```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { color: var(--text-primary); background: var(--bg-primary); }
  </style>
</head>
<body>
  <div id="app">Hello</div>
  <script>
    window.RS.on('query-change', (q) => {
      document.getElementById('app').textContent = 'Query: ' + q
    })
    window.RS.invoke('echo', { msg: 'hi' }).then(console.log)
  </script>
</body>
</html>
```

`plugin.json`：
```json
{
  "id": "my_plugin",
  "dll": "my_plugin.dll",
  "renderer": "renderer/index.html",
  "commands": [{ "name": "echo", "params": ["msg"], "description": "" }]
}
```

## Vue 插件

`renderer/main.ts`：
```ts
import { createApp } from 'vue'
import App from './main.vue'

createApp(App).mount('#app')
```

`renderer/main.vue`：使用 `<script setup>`，通过 `window.RS.*` 调用后端。

`renderer/vite.config.ts`：
```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [vue(), viteSingleFile()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
})
```

构建产物：`renderer/dist/index.html`（单文件，含全部 JS/CSS/图片）。

`plugin.json`：
```json
{
  "id": "everything_search",
  "dll": "everything_search.dll",
  "renderer": "renderer/dist/index.html",
  "commands": [...]
}
```

## 安全沙箱

- `sandbox="allow-scripts allow-forms"`（**禁止** `allow-same-origin`）
- iframe 不可访问主窗口 DOM/cookie/localStorage
- 通信仅经 `postMessage`，SDK 校验 `event.source === iframe.contentWindow`
- 插件抛错被 SDK 捕获并通过 `rs:log` 转发到主窗口 console

## CSP 注意

主窗口 CSP 当前为：
```
script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:
frame-src 'self' asset: http://asset.localhost https://asset.localhost about:
```

`'unsafe-inline'` 用于允许 srcdoc 中内联的 SDK script。`'unsafe-eval'` 保留以兼容 Vite 编译产物中的 `eval`（如 highlight.js）。插件作者无需关心。

## 类型声明

`src-ui/src/sdk/rs-sdk.d.ts` 是主窗口侧的类型定义。插件作者可在自己的 `renderer/rs-sdk.d.ts` 复制一份用于类型检查：

```ts
import type { RSKeyEvent } from './rs-sdk'

window.RS.on('keydown', (e: RSKeyEvent) => { ... })
```

## 不在范围

- `RS.capabilities` 能力清单（预留接口，未实现）
- 自动 DevTools
- 错误兜底 UI（PluginRenderer 显示红字错误即可）
- `rs:set-size` 主窗口侧响应（收到后触发 `rs-plugin-resize` 事件，App.vue 调 `setPluginSize`）
- 旧 `vue_component` 字段（已删除）
