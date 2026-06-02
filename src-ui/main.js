// RS Launcher — Main Frontend Logic
// Uses window.__TAURI__ (injected by withGlobalTauri: true)

const { invoke, convertFileSrc } = window.__TAURI__.core;
const { getCurrentWindow, LogicalSize } = window.__TAURI__.window;
const appWindow = getCurrentWindow();

// Global error handler
window.addEventListener('error', (e) => {
  console.error('[GLOBAL ERROR]', e.message, e.filename, e.lineno);
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('[UNHANDLED REJECTION]', e.reason);
});

// ============================================================
// State
// ============================================================
let selectedIndex = -1;
let results = [];
let isSettingsOpen = false;
let isRecordingHotkey = false;
let lastSearchId = 0;
let debounceTimer = null;
let activeRenderer = null; // null = default search render, { pluginId, name } = plugin render

// ============================================================
// Item Templates
// ============================================================
const TEMPLATES = {
  default: (r, iconEl) => `
    ${iconEl}
    <div class="result-text">
      <div class="result-title">${escapeHtml(r.title)}</div>
      <div class="result-subtitle" title="${escapeHtml(r.subtitle)}">${escapeHtml(r.subtitle)}</div>
    </div>
  `,
  compact: (r) => `
    <div style="display:flex;align-items:center;gap:10px;width:100%">
      <span style="font-size:24px">${escapeHtml(r.icon_path || '📄')}</span>
      <div>
        <div style="font-weight:500">${escapeHtml(r.title)}</div>
        <div style="font-size:12px;color:#999">${escapeHtml(r.subtitle)}</div>
      </div>
    </div>
  `,
};

// ============================================================
// DOM Elements
// ============================================================
const searchInput = document.getElementById('search-input');
const resultsArea = document.getElementById('results-area');
const resultsList = document.getElementById('results-list');
const hintBar = document.getElementById('hint-bar');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const modalClose = document.getElementById('modal-close');
const hotkeyRecorder = document.getElementById('hotkey-recorder');
const hotkeyDisplay = document.getElementById('hotkey-display');
const hotkeyHint = document.getElementById('hotkey-hint');
const backBtn = document.getElementById('back-btn');

// ============================================================
// Window Size Management
// ============================================================
const WINDOW_WIDTH = 640;
const WINDOW_HEIGHT_COLLAPSED = 80;
const WINDOW_HEIGHT_EXPANDED = 420;
const WINDOW_HEIGHT_PLUGIN = 500;

async function setWindowSize(hasResults) {
  const height = hasResults ? WINDOW_HEIGHT_EXPANDED : WINDOW_HEIGHT_COLLAPSED;
  try {
    await appWindow.setSize(new LogicalSize(WINDOW_WIDTH, height));
  } catch (e) {
    console.error('Failed to set window size:', e);
  }
}

async function setPluginWindowSize() {
  try {
    await appWindow.setSize(new LogicalSize(WINDOW_WIDTH, WINDOW_HEIGHT_PLUGIN));
  } catch (e) {
    console.error('Failed to set window size:', e);
  }
}

// ============================================================
// Search — always routes to the active render
// ============================================================
searchInput.addEventListener('input', () => {
  const query = searchInput.value;
  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    // If a plugin render is active, pass query to its onSearchInput
    if (activeRenderer) {
      if (typeof window.onSearchInput === 'function') {
        window.onSearchInput(query);
      }
      return;
    }

    // Default render: invoke search and render results
    const searchId = ++lastSearchId;
    invoke('search', { query }).then(res => {
      if (searchId !== lastSearchId) return;
      results = res;
      selectedIndex = results.length > 0 ? 0 : -1;
      renderResults();
      setWindowSize(results.length > 0);
    }).catch(e => {
      console.error('Search error:', e);
    });
  }, 80);
});

// ============================================================
// Render Results (default render)
// ============================================================
function renderResults() {
  if (results.length === 0 && searchInput.value.trim() !== '') {
    resultsArea.classList.remove('hidden');
    hintBar.classList.add('hidden');
    resultsList.innerHTML = '<div class="no-results">No results found</div>';
    return;
  }

  if (results.length === 0) {
    resultsArea.classList.add('hidden');
    hintBar.classList.remove('hidden');
    resultsList.innerHTML = '';
    return;
  }

  resultsArea.classList.remove('hidden');
  hintBar.classList.add('hidden');

  resultsList.innerHTML = results.map((r, i) => {
    const selected = i === selectedIndex ? ' selected' : '';
    const delay = Math.min(i * 25, 200);

    const iconEl = r.icon_path
      ? (r.icon_path.startsWith('data:')
        ? `<img class="result-icon" src="${r.icon_path}">`
        : (r.icon_path.match(/^[\x00-\x7F]$/) || r.icon_path.length <= 2 || /[\u{1F000}-\u{1FFFF}]/u.test(r.icon_path)
          ? `<span class="result-icon-emoji">${escapeHtml(r.icon_path)}</span>`
          : `<img class="result-icon" src="${convertIconPath(r.icon_path)}">`))
      : '<div class="result-icon-placeholder">📄</div>';

    const templateName = r.template || 'default';
    const templateFn = TEMPLATES[templateName] || TEMPLATES.default;

    return `
      <div class="result-item${selected}" data-index="${i}" data-plugin-id="${r.plugin_id}" style="animation-delay: ${delay}ms">
        ${templateFn(r, iconEl)}
      </div>
    `;
  }).join('');

  scrollToSelected();
}

function convertIconPath(path) {
  if (!path) return '';
  try {
    if (typeof convertFileSrc === 'function') {
      return convertFileSrc(path);
    }
    return '';
  } catch (e) {
    return '';
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function scrollToSelected() {
  if (selectedIndex < 0) return;
  const item = resultsList.querySelector(`[data-index="${selectedIndex}"]`);
  if (item) item.scrollIntoView({ block: 'nearest' });
}

// Handle icon load failures via event delegation (CSP blocks inline onerror)
resultsList.addEventListener('error', (e) => {
  if (e.target.tagName === 'IMG' && e.target.classList.contains('result-icon')) {
    e.target.replaceWith(Object.assign(document.createElement('div'), {
      className: 'result-icon-placeholder',
      textContent: '📄',
    }));
  }
}, true);

// ============================================================
// Keyboard Navigation
// ============================================================
document.addEventListener('keydown', (e) => {
  // Plugin render: Esc goes back to default render
  if (activeRenderer && e.key === 'Escape') {
    e.preventDefault();
    deactivateRenderer();
    return;
  }

  // Plugin render: route navigation keys to renderer
  if (activeRenderer && typeof window.onPluginKeyDown === 'function') {
    window.onPluginKeyDown(e);
    if (e.defaultPrevented) return;
  }
  // If renderer is active but onPluginKeyDown not ready, skip default handling
  if (activeRenderer) return;

  if (isSettingsOpen) {
    if (isRecordingHotkey) {
      handleHotkeyRecord(e);
      return;
    }
    if (e.key === 'Escape') {
      closeSettings();
      e.preventDefault();
    }
    return;
  }

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      if (results.length > 0) {
        selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
        updateSelection();
      }
      break;

    case 'ArrowUp':
      e.preventDefault();
      if (results.length > 0) {
        selectedIndex = Math.max(selectedIndex - 1, 0);
        updateSelection();
      }
      break;

    case 'Enter':
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        executeResult(selectedIndex);
      }
      break;

    case 'Escape':
      e.preventDefault();
      hideWindow();
      break;
  }
});

function updateSelection() {
  const items = resultsList.querySelectorAll('.result-item');
  items.forEach((item, i) => {
    item.classList.toggle('selected', i === selectedIndex);
  });
  scrollToSelected();
}

// ============================================================
// Result Click
// ============================================================
resultsList.addEventListener('click', (e) => {
  const item = e.target.closest('.result-item');
  if (!item) return;
  const index = parseInt(item.dataset.index);
  if (!isNaN(index)) executeResult(index);
});

// ============================================================
// Execute Result — action dispatch
// ============================================================
async function executeResult(index) {
  const result = results[index];
  if (!result) return;

  if (result.action === 'open_renderer') {
    activateRenderer(result.plugin_id);
    return;
  }

  // Default: execute action (open app, etc.)
  try {
    await invoke('execute_result', { subtitle: result.subtitle });
  } catch (e) {
    console.error('Execute error:', e);
  }

  hideWindow();
}

// ============================================================
// Renderer Activation / Deactivation
// ============================================================

// Activate a plugin renderer: inject its HTML into resultsArea,
// the renderer defines window.onSearchInput to receive search box input
async function activateRenderer(pluginId) {
  // Set activeRenderer immediately to block default search during async loading
  activeRenderer = { pluginId, name: '' };

  try {
    const renderer = await invoke('get_plugin_renderer', { pluginId });
    if (!renderer) {
      console.error('No renderer found for plugin:', pluginId);
      activeRenderer = null;
      return;
    }

    activeRenderer.name = renderer.name;

    // Inject CSS
    let styleEl = document.getElementById('plugin-renderer-style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'plugin-renderer-style';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = renderer.css || '';

    // Inject renderer HTML into resultsList (same container as search results)
    resultsList.innerHTML = renderer.html || '';

    // Execute renderer JS (via eval to bypass CSP inline script restriction)
    if (renderer.js) {
      try {
        (0, eval)(renderer.js);
      } catch (e) {
        console.error('[Renderer] JS eval failed:', e);
      }
    }

    // Show results area, hide hint
    resultsArea.classList.remove('hidden');
    hintBar.classList.add('hidden');
    backBtn.classList.add('visible');
    await setPluginWindowSize();

    // Clear search input so user starts fresh
    searchInput.value = '';
    searchInput.focus();
  } catch (e) {
    console.error('[Renderer] activateRenderer failed:', e);
  }
}

// Deactivate renderer: restore default search render
function deactivateRenderer() {
  if (!activeRenderer) return;

  activeRenderer = null;

  // Clean up renderer global functions
  delete window.onSearchInput;
  delete window.onPluginKeyDown;

  // Clear renderer content
  resultsList.innerHTML = '';
  const styleEl = document.getElementById('plugin-renderer-style');
  if (styleEl) styleEl.textContent = '';

  // Restore default search view
  backBtn.classList.remove('visible');
  searchInput.value = '';
  searchInput.focus();

  // Re-trigger search with empty query to show default items
  invoke('search', { query: '' }).then(res => {
    results = res;
    selectedIndex = results.length > 0 ? 0 : -1;
    renderResults();
    setWindowSize(results.length > 0);
  }).catch(e => {
    console.error('Search error:', e);
    resultsArea.classList.add('hidden');
    hintBar.classList.remove('hidden');
  });
}

backBtn.addEventListener('click', deactivateRenderer);

// ============================================================
// Window Visibility
// ============================================================
async function hideWindow() {
  searchInput.value = '';
  results = [];
  selectedIndex = -1;

  // If renderer is active, deactivate it
  if (activeRenderer) {
    delete window.onSearchInput;
    delete window.onPluginKeyDown;
    activeRenderer = null;
    backBtn.classList.remove('visible');
    const styleEl = document.getElementById('plugin-renderer-style');
    if (styleEl) styleEl.textContent = '';
  }

  renderResults();
  await setWindowSize(false);
  try {
    await appWindow.hide();
  } catch (e) {
    console.error('Hide error:', e);
  }
}

// Focus input when window becomes visible
appWindow.onFocusChanged(({ payload: focused }) => {
  if (focused) {
    searchInput.focus();
  }
});

// Auto-hide when window loses focus (slight delay to avoid flicker during hotkey press)
let blurTimer = null;
window.addEventListener('blur', () => {
  if (isSettingsOpen) return;
  if (searchInput.value.trim() !== '') return;
  blurTimer = setTimeout(() => {
    hideWindow();
  }, 150);
});

window.addEventListener('focus', () => {
  if (blurTimer) {
    clearTimeout(blurTimer);
    blurTimer = null;
  }
  searchInput.focus();
});

// ============================================================
// Settings
// ============================================================
settingsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  openSettings();
});

modalClose.addEventListener('click', closeSettings);

function openSettings() {
  isSettingsOpen = true;
  settingsModal.classList.remove('hidden');
}

function closeSettings() {
  isSettingsOpen = false;
  isRecordingHotkey = false;
  hotkeyRecorder.classList.remove('recording');
  settingsModal.classList.add('hidden');
  searchInput.focus();
}

// ============================================================
// Hotkey Recording
// ============================================================
hotkeyRecorder.addEventListener('click', () => {
  isRecordingHotkey = !isRecordingHotkey;
  hotkeyRecorder.classList.toggle('recording', isRecordingHotkey);
  if (isRecordingHotkey) {
    hotkeyDisplay.textContent = 'Press a key combination...';
  }
});

function handleHotkeyRecord(e) {
  e.preventDefault();
  e.stopPropagation();

  // Ignore standalone modifier presses
  if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;

  const parts = [];
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  if (e.metaKey) parts.push('Super');

  // Need at least one modifier
  if (parts.length === 0) return;

  // Map key name
  let keyName = e.key;
  if (keyName === ' ') keyName = 'Space';
  else if (keyName.length === 1) keyName = keyName.toUpperCase();

  parts.push(keyName);
  const shortcutStr = parts.join('+');

  hotkeyDisplay.textContent = shortcutStr;
  hotkeyHint.textContent = shortcutStr;
  isRecordingHotkey = false;
  hotkeyRecorder.classList.remove('recording');

  // Save to backend
  invoke('save_hotkey', { shortcutStr })
    .catch(err => {
      console.error('Failed to save hotkey:', err);
      hotkeyDisplay.textContent = 'Error: ' + err;
    });
}

// ============================================================
// Initialization
// ============================================================
async function init() {
  try {
    const config = await invoke('get_config');
    hotkeyDisplay.textContent = config.hotkey_display;
    hotkeyHint.textContent = config.hotkey_display;
  } catch (e) {
    console.error('Failed to load config:', e);
  }

  // Load default items (empty input search)
  try {
    results = await invoke('search', { query: '' });
    selectedIndex = results.length > 0 ? 0 : -1;
    renderResults();
    if (results.length > 0) {
      await setWindowSize(true);
    }
  } catch (e) {
    console.error('Failed to load default items:', e);
  }

  searchInput.focus();
}

// Run init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}