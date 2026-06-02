# Implementation Plan: 搜索栏交互增强

## Overview
两个独立的交互改进：1) 输入框有文字时阻止失焦关闭窗口；2) 搜索栏左侧预留返回箭头位置，进入插件视图时显示箭头。两个功能互不依赖，可按任意顺序实现。

## Architecture Decisions
- 返回箭头使用 `visibility: hidden/visible` 而非 `display: none`，确保布局不跳动
- 失焦关闭逻辑在 blur 事件中检查输入框当前值，无需额外状态变量
- 插件视图头部的旧返回按钮移除，功能合并到搜索栏

## Task List

### Task 1: 输入框有文字时阻止失焦关闭

**Description:** 修改 blur 事件处理逻辑，当搜索输入框有非空文字时不触发窗口隐藏。

**Acceptance criteria:**
- [ ] 搜索输入框有文字时，点击窗口外部不会关闭窗口
- [ ] 搜索输入框为空时，点击窗口外部正常关闭窗口
- [ ] 设置模态框打开时仍然阻止失焦关闭（现有行为不变）

**Verification:**
- [ ] 启动 `npm run tauri dev`
- [ ] 输入文字 → 点击桌面 → 窗口不关闭
- [ ] 清空输入框 → 点击桌面 → 窗口关闭

**Dependencies:** None

**Files likely touched:**
- `src-ui/main.js` (blur 事件处理，约第 377 行)

**Estimated scope:** XS (1 文件，1 行逻辑改动)

---

### Task 2: 搜索栏添加预留返回箭头按钮

**Description:** 在搜索栏左侧添加返回箭头按钮，始终占据固定宽度位置，默认隐藏箭头图标。移除插件视图头部的旧返回按钮。

**Acceptance criteria:**
- [ ] 搜索栏左侧有 28px 宽的预留位置，搜索视图时为空白
- [ ] 进入插件视图时，预留位置显示返回箭头图标
- [ ] 退出插件视图时，箭头图标消失，预留位置保持
- [ ] 搜索输入框位置不因箭头出现/消失而跳动
- [ ] 插件视图头部不再有旧返回按钮

**Verification:**
- [ ] 启动 `npm run tauri dev`
- [ ] 搜索视图：左侧有空白占位，输入框位置居中
- [ ] 进入插件视图：左侧出现箭头，输入框位置不变
- [ ] 点击箭头：退出插件视图，箭头消失

**Dependencies:** None

**Files likely touched:**
- `src-ui/index.html` (搜索栏结构、插件视图头部)
- `src-ui/styles.css` (返回按钮样式)
- `src-ui/main.js` (DOM 引用、openPluginRenderer/closePluginRenderer 逻辑)

**Estimated scope:** S (3 文件)

---

### Task 3: 返回箭头点击事件绑定

**Description:** 将搜索栏返回箭头的点击事件绑定到 closePluginRenderer，替换旧的 pluginBackBtn 事件。

**Acceptance criteria:**
- [ ] 点击搜索栏返回箭头退出插件视图回到搜索视图
- [ ] ESC 键仍然可以从插件视图返回
- [ ] 退出后搜索输入框获得焦点

**Verification:**
- [ ] 进入插件视图 → 点击返回箭头 → 回到搜索视图
- [ ] 进入插件视图 → 按 ESC → 回到搜索视图

**Dependencies:** Task 2

**Files likely touched:**
- `src-ui/main.js` (事件绑定、移除旧 pluginBackBtn 引用)

**Estimated scope:** XS (1 文件)

---

### Checkpoint: 全部完成
- [ ] 所有 8 条 Success Criteria 满足
- [ ] 无控制台错误
- [ ] 窗口显示/隐藏行为正常

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| visibility: hidden 的按钮仍可接收点击 | Low | 添加 `pointer-events: none`，显示时恢复 |
| 输入框有文字时用户可能想手动关闭窗口 | Low | 用户可清空输入框后点击外部，或使用快捷键 |

## Open Questions
- None
