# Spec: RS Launcher 动态插件系统

## Objective

为 RS Launcher 实现文件夹式动态插件系统。每个插件是一个独立文件夹，包含：
- **编译好的 DLL**（逻辑引擎）：实现 C ABI 导出函数，参与搜索流程，提供 query/execute 逻辑
- **渲染器**（HTML+JS+CSS）：可选的 UI 片段，嵌入主窗口展示
- **plugin.json**：插件描述清单

程序启动时扫描插件目录，读取 plugin.json 加载 DLL 和渲染器。渲染器通过 Tauri IPC 总线调用 DLL 逻辑。

**用户故事：**
- 开发者创建插件文件夹 → 编写 DLL 导出 C ABI 函数 → 可选提供渲染器 → 放入 plugins 目录 → 重启 launcher 即可使用
- 用户输入关键词 → DLL 插件参与搜索 → 结果统一展示在主窗口 → 选中结果执行 DLL 逻辑
- 插件需要特殊 UI → 渲染器 HTML 嵌入主窗口 → 用户通过渲染器交互 → 渲染器通过 IPC 调用 DLL

**成功标准：**
- 启动时自动发现并加载 plugins/ 下的所有合规插件文件夹
- DLL 插件参与搜索，返回 SearchResult 统一展示
- 渲染器可通过 IPC 调用对应 DLL 的自定义命令
- 插件加载失败不影响主程序和其他插件运行
- 插件可由任何支持 C ABI 的语言编写（Rust、C/C++、Zig 等）

## Tech Stack

- Rust 2021 edition + Tauri v2
- `libloading` crate：运行时加载 DLL
- C ABI（`extern "C"`）：DLL 导出接口
- WebView（Tauri 内置）：渲染器运行环境
- Tauri IPC：渲染器 ↔ DLL 通信总线

## Commands

```bash
Build:      cargo build
Run:        cargo run
Test:       cargo test
Lint:       cargo clippy
Format:     cargo fmt
Dev:        cargo tauri dev
```

## Project Structure

```
rs_launcher/
  src/
    main.rs              → 入口
    lib.rs               → Tauri app 构建、IPC 命令、AppState
    config.rs            → 热键配置
    icon.rs              → Win32 图标提取
    plugin/
      mod.rs             → Plugin trait、SearchResult、DynamicPlugin
      registry.rs        → PluginRegistry（静态+动态插件统一管理）
      engine.rs          → PluginEngine 并行调度
      loader.rs          → DLL 动态加载器（libloading）
      manifest.rs        → plugin.json 解析
      ipc.rs             → 动态插件 IPC 命令注册与分发
    plugins/
      mod.rs             → 内置插件注册
      app_search.rs      → 应用搜索插件（内置）
    search/
      mod.rs             → 搜索模块导出
      fuzzy.rs           → 模糊匹配
      pinyin.rs          → 拼音转换
  src-ui/
    index.html           → 主窗口 HTML
    styles.css           → 样式
    main.js              → 主窗口逻辑
  plugins/               → 外部插件目录（运行时扫描）
    example_plugin/
      plugin.json        → 插件描述
      example_plugin.dll → 逻辑引擎（编译好的 DLL）
      renderer/          → 渲染器（可选）
        index.html       → 渲染器 HTML 片段
        style.css        → 渲染器样式
        script.js        → 渲染器逻辑
```

## 插件文件夹结构

```
plugins/
  my_plugin/
    plugin.json           # 必需：插件清单
    my_plugin.dll         # 必需：逻辑引擎 DLL
    renderer/             # 可选：渲染器
      index.html          # 必需（如有 renderer）：HTML 片段
      style.css           # 可选：样式
      script.js           # 可选：交互逻辑
```

### plugin.json 规范

```json
{
  "id": "my_plugin",
  "name": "我的插件",
  "version": "1.0.0",
  "description": "插件描述",
  "author": "作者名",
  "dll": "my_plugin.dll",
  "renderer": "renderer/index.html",
  "commands": [
    {
      "name": "greet",
      "params": ["name"],
      "description": "打招呼"
    }
  ]
}
```

| 字段 | 必需 | 说明 |
|------|------|------|
| id | 是 | 唯一标识，与 DLL 导出前缀对应 |
| name | 是 | 显示名称 |
| version | 是 | 语义化版本 |
| description | 否 | 插件描述 |
| author | 否 | 作者 |
| dll | 是 | DLL 文件名（相对于插件文件夹） |
| renderer | 否 | 渲染器入口路径（相对于插件文件夹），无则不加载渲染器 |
| commands | 否 | DLL 支持的自定义 IPC 命令列表 |

## DLL C ABI 接口

DLL 必须导出以下 C ABI 函数：

```c
// 必需：创建插件实例，返回不透明指针
extern "C" void* plugin_create(void);

// 必需：销毁插件实例
extern "C" void plugin_destroy(void* plugin);

// 必需：获取插件 ID（返回 UTF-8 字符串指针，调用者不释放）
extern "C" const char* plugin_id(void* plugin);

// 必需：获取插件显示名称
extern "C" const char* plugin_name(void* plugin);

// 必需：执行查询，返回 JSON 字符串（调用者用 plugin_free_results 释放）
// 输入: query UTF-8 字符串
// 返回: SearchResult 数组的 JSON，格式:
//   [{"plugin_id":"..","title":"..","subtitle":"..","relevance":0.8,"icon_path":".."}]
extern "C" const char* plugin_query(void* plugin, const char* query);

// 必需：执行选中动作
// argument_json: SearchResult 的 JSON 字符串
extern "C" void plugin_execute(void* plugin, const char* argument_json);

// 必需：释放 plugin_query 返回的字符串内存
extern "C" void plugin_free_results(const char* results);

// 可选：执行自定义 IPC 命令
// command: 命令名（如 "greet"）
// args_json: 参数 JSON 字符串
// 返回: 结果 JSON 字符串（调用者用 plugin_free_results 释放）
extern "C" const char* plugin_invoke(void* plugin, const char* command, const char* args_json);
```

### Rust DLL 示例

```rust
// 插件 DLL 端代码（独立 crate，crate-type = ["cdylib"]）
use std::ffi::{CStr, CString};
use std::os::raw::c_char;

struct MyPlugin;

impl MyPlugin {
    fn new() -> Self { Self }
    fn id(&self) -> &str { "my_plugin" }
    fn name(&self) -> &str { "我的插件" }
    fn query(&self, input: &str) -> String {
        // 返回 SearchResult JSON 数组
        format!(r#"[{{"plugin_id":"my_plugin","title":"结果","subtitle":"详情","relevance":0.8,"icon_path":""}}]"#)
    }
    fn execute(&self, _argument: &str) {}
    fn invoke(&self, command: &str, args: &str) -> String {
        match command {
            "greet" => format!(r#"{{"message":"Hello, {}!"}}"#, args),
            _ => r#"{"error":"unknown command"}"#.to_string(),
        }
    }
}

#[no_mangle]
pub extern "C" fn plugin_create() -> *mut MyPlugin {
    Box::into_raw(Box::new(MyPlugin::new()))
}

#[no_mangle]
pub extern "C" fn plugin_destroy(plugin: *mut MyPlugin) {
    if !plugin.is_null() { unsafe { drop(Box::from_raw(plugin)); } }
}

#[no_mangle]
pub extern "C" fn plugin_id(plugin: *mut MyPlugin) -> *const c_char {
    unsafe { CString::new((*plugin).id()).unwrap().into_raw() }
}

#[no_mangle]
pub extern "C" fn plugin_name(plugin: *mut MyPlugin) -> *const c_char {
    unsafe { CString::new((*plugin).name()).unwrap().into_raw() }
}

#[no_mangle]
pub extern "C" fn plugin_query(plugin: *mut MyPlugin, query: *const c_char) -> *const c_char {
    let query_str = unsafe { CStr::from_ptr(query).to_str().unwrap_or("") };
    let results = unsafe { (*plugin).query(query_str) };
    CString::new(results).unwrap().into_raw()
}

#[no_mangle]
pub extern "C" fn plugin_execute(plugin: *mut MyPlugin, argument: *const c_char) {
    let arg = unsafe { CStr::from_ptr(argument).to_str().unwrap_or("") };
    unsafe { (*plugin).execute(arg); }
}

#[no_mangle]
pub extern "C" fn plugin_free_results(s: *const c_char) {
    if !s.is_null() { unsafe { let _ = CString::from_raw(s as *mut c_char); } }
}

#[no_mangle]
pub extern "C" fn plugin_invoke(plugin: *mut MyPlugin, command: *const c_char, args: *const c_char) -> *const c_char {
    let cmd = unsafe { CStr::from_ptr(command).to_str().unwrap_or("") };
    let args_str = unsafe { CStr::from_ptr(args).to_str().unwrap_or("") };
    let result = unsafe { (*plugin).invoke(cmd, args_str) };
    CString::new(result).unwrap().into_raw()
}
```

## Code Style

```rust
// 动态插件包装器 — 将 C ABI DLL 适配为 Plugin trait
pub struct DynamicPlugin {
    manifest: PluginManifest,
    library: Library,       // libloading::Library
    plugin_ptr: *mut c_void,
    // 函数指针缓存
    fn_query: Symbol<'static, unsafe fn(*mut c_void, *const c_char) -> *const c_char>,
    fn_execute: Symbol<'static, unsafe fn(*mut c_void, *const c_char)>,
}
```

命名约定：
- 文件名：`snake_case.rs`
- trait/struct：`PascalCase`
- 函数/变量：`snake_case`
- DLL 导出函数：`snake_case`（C ABI 约定）
- JSON 字段：`snake_case`

## IPC 通信架构

```
┌─────────────────────────────────────────────────┐
│                  主窗口 WebView                   │
│  ┌───────────────────────────────────────────┐  │
│  │         搜索结果（统一渲染）                │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │     插件渲染器区域（按需注入 HTML）          │  │
│  │  ┌─────────┐  ┌─────────┐                 │  │
│  │  │Plugin A │  │Plugin B │                 │  │
│  │  │renderer │  │renderer │                 │  │
│  │  └─────────┘  └─────────┘                 │  │
│  └───────────────────────────────────────────┘  │
└───────────────┬─────────────────┬───────────────┘
                │ Tauri IPC       │ Tauri IPC
                ▼                 ▼
┌───────────────────────────────────────────────────┐
│                  Rust 后端                         │
│  ┌─────────────┐  ┌──────────────┐               │
│  │  search()   │  │ plugin_invoke│               │
│  │  execute()  │  │ (cmd, args)  │               │
│  └──────┬──────┘  └──────┬───────┘               │
│         ▼                ▼                        │
│  ┌──────────────────────────────────┐             │
│  │         PluginEngine             │             │
│  │  ┌──────────┐  ┌──────────────┐ │             │
│  │  │内置插件   │  │DynamicPlugin │ │             │
│  │  │AppSearch  │  │(libloading)  │ │             │
│  │  └──────────┘  └──────┬───────┘ │             │
│  └─────────────────────────┼────────┘             │
│                            ▼                      │
│                    ┌──────────────┐                │
│                    │   DLL 文件   │                │
│                    └──────────────┘                │
└───────────────────────────────────────────────────┘
```

### IPC 命令

| 命令 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `search` | `{ query: String }` | `Vec<SearchResultDTO>` | 查询所有插件（含动态） |
| `execute_result` | `{ subtitle: String }` | `()` | 执行搜索结果 |
| `plugin_invoke` | `{ plugin_id: String, command: String, args: String }` | `String` | 渲染器调用 DLL 自定义命令 |
| `get_plugin_renderers` | `()` | `Vec<RendererInfo>` | 获取所有有渲染器的插件信息 |
| `get_config` | `()` | `ConfigDTO` | 获取热键配置 |
| `save_hotkey` | `{ shortcutStr: String }` | `Result<(), String>` | 保存热键 |

### 渲染器加载流程

1. 主窗口启动时，调用 `get_plugin_renderers` 获取有渲染器的插件列表
2. 对每个插件，读取 `renderer/index.html` 内容
3. 在主窗口中创建隔离的 `<div>` 容器，注入 HTML
4. 注入的 JS 通过 `window.__TAURI__.core.invoke('plugin_invoke', { pluginId, command, args })` 调用 DLL
5. CSS 通过 `<style>` 标签注入，使用插件 ID 作为命名空间避免冲突

### 渲染器隔离

```html
<!-- 主窗口中为每个插件创建的容器 -->
<div id="plugin-renderer-my_plugin" class="plugin-renderer" style="display:none">
  <!-- 插件 renderer/index.html 内容注入此处 -->
</div>
```

```css
/* 渲染器样式隔离：所有样式限定在插件容器内 */
#plugin-renderer-my_plugin { /* ... */ }
```

## 启动加载流程

```
程序启动
  │
  ├── 1. 加载内置插件（AppSearchPlugin 等）到 PluginRegistry
  │
  ├── 2. 扫描 plugins/ 目录
  │       │
  │       ├── 读取每个子目录的 plugin.json
  │       │     │
  │       │     ├── 验证必需字段（id, name, version, dll）
  │       │     │
  │       │     └── 验证 DLL 文件存在
  │       │
  │       └── 对每个合规插件:
  │             │
  │             ├── libloading::Library::open(dll_path)
  │             │
  │             ├── 加载导出函数（plugin_create, plugin_query, ...）
  │             │
  │             ├── 调用 plugin_create() 获取实例指针
  │             │
  │             └── 创建 DynamicPlugin 包装器注册到 PluginRegistry
  │
  ├── 3. 创建 PluginEngine(registry)
  │
  ├── 4. 注册 IPC 命令（search, execute_result, plugin_invoke, ...）
  │
  ├── 5. 前端加载渲染器
  │       │
  │       ├── 调用 get_plugin_renderers
  │       │
  │       └── 对每个渲染器插件，读取 HTML 注入到容器
  │
  └── 6. 显示主窗口
```

## 错误处理

| 场景 | 处理方式 |
|------|---------|
| plugin.json 缺失或格式错误 | 跳过该插件，日志记录错误 |
| DLL 文件不存在 | 跳过该插件，日志记录错误 |
| DLL 导出函数缺失 | 跳过该插件，释放已加载的 Library |
| plugin_create() 返回 null | 跳过该插件 |
| plugin_query() 返回无效 JSON | 视为空结果，日志记录 |
| plugin_invoke() 未知命令 | 返回 `{"error":"unknown command"}` |
| 渲染器 HTML 读取失败 | 跳过渲染器，DLL 逻辑仍可用 |
| 渲染器 JS 执行错误 | 容器标记错误状态，不影响其他插件 |

## Testing Strategy

- 框架：`#[test]` + 标准库 assert
- **manifest 解析测试**：给定 JSON 验证结构解析
- **DLL 加载测试**：编译测试用 DLL，验证加载和函数调用
- **DynamicPlugin 适配测试**：验证 DynamicPlugin 实现 Plugin trait 的 query/execute
- **IPC 分发测试**：验证 plugin_invoke 正确路由到对应 DLL
- **错误容错测试**：模拟各种加载失败场景
- 测试目录：与源文件同目录 `#[cfg(test)] mod tests`
- 需要一个 `tests/fixtures/` 目录存放测试用 DLL

## Boundaries

- **Always:** 新插件必须包含 plugin.json + DLL；加载失败不影响其他插件；DLL 导出必须遵循 C ABI 规范
- **Always:** 渲染器通过 IPC 调用 DLL，不直接 FFI；渲染器样式限定在插件容器内
- **Ask first:** 修改 DLL C ABI 接口签名；添加新的必需导出函数；修改 plugin.json 必需字段；修改渲染器加载方式
- **Never:** 在渲染器中直接调用 Win32 API；在 DLL 中直接操作 Tauri 窗口；跳过 plugin.json 验证直接加载 DLL

## Success Criteria

1. 启动时自动扫描 plugins/ 目录，加载所有合规插件
2. DLL 插件实现 query，搜索结果与内置插件统一展示
3. DLL 插件实现 execute，选中结果执行对应动作
4. 渲染器 HTML 嵌入主窗口，通过 IPC 调用 DLL 的 plugin_invoke
5. plugin.json 缺失/格式错误/DLL 加载失败 → 跳过该插件，主程序正常运行
6. 内置 AppSearchPlugin 不受影响，继续正常工作
7. cargo build / cargo test 通过

## Resolved Questions

1. 插件目录位置：硬编码 `plugins/` 相对可执行文件
2. 渲染器隔离：直接注入 `<div>` 容器，不用 iframe
3. plugin_invoke 参数：无需类型校验，透传 JSON 字符串

## Deferred (待办)

- 插件启用/禁用 UI
- DLL 热更新（运行时重新加载插件）
