# Implementation Plan: 插件自主决定列表项样式与行为

## Overview

扩展 SearchResult 新增 `action` 和 `item_html` 字段，让插件通过 query() 自主决定列表项的完整渲染和行为。同时支持空输入走 query("")、open_renderer 动作导航到插件原生界面。

## Architecture Decisions

- **插件控制一切，前端不推断**：action 和 item_html 由插件填充，前端只读取和分发
- **向后兼容**：新字段 serde(default)，现有插件不需要修改
- **前端始终包裹 result-item 外壳**：确保选中/hover/点击/键盘导航不受 item_html 影响
- **空输入走 query("")**：去掉 engine 和 command 中的空输入短路

## Dependency Graph

```
SearchResult (action + item_html)
    │
    ├── SearchResultDTO (action + item_html)
    │       │
    │       ├── search command (去掉空输入短路)
    │       │       │
    │       │       └── 前端 search input handler
    │       │
    │       └── get_plugin_renderer command
    │               │
    │               └── 前端 openPluginRenderer
    │
    ├── PluginEngine::query (去掉空输入短路)
    │
    └── hello_plugin query (返回 action + item_html)
```

## Task List

### Phase 1: 后端数据模型

---

## Task 1: SearchResult 新增 action + item_html 字段

**Description:** 在 SearchResult struct 中新增 `action: String` 和 `item_html: String` 字段，带 serde 默认值，确保现有 JSON 反序列化不受影响。

**Acceptance criteria:**
- [ ] SearchResult 包含 `action: String`，默认 `"execute"`
- [ ] SearchResult 包含 `item_html: String`，默认空字符串
- [ ] 现有测试通过（SearchResult 构造需补全新字段或使用 Default）
- [ ] 新增测试：验证 JSON 反序列化时 action 和 item_html 的默认值

**Verification:**
- [ ] `cargo test` 通过
- [ ] `cargo build` 通过

**Dependencies:** None

**Files likely touched:**
- `src/plugin/mod.rs`

**Estimated scope:** S (1-2 files)

---

## Task 2: PluginEngine 去掉空输入短路 + SearchResultDTO 扩展 + 新增 get_plugin_renderer command

**Description:** 三项变更打包为一个垂直切片：(1) PluginEngine::query 去掉 `input.is_empty()` 短路，(2) SearchResultDTO 新增 action/item_html 字段，(3) search command 去掉空输入短路，(4) 新增 get_plugin_renderer command，(5) 更新现有测试中的 SearchResult 构造。

**Acceptance criteria:**
- [ ] PluginEngine::query("") 不再返回空 Vec，而是走正常查询流程
- [ ] SearchResultDTO 包含 `action` 和 `item_html` 字段
- [ ] search command 对空输入不再短路
- [ ] 新增 get_plugin_renderer command，接收 plugin_id 返回 Option<RendererInfo>
- [ ] 所有现有测试更新通过
- [ ] query_empty_input 测试更新：空输入走查询而非返回空

**Verification:**
- [ ] `cargo test` 通过
- [ ] `cargo build` 通过

**Dependencies:** Task 1

**Files likely touched:**
- `src/plugin/engine.rs`
- `src/lib.rs`

**Estimated scope:** M (3-5 files)

---

### Checkpoint: Phase 1
- [ ] `cargo build` + `cargo test` 通过
- [ ] SearchResult 和 DTO 包含新字段
- [ ] 空输入走 query 流程

---

### Phase 2: 前端渲染 + 导航

---

## Task 3: 前端 — item_html 渲染 + plugin-view 容器 + 导航逻辑

**Description:** 完整的前端垂直切片：(1) HTML 新增 plugin-view 容器，(2) CSS 新增样式，(3) JS 修改 renderResults 支持 item_html，(4) 空输入触发 search("")，(5) executeResult 根据 action 分发，(6) openPluginRenderer / closePluginRenderer 导航，(7) Esc 在 plugin 视图返回搜索。

**Acceptance criteria:**
- [ ] renderResults 中 item_html 非空时直接注入，为空时用默认模板
- [ ] 前端始终包裹 result-item 外壳（data-index, data-plugin-id, class）
- [ ] 搜索框为空时触发 search("")，显示插件默认入口
- [ ] action="execute" 时调用 invoke('execute_result', ...)
- [ ] action="open_renderer" 时调用 openPluginRenderer
- [ ] openPluginRenderer 获取 renderer HTML+CSS，注入 plugin-view，切换视图
- [ ] closePluginRenderer 清空内容，恢复搜索视图
- [ ] Esc 在 plugin 视图下调用 closePluginRenderer
- [ ] 现有 AppSearchPlugin 结果不受影响

**Verification:**
- [ ] `npm run dev` 启动成功
- [ ] 输入文字搜索应用正常
- [ ] 空输入显示插件默认项（hello_plugin 更新后）

**Dependencies:** Task 2

**Files likely touched:**
- `src-ui/index.html`
- `src-ui/styles.css`
- `src-ui/main.js`

**Estimated scope:** M (3-5 files)

---

### Phase 3: 更新示例插件

---

## Task 4: 更新 hello_plugin query 返回 action + item_html

**Description:** 修改 hello_plugin 的 query 方法，使其对空输入和 "hello" 输入都返回结果，包含 action="open_renderer" 和自定义 item_html。

**Acceptance criteria:**
- [ ] query("") 返回至少一个结果，action 为 "open_renderer"
- [ ] query("hello") 返回结果，action 为 "open_renderer"
- [ ] 结果包含 item_html，提供自定义列表项 HTML
- [ ] query 其他内容返回空数组（不变）
- [ ] DLL 编译通过

**Verification:**
- [ ] `cargo build -p hello_plugin --release` 通过
- [ ] 手动测试：空输入看到 hello_plugin 入口

**Dependencies:** Task 1 (SearchResult 字段定义)

**Files likely touched:**
- `plugins/hello_plugin/src/lib.rs`

**Estimated scope:** S (1-2 files)

---

### Checkpoint: Phase 2-3
- [ ] `npm run dev` 启动正常
- [ ] 空输入显示 hello_plugin 默认入口（自定义样式）
- [ ] 点击/回车 open_renderer 项进入插件界面
- [ ] Esc 返回搜索列表
- [ ] 输入 "chrome" 搜索应用，回车打开（execute 行为正常）

---

### Phase 4: 端到端验证

---

## Task 5: 端到端测试与验证

**Description:** 完整手动验证所有用户故事，修复发现的问题。

**Acceptance criteria:**
- [ ] 空输入 → 显示 hello_plugin 默认入口（自定义 item_html 样式）
- [ ] 回车 open_renderer 项 → 进入 hello_plugin 原生界面
- [ ] Esc → 返回搜索列表
- [ ] 输入 "hello" → hello_plugin 返回结果，回车进入原生界面
- [ ] 输入 "chrome" → app_search 返回结果，回车打开应用
- [ ] cargo test 通过
- [ ] cargo build 通过

**Verification:**
- [ ] `cargo test` 通过
- [ ] `npm run build` 构建成功
- [ ] 手动验证所有场景

**Dependencies:** Task 3, Task 4

**Files likely touched:**
- 可能修复 Task 3/4 中发现的问题

**Estimated scope:** S (1-2 files，仅修复)

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| item_html 注入破坏 result-item 外壳样式 | Med | 前端始终包裹外壳，item_html 注入到外壳内部 |
| 空输入查询所有插件性能差 | Low | 现有并行查询已很快，空输入也是轻量查询 |
| 现有测试 SearchResult 构造需补全新字段 | Low | 用 Default trait 或 ..Default::default() 简化 |
| get_plugin_renderer 找不到插件 | Low | 返回 None，前端显示错误提示 |

## Open Questions

None — spec 已明确。
