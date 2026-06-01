# Spec: RS Launcher 插件系统

## Objective

为 RS Launcher 实现插件系统，将搜索逻辑从 UI 中解耦。用户输入查询字符串，系统将查询分发给所有已注册插件，各插件返回匹配结果，统一展示在 UI 中。

**用户故事：**
- 用户输入关键词 → 所有插件并发搜索 → 结果按相关度排序展示 → 选中结果执行对应动作

**成功标准：**
- 输入文字后，插件能返回结构化结果并展示在 Slint UI 中
- 新插件只需实现 trait + 一行注册代码，无需改动 UI 或核心逻辑
- 查询响应时间 < 100ms（本地搜索场景）

## Tech Stack

- Rust 2021 edition
- Slint 1.16（UI）
- **第一期**：编译时静态注册（trait + Box<dyn Plugin>）
- **第二期**：动态加载 .dll 插件（使用 `libloading` crate，Plugin trait 需 FFI 安全）
- 异步查询使用 `std::thread::scope` 并行执行（保持依赖精简）

## Commands

```bash
Build:    cargo build
Run:      cargo run
Test:     cargo test
Lint:     cargo clippy
Format:   cargo fmt
```

## Project Structure

```
src/
  main.rs          → 入口
  app.rs           → Slint 窗口逻辑，调用 PluginEngine
  plugin/
    mod.rs          → Plugin trait 定义 + PluginEngine 调度器
    registry.rs     → 插件注册表
  plugins/
    mod.rs          → 内置插件汇总注册
    app_search.rs   → 应用搜索插件（Start Menu / Desktop 快捷方式）
  hotkey.rs         → 全局热键
  tray.rs           → 系统托盘
ui/
  launcher.slint    → Slint UI 定义
```

## Code Style

```rust
// 插件 trait — 所有插件的核心接口
pub trait Plugin: Send + Sync {
    fn id(&self) -> &str;           // 唯一标识，如 "app_search"
    fn name(&self) -> &str;         // 显示名称，如 "应用程序"
    fn query(&self, input: &str) -> Vec<SearchResult>;
}

// 搜索结果结构
pub struct SearchResult {
    pub plugin_id: String,          // 来源插件 ID
    pub title: String,              // 结果标题
    pub subtitle: String,           // 副标题/路径
    pub relevance: f64,             // 相关度分数 0.0~1.0，用于排序
    pub icon: Option<IconData>,     // 图标（后续扩展）
}
```

命名约定：
- 文件名：`snake_case.rs`
- trait/struct：`PascalCase`
- 函数/变量：`snake_case`
- 常量：`SCREAMING_SNAKE_CASE`

## 插件系统设计

### 核心 Trait

```rust
pub trait Plugin: Send + Sync {
    /// 插件唯一标识
    fn id(&self) -> &str;

    /// 插件显示名称
    fn name(&self) -> &str;

    /// 执行查询，返回匹配结果（按 relevance 降序排列）
    fn query(&self, input: &str) -> Vec<SearchResult>;

    /// 执行选中动作（打开文件、运行命令等）
    fn execute(&self, result: &SearchResult);
}
```

### 调度流程

```
用户输入 → app.rs on_search_changed
              ↓
         PluginEngine::query(input)
              ↓
         遍历所有注册插件，调用 plugin.query(input)
              ↓
         合并结果，按 relevance 降序排序
              ↓
         更新 Slint 组件的 result model
              ↓
         用户选中结果 → plugin.execute(&result)
```

### 注册机制

```rust
// registry.rs
pub struct PluginRegistry {
    plugins: Vec<Box<dyn Plugin>>,
}

impl PluginRegistry {
    pub fn new() -> Self;
    pub fn register(&mut self, plugin: Box<dyn Plugin>);
    pub fn plugins(&self) -> &[Box<dyn Plugin>];
}

// plugins/mod.rs — 统一注册入口
pub fn create_registry() -> PluginRegistry {
    let mut registry = PluginRegistry::new();
    registry.register(Box::new(AppSearchPlugin::new()));
    // 后续新增插件只需在此添加一行
    registry
}
```

### Slint 端数据绑定

在 `launcher.slint` 中定义结果模型：

```slint
export struct SearchResultItem {
    plugin-id: string,
    title: string,
    subtitle: string,
    relevance: float,
}

export component LauncherWindow inherits Window {
    // ...
    in-out property <[SearchResultItem]> search-results: [];
    callback result-selected(int);  // 参数为选中索引
}
```

### 相关度排序

每个 `SearchResult` 携带 `relevance: f64`（0.0~1.0），由插件自行计算：

| 匹配类型 | 建议分数 |
|----------|---------|
| 标题完全匹配 | 1.0 |
| 标题前缀匹配 | 0.8~0.9 |
| 标题包含匹配 | 0.5~0.7 |
| 拼音/别名匹配 | 0.3~0.5 |

合并所有插件结果后，按 `relevance` 降序排列，分数相同按插件注册顺序排。

### 动态加载规划（第二期）

第一期使用 `Box<dyn Plugin>` 静态注册，trait 签名需为动态加载预留空间：

- Plugin trait 方法签名使用 `&str` / `String` / `f64` 等 FFI 安全类型
- 不使用泛型、async、Rust 专属类型（如 `PathBuf`）
- 第二期引入 `libloading`，定义 C ABI 的插件接口：
  ```rust
  // 第二期：动态插件通过 C ABI 导出
  #[no_mangle]
  pub extern "C" fn plugin_create() -> *mut dyn Plugin;
  ```
- 动态插件放在 `plugins/` 目录下，启动时扫描 `.dll` 文件加载

- 使用 `std::thread::scope` 并行调用各插件的 `query`
- 各插件在独立线程中执行，结果通过 `Vec` 收集
- 主线程汇总后更新 Slint model
- 查询结果通过 `slint::invoke_from_event_loop` 回传 UI 线程

## Testing Strategy

- 框架：`#[test]` + 标准库 assert
- 插件 trait 测试：mock 插件验证 dispatch 逻辑
- 注册表测试：注册/查询/遍历
- 各插件独立测试：给定输入，验证输出结果
- 测试目录：与源文件同目录 `#[cfg(test)] mod tests`

## Boundaries

- **Always:** 新插件必须实现 Plugin trait + 在 create_registry 中注册
- **Always:** 查询结果必须包含 plugin_id 用于分组和动作分发
- **Ask first:** 修改 Plugin trait 签名、添加新依赖、修改 Slint 数据模型
- **Never:** 在插件中直接操作 Slint 组件、在 Plugin trait 中引入 async

## Success Criteria

1. Plugin trait 定义完成，包含 id/name/query/execute
2. PluginRegistry 实现注册与遍历
3. app.rs 在 search_changed 回调中调用 PluginEngine
4. 查询结果更新到 Slint UI 的 search-results model
5. 首个内置插件（AppSearchPlugin）能搜索开始菜单快捷方式
6. 选中结果可执行打开应用
7. cargo build / cargo test 通过

## Open Questions

1. 是否需要结果缓存？相同查询是否重复搜索？
2. 图标支持是否在第一期实现？
3. 是否需要插件启用/禁用配置？
