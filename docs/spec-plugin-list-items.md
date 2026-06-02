# Spec: 插件自主决定列表项样式与行为

## Objective

插件通过 `query()` 返回的 SearchResult 自主决定列表项的渲染模板和回车行为。具体目标：

1. **插件决定列表项模板**：每个 SearchResult 携带 `template` 字段，指定前端渲染使用的模板名称（如 `"default"`、`"compact"`）。前端维护一个模板注册表，将名称映射到渲染函数。插件可以通过自定义模板名称扩展渲染方式。
2. **插件决定列表项行为**：每个 SearchResult 携带 `action` 字段，取值 `"execute"` 或 `"open_renderer"`，插件自行填充。
3. **空输入也由插件响应**：搜索框为空时调用 `plugin.query("")`，插件可返回默认入口项。
4. **支持"打开原生界面"动作**：action 为 `"open_renderer"` 时展开插件原生 UI，按 Esc 返回搜索列表。
5. **插件目录**：`<exe_dir>/plugins/<pluginName>/`。

**用户故事：**
- 用户打开启动器 → hello_plugin 返回 template 为 `"compact"` 的列表项 → 回车进入插件原生界面
- 用户输入"hello" → hello_plugin 返回相同列表项
- 用户输入"chrome" → app_search 返回 template 为 `"default"` 的标准列表项 → 回车打开 Chrome
- 插件原生界面按 Esc 返回搜索列表

## 核心设计

### 1. SearchResult.template — 模板名称系统

SearchResult 的 `template: String` 字段指定前端渲染使用的模板名称：

| template 值 | 前端行为 |
|-------------|---------|
| `"default"` | 标准模板：图标 + 标题 + 副标题 |
| `"compact"` | 紧凑模板：大 emoji/icon + 标题 + 副标题（无分栏） |
| 其他 | 查找 TEMPLATES 映射，未找到则回退到 `"default"` |

**前端模板注册表：**
```javascript
const TEMPLATES = {
  default: (r, iconEl) => `
    ${iconEl}
    <div class="result-text">
      <div class="result-title">${escapeHtml(r.title)}</div>
      <div class="result-subtitle">${escapeHtml(r.subtitle)}</div>
    </div>
  `,
  compact: (r) => `
    <div style="display:flex;align-items:center;gap:10px;width:100%">
      <span style="font-size:24px">${escapeHtml(r.icon_path || '📄')}</span>
      <div>
        <div style="font-weight:500">${escapeHtml(r.title)}</div>
        <div style="font-size:12px;color:#999">${escapeHtml(r.subtitle)}</div>
      </div>
    </div>
  `,
};
```

插件可通过 `template` 字段指定任意名称，前端未注册的模板名称回退到 `"default"`。

### 2. SearchResult.action — 行为字段

| action 值 | 前端行为 |
|------------|---------|
| `"execute"` | 调用 `plugin.execute(result)` |
| `"open_renderer"` | 展开插件原生 UI |

### 3. 空输入走 query("")

搜索框为空时前端调用 `search("")`，后端对所有插件调用 `plugin.query("")`。

### 4. 插件原生界面导航

```
[搜索列表] ──回车 action=open_renderer──→ [插件界面]
[插件界面] ──Esc──→ [搜索列表]
```

## Data Structures

```rust
// SearchResult
pub struct SearchResult {
    pub plugin_id: String,
    pub title: String,
    pub subtitle: String,
    pub relevance: f64,
    pub icon_path: String,
    pub action: String,       // 默认 "execute"
    pub template: String,     // 默认 "default"
}

// SearchResultDTO
pub struct SearchResultDTO {
    pub plugin_id: String,
    pub title: String,
    pub subtitle: String,
    pub relevance: f64,
    pub icon_path: String,
    pub action: String,
    pub template: String,
}
```

## Tauri Commands

- `search(query)` — 空输入也走查询流程
- `get_plugin_renderer(plugin_id)` — 获取指定插件的 renderer

## Boundaries

- **Always:** template/action 默认值保证向后兼容、未注册模板回退到 default、renderer 通过 asset protocol 加载
- **Ask first:** 修改 Plugin trait 签名、修改 DLL ABI 约定
- **Never:** 插件直接操作主界面 DOM（renderer 除外）、破坏 DLL ABI 兼容性

## Success Criteria

1. SearchResult 新增 `action` (默认 `"execute"`) 和 `template` (默认 `"default"`)
2. 前端 TEMPLATES 注册表渲染列表项
3. 未注册模板回退到 default
4. search command 对空输入走查询流程
5. action 分发：execute → 执行，open_renderer → 展开原生界面
6. 插件原生界面 Esc 返回搜索列表
7. hello_plugin query("") 返回 template="compact" + action="open_renderer" 的结果
8. AppSearchPlugin 不受影响
9. cargo build / cargo test 通过