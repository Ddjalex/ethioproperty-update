(function () {
  'use strict';
  if (window.__ADMIN_AI_PROMPT_PATCH__) return;
  window.__ADMIN_AI_PROMPT_PATCH__ = '2.0.0';

  function isAdminRoute() {
    return window.location.pathname.startsWith('/admin');
  }

  /* ── Styles ── */
  var style = document.createElement('style');
  style.textContent = `
    #aip-fab {
      position: fixed;
      bottom: 90px;
      left: 20px;
      z-index: 9000;
      background: #7c3aed;
      color: #fff;
      border: none;
      border-radius: 12px;
      padding: 10px 16px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(124,58,237,.4);
      display: none;
      align-items: center;
      gap: 7px;
      transition: background .15s, transform .1s;
      font-family: inherit;
    }
    #aip-fab:hover { background: #6d28d9; transform: translateY(-2px); }
    #aip-fab.visible { display: none; }

    #aip-overlay {
      display: none !important;
      position: fixed !important;
      inset: 0 !important;
      z-index: 9999 !important;
      background: rgba(0,0,0,.55) !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 16px !important;
    }
    #aip-overlay.aip-open { display: flex !important; }

    #aip-modal {
      background: #fff;
      border-radius: 16px;
      width: 100%;
      max-width: 660px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,.25);
      font-family: inherit;
    }
    #aip-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 22px 26px 0;
    }
    #aip-modal-header h2 {
      font-size: 1.15rem;
      font-weight: 800;
      color: #111;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .aip-badge {
      background: #ede9fe;
      color: #5b21b6;
      font-size: 0.68rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 999px;
    }
    #aip-close-btn {
      background: none;
      border: none;
      font-size: 22px;
      cursor: pointer;
      color: #6b7280;
      line-height: 1;
      padding: 4px;
      border-radius: 6px;
    }
    #aip-close-btn:hover { background: #f3f4f6; }
    #aip-modal-body { padding: 18px 26px 26px; }
    .aip-sub {
      font-size: 0.82rem;
      color: #6b7280;
      margin: 4px 0 18px;
    }
    .aip-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 14px;
    }
    .aip-tab {
      padding: 6px 20px;
      border-radius: 999px;
      border: 1.5px solid #e5e7eb;
      background: #f9fafb;
      color: #374151;
      font-size: 0.85rem;
      cursor: pointer;
      font-weight: 600;
      transition: all .15s;
    }
    .aip-tab.active {
      background: #7c3aed;
      border-color: #7c3aed;
      color: #fff;
    }
    #aip-textarea {
      width: 100%;
      min-height: 200px;
      border: 1.5px solid #d1d5db;
      border-radius: 10px;
      padding: 14px;
      font-size: 0.875rem;
      line-height: 1.65;
      resize: vertical;
      box-sizing: border-box;
      font-family: inherit;
      color: #111827;
      transition: border-color .15s;
    }
    #aip-textarea:focus {
      outline: none;
      border-color: #7c3aed;
    }
    .aip-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 14px;
      gap: 10px;
      flex-wrap: wrap;
    }
    .aip-hint {
      font-size: 0.76rem;
      color: #9ca3af;
      flex: 1;
    }
    .aip-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    #aip-status {
      font-size: 0.8rem;
      padding: 5px 12px;
      border-radius: 6px;
      display: none;
    }
    #aip-status.success { display: inline-block; background: #d1fae5; color: #065f46; }
    #aip-status.error   { display: inline-block; background: #fee2e2; color: #991b1b; }
    #aip-save-btn {
      background: #7c3aed;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 9px 24px;
      font-size: 0.875rem;
      font-weight: 700;
      cursor: pointer;
      transition: background .15s;
    }
    #aip-save-btn:hover:not(:disabled) { background: #6d28d9; }
    #aip-save-btn:disabled { opacity: .5; cursor: not-allowed; }
  `;
  document.head.appendChild(style);

  /* ── State ── */
  var currentLang = 'en';
  var prompts = { en: null, am: null };
  var greetings = { en: null, am: null };

  /* ── Build DOM ── */
  function buildUI() {
    if (document.getElementById('aip-fab')) return;

    /* Floating Action Button */
    var fab = document.createElement('button');
    fab.id = 'aip-fab';
    fab.innerHTML = '🤖 AI Prompt Settings';
    fab.addEventListener('click', openModal);
    document.body.appendChild(fab);

    /* Overlay + Modal */
    var overlay = document.createElement('div');
    overlay.id = 'aip-overlay';
    overlay.innerHTML = `
      <div id="aip-modal">
        <div id="aip-modal-header">
          <h2>🤖 AI Prompt Editor <span class="aip-badge">gemini-2.0-flash</span></h2>
          <button id="aip-close-btn" title="Close">✕</button>
        </div>
        <div id="aip-modal-body">
          <p class="aip-sub">Edit what the AI says to visitors. Property listings are automatically appended — just write your instructions.</p>
          <div class="aip-tabs">
            <button class="aip-tab active" data-lang="en">🇬🇧 English</button>
            <button class="aip-tab" data-lang="am">🇪🇹 Amharic</button>
          </div>
          <label for="aip-greeting" style="display:block;font-size:0.78rem;font-weight:700;color:#374151;margin:4px 0 6px;">Opening greeting (shown & spoken when the panel opens)</label>
          <textarea id="aip-greeting" placeholder="e.g. Welcome to Ethio Property! How can I help?" style="width:100%;min-height:64px;border:1.5px solid #d1d5db;border-radius:10px;padding:10px 12px;font-size:0.875rem;line-height:1.5;resize:vertical;box-sizing:border-box;font-family:inherit;color:#111827;margin-bottom:12px;"></textarea>
          <label for="aip-textarea" style="display:block;font-size:0.78rem;font-weight:700;color:#374151;margin:4px 0 6px;">System prompt (instructions for the AI)</label>
          <textarea id="aip-textarea" placeholder="Loading prompt…"></textarea>
          <div class="aip-footer">
            <span class="aip-hint">Changes apply immediately to all new conversations.</span>
            <div class="aip-actions">
              <span id="aip-status"></span>
              <button id="aip-save-btn">Save Prompt</button>
            </div>
          </div>
        </div>
      </div>
    `;
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });
    document.body.appendChild(overlay);

    /* Wire up */
    document.getElementById('aip-close-btn').addEventListener('click', closeModal);
    document.getElementById('aip-save-btn').addEventListener('click', savePrompt);
    overlay.querySelectorAll('.aip-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        overlay.querySelectorAll('.aip-tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        currentLang = tab.dataset.lang;
        syncTextarea();
        if (prompts[currentLang] === null) fetchPrompt(currentLang);
      });
    });

    /* ESC key */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
  }

  function openModal() {
    var overlay = document.getElementById('aip-overlay');
    if (!overlay) return;
    overlay.classList.add('aip-open');
    /* Reset to English tab */
    currentLang = 'en';
    overlay.querySelectorAll('.aip-tab').forEach(function (t) {
      t.classList.toggle('active', t.dataset.lang === 'en');
    });
    syncTextarea();
    if (prompts['en'] === null) fetchPrompt('en');
  }

  function closeModal() {
    var overlay = document.getElementById('aip-overlay');
    if (overlay) overlay.classList.remove('aip-open');
  }

  window.primeAddisOpenAIPrompt = function () {
    if (!document.getElementById('aip-overlay')) {
      try { buildUI(); } catch (e) {}
    }
    openModal();
  };

  /* ── API helpers ── */
  function fetchPrompt(lang) {
    var ta = document.getElementById('aip-textarea');
    if (ta && currentLang === lang) ta.placeholder = 'Loading…';
    Promise.all([
      fetch('/api/ai/prompt/' + lang).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }),
      fetch('/api/ai/greeting/' + lang).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })
    ]).then(function (results) {
      prompts[lang] = (results[0] && results[0].system_prompt) || '';
      greetings[lang] = (results[1] && results[1].greeting) || '';
      if (currentLang === lang) syncTextarea();
    }).catch(function () {
      if (currentLang === lang && ta) ta.placeholder = 'Could not load prompt.';
    });
  }

  function syncTextarea() {
    var ta = document.getElementById('aip-textarea');
    var gr = document.getElementById('aip-greeting');
    if (ta) {
      if (prompts[currentLang] !== null) {
        ta.value = prompts[currentLang];
        ta.placeholder = '';
      } else {
        ta.value = '';
        ta.placeholder = 'Loading…';
      }
    }
    if (gr) {
      gr.value = greetings[currentLang] !== null ? greetings[currentLang] : '';
    }
  }

  function showStatus(msg, type) {
    var el = document.getElementById('aip-status');
    if (!el) return;
    el.textContent = msg;
    el.className = type;
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.className = ''; el.textContent = ''; }, 3500);
  }

  function savePrompt() {
    var ta = document.getElementById('aip-textarea');
    var gr = document.getElementById('aip-greeting');
    var btn = document.getElementById('aip-save-btn');
    if (!ta || !btn) return;
    var text = ta.value.trim();
    var greet = gr ? gr.value.trim() : '';
    if (!text) { showStatus('Prompt cannot be empty.', 'error'); return; }
    btn.disabled = true;
    btn.textContent = 'Saving…';
    fetch('/api/admin/ai-prompts/' + currentLang, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system_prompt: text, greeting: greet }),
      credentials: 'include'
    })
      .then(function (r) {
        if (!r.ok) throw new Error('Server error ' + r.status);
        return r.json();
      })
      .then(function () {
        prompts[currentLang] = text;
        greetings[currentLang] = greet;
        showStatus('✓ Saved!', 'success');
      })
      .catch(function (e) {
        showStatus('Error: ' + e.message, 'error');
      })
      .finally(function () {
        btn.disabled = false;
        btn.textContent = 'Save Prompt';
      });
  }

  /* ── Show/hide FAB based on route ── */
  function updateFabVisibility() {
    var fab = document.getElementById('aip-fab');
    if (!fab) return;
    fab.classList.toggle('visible', isAdminRoute());
    if (!isAdminRoute()) closeModal();
  }

  /* ── Init ── */
  function init() {
    buildUI();
    updateFabVisibility();

    /* Intercept React Router navigation */
    var _push = history.pushState.bind(history);
    history.pushState = function () {
      _push.apply(history, arguments);
      setTimeout(updateFabVisibility, 150);
    };
    window.addEventListener('popstate', function () { setTimeout(updateFabVisibility, 150); });

    /* MutationObserver — safely watch for route changes in the DOM */
    var mo = new MutationObserver(function () { updateFabVisibility(); });
    mo.observe(document.body, { childList: true, subtree: false });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
