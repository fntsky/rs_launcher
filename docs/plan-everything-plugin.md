# Plan: Everything 文件搜索插件

## 实现计划

### 组件依赖图

```
plugin.json ──→ DynamicPlugin::load() ──→ PluginRegistry
     │
Cargo.toml ──→ 编译 DLL ──→ plugins/everything_search/
     │
src/lib.rs ──→ C ABI 导出 ──→ everything-sys API 调用
     │
renderer/ ──→ 二级视图 UI ──→ Tauri plugin_invoke
```

### 实现顺序

1. **创建插件项目结构** — Cargo.toml, plugin.json
2. **实现后端核心** — src/lib.rs (Everything API 封装 + C ABI 导出)
3. **实现前端 UI** — renderer/index.html + style.css
4. **集成测试** — 构建并验证完整流程

### 风险与缓解

| 风险 | 缓解 |
|------|------|
| Everything 未安装/未运行 | 检测 `Everything_QueryW` 返回值，显示友好错误 |
| everything-sys 是原始绑定，无安全封装 | 用 `unsafe` 块隔离，提供 Rust 安全封装函数 |
| 搜索结果过多 | `Everything_SetMax(100)` 限制结果数 |
| Unicode 路径处理 | 使用 `*W` (宽字符) 版本 API |

### 主程序修改

需要修改的文件:

1. **`Cargo.toml`** — workspace members 添加 `plugins/everything_search`
2. **`build-plugins.bat`** — 添加 everything_search 构建步骤
3. **`src-ui/main.js`** — 搜索框 input 事件增加插件模式分支 + `renderPluginSearchResults()` 函数

不需要修改:
- `src/plugin/` — 插件系统核心
- `src/plugins/mod.rs` — 内置插件注册
- `src/lib.rs` — Tauri commands

### 验证检查点

1. `cargo build -p everything_search` 编译通过
2. DLL 生成在 `plugins/everything_search/` 目录
3. 启动 RS Launcher，主搜索显示 Everything 入口
4. 点击入口进入二级视图
5. 输入搜索词，显示文件结果
6. 点击文件结果，文件打开
7. Everything 未运行时显示错误提示
8. Esc 返回主搜索
