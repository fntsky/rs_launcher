// RS Launcher — Main Frontend Logic
// Uses window.__TAURI__ (injected by withGlobalTauri: true)

const { invoke } = window.__TAURI__.core;
const { getCurrentWindow, LogicalSize } = window.__TAURI__.window;
const appWindow = getCurrentWindow();

// ============================================================
// State
// ============================================================
let selectedIndex = -1;
let results = [];
let isSettingsOpen = false;
let isRecordingHotkey = false;
let lastSearchId = 0;
let debounceTimer = null;

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

// ============================================================
// Window Size Management
// ============================================================
const WINDOW_WIDTH = 640;
const WINDOW_HEIGHT_COLLAPSED = 80;
const WINDOW_HEIGHT_EXPANDED = 420;

async function setWindowSize(hasResults) {
  const height = hasResults ? WINDOW_HEIGHT_EXPANDED : WINDOW_HEIGHT_COLLAPSED;
  try {
    await appWindow.setSize(new LogicalSize(WINDOW_WIDTH, height));
  } catch (e) {
    console.error('Failed to set window size:', e);
  }
}

// ============================================================
// Search
// ============================================================
searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim();
  if (debounceTimer) clearTimeout(debounceTimer);

  if (query === '') {
    results = [];
    selectedIndex = -1;
    renderResults();
    setWindowSize(false);
    return;
  }

  debounceTimer = setTimeout(async () => {
    const searchId = ++lastSearchId;
    try {
      const res = await invoke('search', { query });
      // Discard stale results
      if (searchId !== lastSearchId) return;
      results = res;
      selectedIndex = results.length > 0 ? 0 : -1;
      renderResults();
      setWindowSize(results.length > 0);
    } catch (e) {
      console.error('Search error:', e);
    }
  }, 80);
});

// ============================================================
// Render Results
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
      ? `<img class="result-icon" src="${convertIconPath(r.icon_path)}" onerror="this.outerHTML='<div class=\\'result-icon-placeholder\\'>📄</div>'">`
      : '<div class="result-icon-placeholder">📄</div>';

    return `
      <div class="result-item${selected}" data-index="${i}" style="animation-delay: ${delay}ms">
        ${iconEl}
        <div class="result-text">
          <div class="result-title">${escapeHtml(r.title)}</div>
          <div class="result-subtitle" title="${escapeHtml(r.subtitle)}">${escapeHtml(r.subtitle)}</div>
        </div>
      </div>
    `;
  }).join('');

  // Scroll selected item into view
  scrollToSelected();
}

function convertIconPath(path) {
  if (!path) return '';
  // Use Tauri asset protocol to serve local files
  try {
    return window.__TAURI__.core.convertFileSrc(path);
  } catch {
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

// ============================================================
// Keyboard Navigation
// ============================================================
document.addEventListener('keydown', (e) => {
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
// Execute Result
// ============================================================
async function executeResult(index) {
  const result = results[index];
  if (!result) return;

  try {
    await invoke('execute_result', { subtitle: result.subtitle });
  } catch (e) {
    console.error('Execute error:', e);
  }

  hideWindow();
}

// ============================================================
// Window Visibility
// ============================================================
async function hideWindow() {
  searchInput.value = '';
  results = [];
  selectedIndex = -1;
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

  searchInput.focus();
}

// Run init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
