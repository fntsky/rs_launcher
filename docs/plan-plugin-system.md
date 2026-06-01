# Implementation Plan: RS Launcher 插件系统

## Overview

为 RS Launcher 实现插件系统：定义 Plugin trait 和 SearchResult 结构，实现 PluginRegistry 注册和 PluginEngine 调度，更新 Slint UI 展示搜索结果，实现首个内置插件 AppSearchPlugin 搜索 Windows 开始菜单快捷方式。

## Architecture Decisions

- Plugin trait 使用 `Send + Sync` 约束，支持线程并行查询
- SearchResult 携带 `relevance: f64`，插件自行计算相关度，合并后降序排列
- 第一期静态注册 `Box<dyn Plugin>`，trait 签名只用 FFI 安全类型，为第二期动态加载预留
- 查询在 `std::thread::scope` 中并行执行，结果通过 `slint::invoke_from_event_loop` 回传 UI 线程
- Slint 端用 `in-out property <[SearchResultItem]>` 绑定结果列表

## Dependency Graph

```
Plugin trait + SearchResult (Task 1)
    │
    ├── PluginRegistry (Task 2)
    │       │
    │       └── PluginEngine 调度 (Task 3)
    │               │
    │               ├── Slint UI 结果展示 (Task 4)
    │               │       │
    │               │       └── app.rs 集成 (Task 5)
    │               │
    │               └── AppSearchPlugin (Task 6)
    │                       │
    │                       └── 选中执行 (Task 7)
```

## Task List

### Phase 1: Foundation

- [ ] **Task 1: 定义 Plugin trait 和 SearchResult 结构**
  - Acceptance:
    - [ ] `src/plugin/mod.rs` 定义 `Plugin` trait（id/name/query/execute）
    - [ ] `SearchResult` 结构体包含 plugin_id/title/subtitle/relevance
    - [ ] `cargo build` 编译通过
  - Verify: `cargo build`
  - Dependencies: None
  - Files: `src/plugin/mod.rs`（新建）
  - Scope: S

- [ ] **Task 2: 实现 PluginRegistry**
  - Acceptance:
    - [ ] `src/plugin/registry.rs` 实现 `PluginRegistry`（new/register/plugins）
    - [ ] `src/plugin/mod.rs` 导出 registry 模块
    - [ ] 单元测试：注册插件、遍历插件列表
  - Verify: `cargo test`
  - Dependencies: Task 1
  - Files: `src/plugin/registry.rs`（新建）, `src/plugin/mod.rs`
  - Scope: S

- [ ] **Task 3: 实现 PluginEngine 调度器**
  - Acceptance:
    - [ ] `src/plugin/engine.rs` 实现 `PluginEngine`（query/execute）
    - [ ] `query` 方法并行调用所有插件的 query，合并结果按 relevance 降序排序
    - [ ] `execute` 方法根据 plugin_id 找到对应插件执行动作
    - [ ] 单元测试：mock 插件验证调度和排序
  - Verify: `cargo test`
  - Dependencies: Task 2
  - Files: `src/plugin/engine.rs`（新建）, `src/plugin/mod.rs`
  - Scope: M

### Checkpoint: Foundation
- [ ] `cargo build` 通过
- [ ] `cargo test` 通过
- [ ] Plugin trait / Registry / Engine 可独立工作

---

### Phase 2: UI Integration

- [ ] **Task 4: 更新 Slint UI 支持搜索结果展示**
  - Acceptance:
    - [ ] `launcher.slint` 定义 `SearchResultItem` struct
    - [ ] `LauncherWindow` 添加 `search-results` 属性和 `result-selected` 回调
    - [ ] 结果区域用 `for` 循环渲染列表项，显示 title/subtitle
    - [ ] 选中项高亮，点击触发 `result-selected`
  - Verify: `cargo build`，手动运行查看 UI 布局
  - Dependencies: Task 1（SearchResultItem 结构需与 SearchResult 对应）
  - Files: `ui/launcher.slint`
  - Scope: M

- [ ] **Task 5: app.rs 集成 PluginEngine**
  - Acceptance:
    - [ ] `app.rs` 创建 PluginEngine 实例
    - [ ] `on_search_changed` 回调中调用 engine.query，结果更新到 Slint model
    - [ ] `on_result_selected` 回调中调用 engine.execute
    - [ ] 查询在后台线程执行，通过 `invoke_from_event_loop` 更新 UI
  - Verify: `cargo build`，手动运行输入文字验证结果更新
  - Dependencies: Task 3, Task 4
  - Files: `src/app.rs`
  - Scope: M

### Checkpoint: UI Integration
- [ ] `cargo build` 通过
- [ ] 手动运行：输入文字 → UI 显示 mock 插件结果
- [ ] 点击结果项 → 回调触发

---

### Phase 3: First Plugin

- [ ] **Task 6: 实现 AppSearchPlugin**
  - Acceptance:
    - [ ] `src/plugins/app_search.rs` 实现 `AppSearchPlugin`
    - [ ] 扫描 Windows 开始菜单目录（`%APPDATA%\Microsoft\Windows\Start Menu` + 公共开始菜单）
    - [ ] 解析 .lnk 快捷方式获取应用名称和路径
    - [ ] query 方法按标题匹配计算 relevance（完全匹配 1.0，前缀 0.85，包含 0.6）
    - [ ] execute 方法用 `ShellExecuteW` 打开应用
    - [ ] `src/plugins/mod.rs` 注册 AppSearchPlugin
    - [ ] 单元测试：匹配逻辑和 relevance 计算
  - Verify: `cargo test`，手动运行搜索应用名验证结果
  - Dependencies: Task 2（需注册到 registry）
  - Files: `src/plugins/app_search.rs`（新建）, `src/plugins/mod.rs`（新建）, `src/main.rs`
  - Scope: M

- [ ] **Task 7: 选中结果执行应用**
  - Acceptance:
    - [ ] 点击搜索结果后，调用 `engine.execute` 启动对应应用
    - [ ] 执行后隐藏窗口、清空搜索
    - [ ] `cargo build` 通过
  - Verify: 手动运行 → 搜索 → 选中 → 应用启动 → 窗口隐藏
  - Dependencies: Task 5, Task 6
  - Files: `src/app.rs`
  - Scope: S

### Checkpoint: Complete
- [ ] `cargo build` 通过
- [ ] `cargo test` 通过
- [ ] 端到端：输入 → 搜索 → 展示 → 选中 → 执行
- [ ] Review with human

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| .lnk 文件解析复杂 | Med | 使用 `windows_sys` API `IShellLinkW` 解析，或先简化为只读文件名 |
| Slint model 更新延迟 | Low | 使用 `invoke_from_event_loop` 确保 UI 线程安全 |
| 并行查询线程安全 | Low | Plugin trait 要求 `Send + Sync`，各插件独立无共享状态 |
| 开始菜单路径变化 | Low | 同时扫描用户和公共两个开始菜单目录 |

## Open Questions

- .lnk 解析方式：用 COM IShellLinkW 还是简单读文件名？前者更准确但代码量大
