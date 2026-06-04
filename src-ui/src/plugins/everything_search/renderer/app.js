(function() {
const { invoke } = window.__TAURI__.core;
let evDebounceTimer = null;
let evSelectedIndex = -1;
let evResults = [];

// Text file extensions for preview
const TEXT_EXTENSIONS = new Set([
  'txt', 'md', 'json', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'less',
  'py', 'rs', 'go', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'php', 'rb', 'swift',
  'kt', 'scala', 'sh', 'bash', 'zsh', 'fish', 'ps1', 'bat', 'cmd',
  'xml', 'yaml', 'yml', 'toml', 'ini', 'conf', 'cfg', 'log',
  'sql', 'graphql', 'vue', 'svelte', 'dart', 'lua', 'r', 'pl', 'pm',
  'dockerfile', 'gitignore', 'env', 'properties'
]);

// Image file extensions for preview
const IMAGE_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif'
]);

function isImageFile(filename) {
  return IMAGE_EXTENSIONS.has(getFileExt(filename));
}

// Keywords for syntax highlighting
const KEYWORDS = new Set([
  'import', 'from', 'export', 'default', 'const', 'let', 'var', 'function', 'class',
  'extends', 'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'break',
  'continue', 'try', 'catch', 'throw', 'new', 'this', 'super', 'async', 'await',
  'static', 'public', 'private', 'protected', 'void', 'int', 'float', 'double',
  'bool', 'string', 'true', 'false', 'null', 'undefined', 'typeof', 'instanceof',
  'def', 'in', 'as', 'with', 'yield', 'lambda', 'pass', 'del', 'raise', 'except',
  'finally', 'global', 'nonlocal', 'assert', 'elif', 'match', 'struct', 'enum',
  'trait', 'impl', 'fn', 'pub', 'use', 'mod', 'crate', 'self', 'mut', 'ref',
  'where', 'loop', 'move', 'box', 'unsafe', 'extern'
]);

function getFileExt(filename) {
  const idx = filename.lastIndexOf('.');
  return idx > 0 ? filename.slice(idx + 1).toLowerCase() : '';
}

function isTextFile(filename) {
  return TEXT_EXTENSIONS.has(getFileExt(filename));
}

function highlightCode(text) {
  const lines = text.split('\n');
  return lines.map(line => {
    let html = escHtml(line);

    // Highlight strings (simple approach)
    html = html.replace(/("(?:[^"\\]|\\.)*")/g, '<span class="hl-string">$1</span>');
    html = html.replace(/('(?:[^'\\]|\\.)*')/g, '<span class="hl-string">$1</span>');

    // Highlight comments
    html = html.replace(/(\/\/.*$)/gm, '<span class="hl-comment">$1</span>');
    html = html.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hl-comment">$1</span>');

    // Highlight numbers
    html = html.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="hl-number">$1</span>');

    // Highlight keywords
    html = html.split(/\b/).map(token => {
      if (KEYWORDS.has(token.toLowerCase())) {
        return '<span class="hl-keyword">' + token + '</span>';
      }
      return token;
    }).join('');

    return html;
  }).join('\n');
}

async function loadFilePreview(path) {
  const previewEl = document.getElementById('ev-preview');

  if (isImageFile(path)) {
    try {
      const args = JSON.stringify({ path: path });
      const raw = await invoke('plugin_invoke', {
        pluginId: 'everything_search',
        command: 'read_image',
        args: args
      });

      const data = JSON.parse(raw);
      if (data.error) {
        previewEl.classList.add('hidden');
        previewEl.textContent = '';
        return;
      }

      previewEl.classList.remove('hidden');
      previewEl.classList.remove('ev-preview-text');
      previewEl.classList.add('ev-preview-image');
      previewEl.innerHTML = '<div class="ev-image-wrap"><img class="ev-image-img" src="' + data.url + '" alt="preview" /></div>';
    } catch (e) {
      previewEl.classList.add('hidden');
      previewEl.textContent = '';
    }
    return;
  }

  if (!isTextFile(path)) {
    previewEl.classList.add('hidden');
    previewEl.textContent = '';
    return;
  }

  try {
    const args = JSON.stringify({ path: path });
    const raw = await invoke('plugin_invoke', {
      pluginId: 'everything_search',
      command: 'read_file',
      args: args
    });

    const data = JSON.parse(raw);
    if (data.error) {
      previewEl.classList.add('hidden');
      previewEl.textContent = '';
      return;
    }

    previewEl.classList.remove('hidden');
    previewEl.classList.remove('ev-preview-image');
    previewEl.classList.add('ev-preview-text');
    previewEl.innerHTML = highlightCode(data.content);
  } catch (e) {
    previewEl.classList.add('hidden');
    previewEl.textContent = '';
  }
}

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
  const pathBar = document.getElementById('ev-path-bar');

  if (evResults.length === 0) {
    container.innerHTML = '<div class="ev-empty">输入关键词搜索文件和文件夹</div>';
    pathBar.classList.add('hidden');
    pathBar.textContent = '';
    renderFileInfo(null);
    return;
  }

  container.innerHTML = evResults.map((r, i) => {
    const selected = i === evSelectedIndex ? ' selected' : '';
    const iconEl = r.icon
      ? '<img class="ev-icon-img" src="' + r.icon + '">'
      : '<span class="ev-icon">' + (r.is_folder ? '📁' : '📄') + '</span>';

    return '<div class="ev-item' + selected + '" data-index="' + i + '">' +
      iconEl +
      '<div class="ev-info">' +
        '<div class="ev-title">' + escHtml(r.title) + '</div>' +
      '</div>' +
    '</div>';
  }).join('');

  container.querySelectorAll('.ev-item').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.index);
      evSelectedIndex = idx;
      updateEvSelection();
      openEvResult(idx);
    });
  });

  updateEvSelection();
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

  const pathBar = document.getElementById('ev-path-bar');
  if (evSelectedIndex >= 0 && evResults[evSelectedIndex]) {
    const r = evResults[evSelectedIndex];
    pathBar.textContent = r.subtitle || '';
    pathBar.title = r.subtitle || '';
    pathBar.classList.remove('hidden');
    renderFileInfo(r);
    loadFilePreview(r.subtitle);
  } else {
    pathBar.textContent = '';
    pathBar.title = '';
    pathBar.classList.add('hidden');
    renderFileInfo(null);
    const previewEl = document.getElementById('ev-preview');
    previewEl.classList.add('hidden');
    previewEl.textContent = '';
  }
}

function renderFileInfo(r) {
  const infoEl = document.getElementById('ev-file-info');
  if (!r) {
    infoEl.innerHTML = '';
    return;
  }

  let html = '';
  if (r.size) {
    html += '<div class="ev-info-label">大小</div>';
    html += '<div class="ev-info-value">' + escHtml(r.size) + '</div>';
  }
  if (r.is_folder !== undefined) {
    html += '<div class="ev-info-label">类型</div>';
    html += '<div class="ev-info-value">' + (r.is_folder ? '文件夹' : '文件') + '</div>';
  }
  infoEl.innerHTML = html;
}

renderEvResults();

})();
