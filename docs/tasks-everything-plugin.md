# Tasks: Everything 文件搜索插件

## 任务列表

### Task 1: 创建插件项目结构
- **Acceptance**: `plugins/everything_search/` 目录存在，包含 Cargo.toml 和 plugin.json
- **Verify**: `cargo build -p everything_search` 编译通过（可能报缺少源码，但依赖解析成功）
- **Files**:
  - `plugins/everything_search/Cargo.toml`
  - `plugins/everything_search/plugin.json`

### Task 2: 实现后端核心 (src/lib.rs)
- **Acceptance**:
  - C ABI 导出函数全部实现 (plugin_create, plugin_destroy, plugin_id, plugin_name, plugin_query, plugin_free_results, plugin_invoke)
  - Everything API 封装正确处理错误
  - query 返回正确 JSON 格式
- **Verify**: `cargo build -p everything_search --release` 生成 DLL
- **Files**:
  - `plugins/everything_search/src/lib.rs`

### Task 3: 修改前端搜索逻辑 (src-ui/main.js)
- **Acceptance**:
  - 搜索框 input 事件在 `currentView === 'plugin'` 时调用 `plugin_invoke`
  - `renderPluginSearchResults()` 函数正确渲染 Everything 结果到 renderer 区域
  - 80ms debounce 在插件模式下同样生效
  - 键盘导航 (上下箭头、Enter、Esc) 在插件模式下正常工作
- **Verify**: 手动测试搜索交互
- **Files**:
  - `src-ui/main.js`

### Task 4: 实现前端 UI (renderer/)
- **Acceptance**:
  - renderer HTML 只包含结果列表容器（无搜索框）
  - 样式与主搜索结果一致
  - 文件/文件夹图标区分
- **Verify**: 手动测试 UI 显示
- **Files**:
  - `plugins/everything_search/renderer/index.html`
  - `plugins/everything_search/renderer/style.css`

### Task 5: 更新主程序配置
- **Acceptance**:
  - workspace members 包含 everything_search
  - build-plugins.bat 包含 everything_search 构建步骤
- **Verify**: `build-plugins.bat` 执行成功
- **Files**:
  - `Cargo.toml` (workspace members)
  - `build-plugins.bat`

### Task 6: 集成测试
- **Acceptance**:
  - 主搜索显示 Everything 入口
  - 点击进入二级视图
  - 搜索返回文件结果
  - 点击打开文件
  - Everything 未运行时显示错误
  - Esc 返回主搜索
- **Verify**: 手动测试完整流程
- **Files**: 无新增，验证现有功能

---

## 任务依赖

```
Task 1 ──→ Task 2 ──→ Task 5 ──→ Task 6
              │
              ├──→ Task 3 ──────────→ Task 6
              └──→ Task 4 ──────────→ Task 6
```

Task 2、Task 3、Task 4 可并行开发。
