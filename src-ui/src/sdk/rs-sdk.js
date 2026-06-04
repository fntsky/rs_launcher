(function () {
  'use strict';
  if (window.__RS_SDK_LOADED__) return;
  window.__RS_SDK_LOADED__ = true;

  var PROTOCOL_VERSION = 'iframe-renderer/1';
  var READY_TIMEOUT_MS = 5000;
  var INVOKE_TIMEOUT_MS = 8000;

  var state = {
    ready: false,
    version: PROTOCOL_VERSION,
    context: null,
    theme: null,
    query: '',
    listeners: Object.create(null),
    invokeQueue: [],
    pendingInvokes: Object.create(null),
    invokeCounter: 0,
    initReceived: false,
  };

  function on(event, handler) {
    if (typeof handler !== 'function') return function () {};
    (state.listeners[event] || (state.listeners[event] = [])).push(handler);
    return function () { off(event, handler); };
  }

  function off(event, handler) {
    var arr = state.listeners[event];
    if (!arr) return;
    var i = arr.indexOf(handler);
    if (i >= 0) arr.splice(i, 1);
  }

  function emit(event, payload) {
    var arr = state.listeners[event];
    if (!arr) return;
    for (var i = 0; i < arr.length; i++) {
      try { arr[i](payload); } catch (e) { console.error('[RS] listener error', event, e); }
    }
  }

  function send(type, payload) {
    try {
      window.parent.postMessage(Object.assign({ type: type, protocol: PROTOCOL_VERSION }, payload), '*');
    } catch (e) {
      console.error('[RS] postMessage failed', e);
    }
  }

  function log(level) {
    var args = Array.prototype.slice.call(arguments, 1);
    var levelStr = ['info', 'warn', 'error'].indexOf(level) >= 0 ? level : 'info';
    try {
      var parts = args.map(function (a) {
        if (a instanceof Error) return a.stack || a.message;
        if (typeof a === 'object') {
          try { return JSON.stringify(a); } catch (_) { return String(a); }
        }
        return String(a);
      });
      console[levelStr]('[plugin:' + (state.context && state.context.pluginId || '?') + ']', ...args);
      send('rs:log', { level: levelStr, args: parts });
    } catch (_) { /* ignore */ }
  }

  function applyTheme(theme) {
    if (!theme || typeof theme !== 'object') return;
    state.theme = theme;
    var root = document.documentElement;
    if (theme.mode) root.dataset.rsTheme = theme.mode;
    if (theme.vars && typeof theme.vars === 'object') {
      for (var k in theme.vars) {
        if (Object.prototype.hasOwnProperty.call(theme.vars, k)) {
          root.style.setProperty(k, theme.vars[k]);
        }
      }
    }
    try { root.dispatchEvent(new CustomEvent('rs-theme-change', { detail: theme })); } catch (_) {}
  }

  function reportSize() {
    if (!state.ready) return;
    var de = document.documentElement;
    var w = de ? de.scrollWidth : 0;
    var h = de ? de.scrollHeight : 0;
    if (w <= 0 || h <= 0) return;
    send('rs:resize', { width: Math.ceil(w), height: Math.ceil(h) });
  }

  function startResizeObserver() {
    if (typeof ResizeObserver === 'undefined') {
      reportSize();
      return;
    }
    var scheduled = false;
    var ro = new ResizeObserver(function () {
      if (scheduled) return;
      scheduled = true;
      (window.requestAnimationFrame || function (cb) { setTimeout(cb, 16); })(function () {
        scheduled = false;
        reportSize();
      });
    });
    ro.observe(document.documentElement);
    try { ro.observe(document.body); } catch (_) { /* documentElement covers it */ }
    reportSize();
  }

  function genId() {
    state.invokeCounter += 1;
    return 'rs_inv_' + Date.now().toString(36) + '_' + state.invokeCounter;
  }

  function invoke(command, args) {
    return new Promise(function (resolve, reject) {
      var id = genId();
      var done = false;
      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        delete state.pendingInvokes[id];
        reject(new Error('invoke timeout: ' + command));
      }, INVOKE_TIMEOUT_MS);
      state.pendingInvokes[id] = {
        resolve: function (v) { if (done) return; done = true; clearTimeout(timer); resolve(v); },
        reject: function (e) { if (done) return; done = true; clearTimeout(timer); reject(e); },
        command: command,
        args: args,
      };
      if (!state.initReceived) {
        state.invokeQueue.push(id);
      } else {
        send('rs:invoke:req', { id: id, command: command, args: args || {} });
      }
    });
  }

  function flushInvokeQueue() {
    var ids = state.invokeQueue;
    state.invokeQueue = [];
    for (var i = 0; i < ids.length; i++) {
      var p = state.pendingInvokes[ids[i]];
      if (!p) continue;
      send('rs:invoke:req', { id: ids[i], command: p.command, args: p.args || {} });
    }
  }

  function handleMessage(ev) {
    var data = ev && ev.data;
    if (!data || typeof data !== 'object' || !data.type || data.protocol !== PROTOCOL_VERSION) return;
    var type = data.type;

    if (type === 'rs:init') {
      state.initReceived = true;
      state.context = data.context || null;
      if (state.context) {
        state.query = state.context.query || '';
        applyTheme(state.context.theme);
      }
      send('rs:ready', { pluginId: state.context && state.context.pluginId });
      state.ready = true;
      flushInvokeQueue();
      emit('context-change', state.context);
      startResizeObserver();
      return;
    }

    if (type === 'rs:invoke:res') {
      var p = state.pendingInvokes[data.id];
      if (!p) return;
      delete state.pendingInvokes[data.id];
      if (data.ok) p.resolve(data.value);
      else p.reject(new Error(data.error || 'invoke error'));
      return;
    }

    if (type === 'rs:theme-change') {
      applyTheme(data.theme);
      emit('theme-change', data.theme);
      return;
    }

    if (type === 'rs:query-change') {
      state.query = data.query || '';
      emit('query-change', state.query);
      return;
    }

    if (type === 'rs:context-change') {
      if (state.context && data.patch) {
        for (var k in data.patch) {
          if (Object.prototype.hasOwnProperty.call(data.patch, k)) {
            state.context[k] = data.patch[k];
          }
        }
      }
      emit('context-change', state.context);
      return;
    }

    if (type === 'rs:keydown') {
      var k = data.payload || {};
      var evt;
      try {
        evt = new KeyboardEvent(k.type || 'keydown', {
          key: k.key, code: k.code, keyCode: k.keyCode, which: k.which,
          altKey: !!k.alt, ctrlKey: !!k.ctrl, shiftKey: !!k.shift, metaKey: !!k.meta,
          repeat: !!k.repeat, bubbles: true, cancelable: true,
        });
      } catch (_) {
        evt = new Event(k.type || 'keydown', { bubbles: true, cancelable: true });
      }
      try { Object.defineProperty(evt, 'isTrusted', { value: false }); } catch (_) {}
      (k.target || document).dispatchEvent(evt);
      emit('keydown', k);
      return;
    }

    if (type === 'rs:back') {
      emit('back', null);
      return;
    }
  }

  function openFile(path) {
    return new Promise(function (resolve, reject) {
      send('rs:open-file', { path: path });
      resolve();
    });
  }

  function hideWindow() {
    return new Promise(function (resolve) {
      send('rs:hide-window', {});
      resolve();
    });
  }

  function notifyBack() {
    send('rs:back', {});
  }

  function setWindowSize(width, height) {
    send('rs:set-size', { width: width, height: height });
  }

  function getReady() {
    return new Promise(function (resolve, reject) {
      if (state.ready) return resolve();
      var t = setTimeout(function () { reject(new Error('rs:ready timeout')); }, READY_TIMEOUT_MS);
      on('context-change', function () { clearTimeout(t); resolve(); });
    });
  }

  var RS = {
    version: PROTOCOL_VERSION,
    get context() { return state.context; },
    get theme() { return state.theme; },
    get query() { return state.query; },
    invoke: invoke,
    openFile: openFile,
    hideWindow: hideWindow,
    notifyBack: notifyBack,
    setWindowSize: setWindowSize,
    on: on,
    off: off,
    log: log,
    ready: getReady,
    applyTheme: applyTheme,
  };

  window.addEventListener('message', handleMessage);
  window.__RS__ = RS;
  Object.defineProperty(window, 'RS', { value: RS, writable: false, configurable: false });

  try { send('rs:handshake', { protocol: PROTOCOL_VERSION }); } catch (_) {}
})();
