# Spec: 搜索栏交互增强

## Objective

两个交互改进：

1. **输入框有文字时阻止失焦关闭**：当搜索输入框中有非空文字时，点击窗口外部（桌面、其他应用）不会关闭/隐藏启动器窗口。只有输入框为空时才允许失焦关闭。
2. **插件视图返回箭头**：搜索栏左侧始终预留返回箭头的位置（固定宽度占位），无二级菜单时为空白，进入插件视图时显示箭头图标。点击箭头退出插件视图返回搜索视图。当前返回按钮在插件视图头部，需要将其移动到搜索栏区域。

用户场景：
- 用户输入了搜索词后，误点窗口外不想丢失输入内容
- 用户进入插件视图后，需要直观的返回方式

## Tech Stack

- Tauri (Rust backend + web frontend)
- Vanilla JS (no framework)
- CSS with CSS variables

## Commands

```bash
Dev: npm run tauri dev
Build: npm run tauri build
```

## Project Structure

```
src-ui/
  main.js     → 前端主逻辑（需要修改）
  index.html  → HTML 结构（需要修改）
  styles.css  → 样式（需要修改）
```

## Code Style

现有风格：vanilla JS，DOM 操作，CSS variables，事件委托。

```javascript
// 状态管理
let currentView = 'search'; // 'search' | 'plugin'

// 事件处理
window.addEventListener('blur', () => {
  if (someCondition) return;
  blurTimer = setTimeout(() => { hideWindow(); }, 150);
});
```

## Testing Strategy

手动测试：
1. 输入文字 → 点击窗口外 → 窗口不关闭
2. 输入框为空 → 点击窗口外 → 窗口关闭
3. 输入文字 → 清空 → 点击窗口外 → 窗口关闭
4. 进入插件视图 → 搜索栏左侧出现返回箭头
5. 点击返回箭头 → 退出插件视图，回到搜索
6. ESC 键仍然可以从插件视图返回

## Boundaries

- **Always**: 修改前理解现有代码逻辑
- **Ask first**: 修改 Rust 后端代码
- **Never**: 改变窗口基础配置（大小、alwaysOnTop 等）

## Success Criteria

1. 搜索输入框有文字时，点击窗口外部空白区域不会触发窗口隐藏
2. 搜索输入框为空时，点击窗口外部空白区域仍然正常隐藏窗口
3. 搜索栏左侧始终预留返回箭头位置（固定宽度），无二级菜单时为空白不显示箭头
4. 进入插件视图时，预留位置显示返回箭头图标
5. 点击返回箭头可以退出插件视图回到搜索视图
6. ESC 键行为不受影响
7. 插件视图头部的旧返回按钮移除（功能合并到搜索栏）
8. 搜索输入框位置不因箭头出现/消失而跳动

## Implementation Notes

### 失焦关闭逻辑

当前逻辑（`main.js:377-382`）：
```javascript
window.addEventListener('blur', () => {
  if (isSettingsOpen) return;
  blurTimer = setTimeout(() => { hideWindow(); }, 150);
});
```

修改为：
```javascript
window.addEventListener('blur', () => {
  if (isSettingsOpen) return;
  if (searchInput.value.trim() !== '') return; // 有文字时不关闭
  blurTimer = setTimeout(() => { hideWindow(); }, 150);
});
```

关键考虑：用户输入文字后如果清空输入框，应该恢复失焦关闭行为。这个逻辑自然满足，因为每次 blur 时都检查当前输入值。

### 返回箭头位置

当前 HTML 结构：
- 搜索栏：`<input>` + `<button id="settings-btn">`
- 插件视图头部：`<button id="plugin-back-btn">` + `<span id="plugin-view-title">`

修改后：
- 搜索栏：`<button id="back-btn">` + `<input>` + `<button id="settings-btn">`
- 插件视图头部：移除返回按钮，保留标题
- 返回按钮始终存在于 DOM 中，占据固定宽度（28px），默认 `visibility: hidden`（保留占位空间），进入插件视图时 `visibility: visible` 显示箭头
- 使用 `visibility` 而非 `display: none`，确保布局不跳动
- 进入插件视图时显示 back-btn，退出时隐藏

需要修改 `openPluginRenderer()` 和 `closePluginRenderer()` 来控制返回按钮的可见性。
