# Spec: Everything 文件搜索插件

## Objective

创建一个新插件，使用 `everything-sys` crate 集成 VoidTools Everything 文件搜索引擎，为 RS Launcher 提供极速文件搜索能力。

**用户故事:**
- 用户在主搜索栏输入时，看到应用程序结果（现有功能）
- 用户选择"文件搜索"结果后，进入二级视图（插件 renderer）
- 进入二级视图后，**继续在全局搜索框输入**，搜索词传给 Everything 插件
- Everything 返回文件/文件夹结果，显示在 renderer 结果区域
- 用户点击文件结果，用系统默认程序打开

**成功标准:**
1. 插件能成功加载 Everything SDK 并执行搜索
2. 搜索结果在二级视图中正确显示
3. 点击结果能打开文件或文件夹
4. Everything 未运行时有优雅的错误提示
5. 搜索延迟 < 100ms（Everything 本地数据库查询）
6. 二级视图中全局搜索框可用，输入即搜 Everything

## Tech Stack

- **后端**: Rust 2021 + `everything-sys` v0.1.4 (VoidTools Everything C bindings)
- **前端**: 复用全局搜索框 + renderer 结果列表
- **依赖**: Everything 软件 (用户需预先安装)

## Commands

```bash
# 构建主程序
cargo build --release

# 构建插件 (使用 build-plugins.bat)
build-plugins.bat

# 运行开发模式
cargo tauri dev

# 测试插件加载
cargo run
```

## Project Structure

```
plugins/
└── everything_search/          # 新插件目录
    ├── Cargo.toml              # 插件依赖配置
    ├── plugin.json             # 插件清单
    ├── src/
    │   └── lib.rs              # 插件实现 (C ABI 导出)
    └── renderer/
        ├── index.html          # 二级视图 UI
        └── style.css           # 样式

src/
├── plugin/                     # 插件系统核心 (无需修改)
└── plugins/
    └── mod.rs                  # 内置插件注册 (无需修改)
```

## Code Style

遵循现有插件模式 (`plugins/hello_plugin/`):

```rust
// C ABI 导出函数
#[no_mangle]
pub extern "C" fn plugin_create() -> *mut EverythingPlugin {
    Box::into_raw(Box::new(EverythingPlugin::new()))
}

#[no_mangle]
pub extern "C" fn plugin_destroy(p: *mut EverythingPlugin) {
    if !p.is_null() { unsafe { drop(Box::from_raw(p)); } }
}

// 查询返回 JSON 数组
#[no_mangle]
pub extern "C" fn plugin_query(p: *mut EverythingPlugin, q: *const c_char) -> *const c_char {
    // 使用 everything-sys API 搜索
    // 返回 JSON 格式的 SearchResult 数组
}
```

## Everything API 使用

`everything-sys` crate 提供原始 C 绑定，核心流程:

```rust
use everything_sys::*;
use widestring::U16CString;

unsafe {
    // 1. 设置搜索词 (Unicode)
    let search_w = U16CString::from_str("query").unwrap();
    Everything_SetSearchW(search_w.as_ptr());

    // 2. 执行查询
    if Everything_QueryW(true) == 0 {
        let err = Everything_GetLastError();
        // 处理错误 (Everything 未运行等)
    }

    // 3. 获取结果数量
    let count = Everything_GetNumResults();

    // 4. 遍历结果
    for i in 0..count {
        let path = Everything_GetResultFullPathNameW(i, ...);
        let is_folder = Everything_IsFolderResult(i) != 0;
        let size = Everything_GetResultSize(i);
        // ...
    }
}
```

## Testing Strategy

- **手动测试**: 安装 Everything 后运行插件，验证搜索功能
- **错误处理测试**: Everything 未运行时的错误提示
- **边界测试**: 空搜索、特殊字符、大量结果

## Boundaries

### Always
- 使用 `unsafe` 块包裹 Everything API 调用
- 检查 `Everything_QueryW` 返回值和 `Everything_GetLastError()`
- 限制最大结果数 (建议 100 条)
- 使用 Unicode 版本 API (`*W` 后缀)

### Ask First
- 修改主程序插件系统代码
- 添加新的 Tauri command
- 修改前端核心逻辑

### Never
- 在主搜索中直接调用 Everything (性能考虑)
- 阻塞 UI 线程进行长时间搜索
- 忽略 Everything 未安装/未运行的情况

## Success Criteria

1. **功能完整**
   - [ ] 插件在主搜索中显示入口结果
   - [ ] 点击后进入二级视图
   - [ ] 二级视图中输入搜索词返回文件结果
   - [ ] 点击文件结果打开文件

2. **错误处理**
   - [ ] Everything 未运行时显示友好提示
   - [ ] 搜索失败时显示错误信息

3. **性能**
   - [ ] 搜索响应时间 < 100ms
   - [ ] 结果限制在合理数量内

4. **用户体验**
   - [ ] 二级视图有返回按钮
   - [ ] 支持键盘导航 (上下箭头、Enter、Esc)
   - [ ] 文件图标正确显示

## Open Questions

1. ~~**图标获取**~~ → 已决定: 使用系统默认图标 (文件夹/文件 emoji)
2. ~~**搜索触发**~~ → 已决定: 80ms debounce
3. **结果排序**: 是否使用 Everything 内置排序?
   - 建议: 使用 `Everything_SetSort` 按相关性排序

## Implementation Notes

### 二级菜单导航流程

```
主搜索视图                    二级视图 (Everything Renderer)
    │                              │
    │ 输入 "ev" 或 "文件"          │
    │                              │
    ▼                              │
显示 "Everything 文件搜索" 入口    │
    │                              │
    │ 点击 / Enter                 │
    │─────────────────────────────▶│
    │                              │
    │                         全局搜索框保留可用
    │                         renderer 只显示结果区域
    │                              │
    │                         在搜索框输入 "test"
    │                              ▼
    │                         plugin_invoke("search", "test")
    │                              ▼
    │                         Everything 返回文件结果
    │                              │
    │                         点击文件
    │                              ▼
    │                         打开文件
    │                              │
    │◀─────────────────────────────│
    │         Esc / 返回按钮        │
```

### 全局搜索框复用机制

进入 renderer 视图后，全局搜索框的 input 事件行为变化：

- **普通模式** (`currentView === 'search'`): 调用 `invoke('search', { query })`
- **插件模式** (`currentView === 'plugin'`): 调用 `invoke('plugin_invoke', { pluginId, command: "search", args })` 并将结果渲染到 renderer 区域

需要修改 `src-ui/main.js` 的搜索 input 事件处理，增加插件模式分支。

### 插件 invoke 命令

插件需要支持的 invoke 命令：

| 命令 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `search` | `{"query": "test"}` | `{"results": [...]}` | Everything 搜索 |

返回格式：
```json
{
  "results": [
    {
      "title": "test.txt",
      "subtitle": "C:\\Users\\...",
      "is_folder": false,
      "size": 1024
    }
  ],
  "error": null
}
```

### 主程序修改 (必须)

需要修改 `src-ui/main.js`，在搜索框 input 事件中增加插件模式分支：

```javascript
// 现有代码 (searchInput input 事件)
searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim();
  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(async () => {
    if (currentView === 'plugin' && activePluginId) {
      // 新增: 插件模式下，搜索词传给插件
      const args = JSON.stringify({ query });
      const res = await invoke('plugin_invoke', {
        pluginId: activePluginId,
        command: 'search',
        args
      });
      // 渲染到 renderer 区域
      renderPluginSearchResults(res);
    } else {
      // 原有逻辑
      const res = await invoke('search', { query });
      results = res;
      selectedIndex = results.length > 0 ? 0 : -1;
      renderResults();
      setWindowSize(results.length > 0);
    }
  }, 80);
});
```

还需要在 `src-ui/main.js` 添加 `renderPluginSearchResults()` 函数，将插件返回的搜索结果渲染到 renderer 区域。

**方案选择**: 方案 A (插件返回固定入口结果)，无需修改主程序插件注册逻辑。
