(function() {
const { invoke } = window.__TAURI__.core;
let evDebounceTimer = null;
let evSelectedIndex = -1;
let evResults = [];

window.onSearchInput = function(query) {
  if (evDebounceTimer) clearTimeout(evDebounceTimer);

  if (!query || query.trim() === '') {
    evResults = [];
    evSelectedIndex = -1;
    renderEvResults();
    return;
  }

  evDebounceTimer = setTimeout(async () => {
    try {
      const args = JSON.stringify({ query: query });
      const raw = await invoke('plugin_invoke', {
        pluginId: 'everything_search',
        command: 'search',
        args: args
      });

      const data = JSON.parse(raw);

      if (data.error) {
        document.getElementById('ev-status').textContent = data.error;
        document.getElementById('ev-status').classList.remove('hidden');
        evResults = [];
      } else {
        document.getElementById('ev-status').classList.add('hidden');
        evResults = data.results || [];
      }

      evSelectedIndex = evResults.length > 0 ? 0 : -1;
      renderEvResults();
    } catch (e) {
      document.getElementById('ev-status').textContent = '搜索出错: ' + e;
      document.getElementById('ev-status').classList.remove('hidden');
      evResults = [];
      renderEvResults();
    }
  }, 80);
};

window.onPluginKeyDown = function(e) {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (evResults.length > 0) {
      evSelectedIndex = Math.min(evSelectedIndex + 1, evResults.length - 1);
      updateEvSelection();
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (evResults.length > 0) {
      evSelectedIndex = Math.max(evSelectedIndex - 1, 0);
      updateEvSelection();
    }
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (evSelectedIndex >= 0) openEvResult(evSelectedIndex);
  }
};

function renderEvResults() {
  const container = document.getElementById('ev-results');

  if (evResults.length === 0) {
    container.innerHTML = '<div class="ev-empty">输入关键词搜索文件和文件夹</div>';
    return;
  }

  container.innerHTML = evResults.map((r, i) => {
    const selected = i === evSelectedIndex ? ' selected' : '';
    const sizeText = r.size ? '<span class="ev-size">' + r.size + '</span>' : '';
    const folderBadge = r.is_folder ? '<span class="ev-folder-badge">文件夹</span>' : '';
    const iconEl = r.icon ? '<img class="ev-icon-img" src="' + r.icon + '">' : '<span class="ev-icon">📄</span>';

    return '<div class="ev-item' + selected + '" data-index="' + i + '" data-path="' + escHtml(r.subtitle) + '">' +
      iconEl +
      '<div class="ev-info">' +
        '<div class="ev-title">' + escHtml(r.title) + '</div>' +
        '<div class="ev-path" title="' + escHtml(r.subtitle) + '">' + escHtml(r.subtitle) + '</div>' +
      '</div>' +
      sizeText + folderBadge +
    '</div>';
  }).join('');

  container.querySelectorAll('.ev-item').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.index);
      openEvResult(idx);
    });
  });
}

function openEvResult(index) {
  const r = evResults[index];
  if (!r) return;
  invoke('execute_result', { subtitle: r.subtitle });
  const { getCurrentWindow } = window.__TAURI__.window;
  getCurrentWindow().hide();
}

function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function updateEvSelection() {
  document.querySelectorAll('.ev-item').forEach((el, i) => {
    el.classList.toggle('selected', i === evSelectedIndex);
  });
  const sel = document.querySelector('.ev-item.selected');
  if (sel) sel.scrollIntoView({ block: 'nearest' });
}

renderEvResults();

})();