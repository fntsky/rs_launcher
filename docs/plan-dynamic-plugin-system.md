# Implementation Plan: RS Launcher 动态插件系统

## Overview

为 RS Launcher 实现文件夹式动态插件系统。每个插件是一个独立文件夹，包含 DLL（逻辑引擎）、可选渲染器（HTML+JS+CSS）和 plugin.json 清单。程序启动时扫描 plugins/ 目录，通过 libloading 加载 DLL，DLL 实现 C ABI 导出函数参与搜索流程。渲染器通过 Tauri IPC 调用 DLL 逻辑。

## Architecture Decisions

- **DLL 接口**：C ABI（`extern "C"`），支持任何 C ABI 兼容语言（Rust/C/C++/Zig）
- **动态加载**：使用 `libloading` crate 运行时加载 DLL
- **Plugin trait 适配**：`DynamicPlugin` 包装器将 C ABI 适配为现有 Plugin trait
- **渲染器隔离**：HTML 注入主窗口 `<div>` 容器，CSS 使用插件 ID 命名空间
- **IPC 通信**：渲染器通过 `plugin_invoke` 命令调用 DLL 的 `plugin_invoke` 导出函数
- **错误容错**：单个插件加载失败跳过，不影响主程序和其他插件
- **插件目录**：硬编码 `plugins/` 相对于可执行文件

## Dependency Graph

```
plugin.json 解析 (manifest.rs)
    │
    ├── DLL 加载器 (loader.rs)
    │       │
    │       └── DynamicPlugin 包装器 (mod.rs)
    │               │
    │               └── PluginRegistry 修改 (registry.rs)
    │                       │
    │                       ├── PluginEngine (engine.rs) — 无需修改
    │                       │
    │                       ├── IPC 命令 (lib.rs)
    │                       │       │
    │                       │       └── 前端渲染器加载 (main.js)
    │                       │
    │                       └── plugins/mod.rs 修改（扫描动态插件）
    │
    └── 测试 DLL (tests/fixtures/)
```

## Task List

### Phase 1: 基础设施

- [ ] **Task 1: 添加 libloading 依赖**
  - Acceptance:
    - [ ] Cargo.toml 添加 `libloading = "0.8"`
    - [ ] `cargo build` 编译通过
  - Verify: `cargo build`
  - Dependencies: None
  - Files: `Cargo.toml`
  - Scope: XS

- [ ] **Task 2: 实现 plugin.json 解析 (manifest.rs)**
  - Acceptance:
    - [ ] `src/plugin/manifest.rs` 定义 `PluginManifest` 结构体
    - [ ] 实现 `PluginManifest::from_file(path)` 解析 JSON
    - [ ] 验证必需字段（id, name, version, dll）
    - [ ] 单元测试：有效 JSON 解析、缺失字段报错
  - Verify: `cargo test plugin::manifest`
  - Dependencies: Task 1
  - Files: `src/plugin/manifest.rs`（新建）, `src/plugin/mod.rs`
  - Scope: S

- [ ] **Task 3: 实现 DLL 加载器 (loader.rs)**
  - Acceptance:
    - [ ] `src/plugin/loader.rs` 实现 `PluginLoader` 结构体
    - [ ] `load(path: &Path)` 使用 libloading 加载 DLL
    - [ ] 加载必需导出函数（plugin_create, plugin_destroy, plugin_id, plugin_name, plugin_query, plugin_execute, plugin_free_results）
    - [ ] 可选加载 `plugin_invoke`
    - [ ] 错误处理：DLL 不存在、导出函数缺失、plugin_create 返回 null
    - [ ] 单元测试：使用 mock DLL 或跳过（需要实际 DLL 文件）
  - Verify: `cargo build`
  - Dependencies: Task 1
  - Files: `src/plugin/loader.rs`（新建）, `src/plugin/mod.rs`
  - Scope: M

- [ ] **Task 4: 实现 DynamicPlugin 包装器**
  - Acceptance:
    - [ ] `src/plugin/mod.rs` 定义 `DynamicPlugin` 结构体
    - [ ] `DynamicPlugin` 实现 `Plugin` trait（id/name/query/execute）
    - [ ] query 调用 `plugin_query`，解析 JSON 返回 `Vec<SearchResult>`
    - [ ] execute 调用 `plugin_execute`
    - [ ] 实现 `invoke(&self, command, args)` 调用 `plugin_invoke`
    - [ ] 实现 `Drop` trait 调用 `plugin_destroy` 并释放 Library
  - Verify: `cargo build`
  - Dependencies: Task 3
  - Files: `src/plugin/mod.rs`
  - Scope: M

### Checkpoint: Phase 1
- [ ] `cargo build` 通过
- [ ] `cargo test` 通过
- [ ] manifest 解析正确
- [ ] DLL 加载器可加载测试 DLL

---

### Phase 2: 插件注册与扫描

- [ ] **Task 5: 修改 PluginRegistry 支持动态插件**
  - Acceptance:
    - [ ] `PluginRegistry::register_dynamic(plugin: DynamicPlugin)` 方法
    - [ ] 内部统一存储为 `Box<dyn Plugin>`
    - [ ] 现有 `register`/`plugins`/`find_by_id` 方法无需修改
  - Verify: `cargo test plugin::registry`
  - Dependencies: Task 4
  - Files: `src/plugin/registry.rs`
  - Scope: S

- [ ] **Task 6: 实现插件目录扫描**
  - Acceptance:
    - [ ] `src/plugins/mod.rs` 添加 `scan_dynamic_plugins()` 函数
    - [ ] 扫描 `plugins/` 目录（相对于可执行文件）
    - [ ] 对每个子目录读取 `plugin.json`
    - [ ] 验证 DLL 文件存在
    - [ ] 调用 `PluginLoader::load` 加载 DLL
    - [ ] 创建 `DynamicPlugin` 注册到 `PluginRegistry`
    - [ ] 错误处理：跳过加载失败的插件，日志记录
  - Verify: `cargo build`
  - Dependencies: Task 5
  - Files: `src/plugins/mod.rs`
  - Scope: M

- [ ] **Task 7: 集成到启动流程**
  - Acceptance:
    - [ ] `src/lib.rs` 的 `run()` 函数修改 `create_registry()` 调用
    - [ ] 先注册内置插件，再扫描动态插件
    - [ ] `cargo run` 启动正常，内置插件工作
  - Verify: `cargo run`，搜索应用验证 AppSearchPlugin 工作
  - Dependencies: Task 6
  - Files: `src/plugins/mod.rs`, `src/lib.rs`
  - Scope: S

### Checkpoint: Phase 2
- [ ] `cargo build` 通过
- [ ] `cargo run` 启动正常
- [ ] 内置 AppSearchPlugin 正常工作
- [ ] 动态插件目录扫描执行（即使目录为空）

---

### Phase 3: IPC 命令与渲染器

- [ ] **Task 8: 添加 plugin_invoke IPC 命令**
  - Acceptance:
    - [ ] `src/lib.rs` 添加 `#[tauri::command] fn plugin_invoke`
    - [ ] 参数：`plugin_id: String, command: String, args: String`
    - [ ] 返回：`String`（JSON 结果）
    - [ ] 通过 `PluginRegistry::find_by_id` 找到插件
    - [ ] 转换为 `DynamicPlugin` 调用 `invoke` 方法
    - [ ] 错误处理：插件不存在返回 `{"error":"plugin not found"}`
  - Verify: `cargo build`
  - Dependencies: Task 7
  - Files: `src/lib.rs`
  - Scope: S

- [ ] **Task 9: 添加 get_plugin_renderers IPC 命令**
  - Acceptance:
    - [ ] `src/lib.rs` 添加 `#[tauri::command] fn get_plugin_renderers`
    - [ ] 返回 `Vec<RendererInfo>`（plugin_id, name, renderer_path）
    - [ ] 从 `PluginRegistry` 获取有渲染器的动态插件
    - [ ] `RendererInfo` 包含 `plugin_id`, `name`, `renderer_html`, `renderer_css`
  - Verify: `cargo build`
  - Dependencies: Task 7
  - Files: `src/lib.rs`
  - Scope: S

- [ ] **Task 10: 前端渲染器加载**
  - Acceptance:
    - [ ] `src-ui/main.js` 添加 `loadPluginRenderers()` 函数
    - [ ] 启动时调用 `get_plugin_renderers`
    - [ ] 对每个渲染器插件，创建 `<div id="plugin-renderer-{id}">` 容器
    - [ ] 注入 HTML 内容到容器
    - [ ] 注入 CSS 到 `<style>` 标签
    - [ ] 渲染器 JS 通过 `invoke('plugin_invoke', {pluginId, command, args})` 调用 DLL
  - Verify: `cargo run`，放置测试插件验证渲染器加载
  - Dependencies: Task 8, Task 9
  - Files: `src-ui/main.js`, `src-ui/index.html`
  - Scope: M

### Checkpoint: Phase 3
- [ ] `cargo build` 通过
- [ ] `cargo run` 启动正常
- [ ] `plugin_invoke` IPC 命令可用
- [ ] 渲染器 HTML 注入到主窗口

---

### Phase 4: 测试与示例

- [ ] **Task 11: 创建示例插件**
  - Acceptance:
    - [ ] `plugins/hello_plugin/` 目录
    - [ ] `plugin.json` 清单文件
    - [ ] Rust DLL 源码（独立 crate 或内嵌测试）
    - [ ] 可选渲染器 `renderer/index.html`
    - [ ] DLL 实现 query 返回示例结果
    - [ ] DLL 实现 invoke 响应自定义命令
  - Verify: `cargo run`，搜索 "hello" 验证示例插件结果出现
  - Dependencies: Task 10
  - Files: `plugins/hello_plugin/`（新建目录）
  - Scope: M

- [ ] **Task 12: 端到端测试**
  - Acceptance:
    - [ ] 启动程序，搜索关键词
    - [ ] 动态插件结果与内置插件结果统一展示
    - [ ] 选中动态插件结果执行成功
    - [ ] 渲染器 UI 正常显示
    - [ ] 渲染器调用 `plugin_invoke` 成功
    - [ ] 插件加载失败不影响主程序
  - Verify: 手动测试
  - Dependencies: Task 11
  - Files: None
  - Scope: S

### Checkpoint: Complete
- [ ] 所有测试通过
- [ ] 示例插件工作正常
- [ ] 渲染器 IPC 通信正常
- [ ] 错误容错验证
- [ ] Review with human

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| libloading 在 Windows 上的 DLL 路径问题 | High | 使用绝对路径，确保 DLL 依赖项在同一目录 |
| DLL 导出函数签名不匹配 | Med | 详细文档 + 示例 DLL 代码 |
| 渲染器 JS 错误影响主窗口 | Low | try-catch 包裹注入代码，错误时标记容器状态 |
| plugin_query 返回无效 JSON | Low | 解析失败时返回空结果，日志记录 |
| 并行查询时 DLL 线程安全 | Med | 文档要求 DLL 实现 `Send + Sync`，测试验证 |

## Open Questions

- 无（所有问题已在规范中解决或标记为待办）
