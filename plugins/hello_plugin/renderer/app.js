(function () {
  'use strict';
  var msgEl = document.getElementById('hello-msg');
  var nameEl = document.getElementById('hello-name');
  var btnEl = document.getElementById('hello-btn');
  var versionEl = document.getElementById('hello-version');

  function setMsg(text, isError) {
    msgEl.textContent = text;
    msgEl.classList.toggle('error', !!isError);
  }

  function setLoading(loading) {
    btnEl.disabled = loading;
    btnEl.textContent = loading ? '...' : 'Greet';
  }

  async function greet() {
    var name = nameEl.value || 'World';
    setLoading(true);
    try {
      var result = await window.RS.invoke('greet', { name: name });
      var data = typeof result === 'string' ? JSON.parse(result) : result;
      if (data && data.error) {
        setMsg('Error: ' + data.error, true);
      } else {
        setMsg((data && data.message) || 'No response', false);
      }
    } catch (e) {
      setMsg('Error: ' + (e && e.message || e), true);
    } finally {
      setLoading(false);
    }
  }

  btnEl.addEventListener('click', greet);
  nameEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      greet();
    }
  });

  window.RS.on('theme-change', function () {
    /* SDK applies vars to :root automatically */
  });

  window.RS.on('query-change', function (q) {
    if (typeof q === 'string') nameEl.value = q;
  });

  if (window.RS && window.RS.context) {
    var initialQuery = window.RS.context.query;
    if (initialQuery) {
      nameEl.value = initialQuery;
    }
    if (window.RS.version) {
      versionEl.textContent = 'rs-sdk ' + window.RS.version;
    }
  }
})();
