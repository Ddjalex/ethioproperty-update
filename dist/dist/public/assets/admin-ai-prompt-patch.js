(function () {
  'use strict';
  var PATCH_KEY = '__ADMIN_AI_PROMPT_PATCH_V3__';
  if (window[PATCH_KEY]) return;
  window[PATCH_KEY] = true;

  /* ── Styles (Ethio Property admin palette — matches Manage Subscribers/Users) ── */
  var style = document.createElement('style');
  style.textContent = `
    #aip-overlay {
      display: none !important;
      position: fixed !important;
      inset: 0 !important;
      z-index: 9999 !important;
      background: rgba(15,23,42,.55) !important;
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
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .aip-badge {
      background: #eff6ff;
      color: #2563eb;
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
      color: #64748b;
      line-height: 1;
      padding: 4px;
      border-radius: 6px;
    }
    #aip-close-btn:hover { background: #f1f5f9; }
    #aip-modal-body { padding: 18px 26px 26px; }
    .aip-sub {
      font-size: 0.82rem;
      color: #64748b;
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
      border: 1.5px solid #e2e8f0;
      background: #f8fafc;
      color: #334155;
      font-size: 0.85rem;
      cursor: pointer;
      font-weight: 600;
      transition: all .15s;
    }
    .aip-tab.active {
      background: #2563eb;
      border-color: #2563eb;
      color: #fff;
    }
    #aip-textarea {
      width: 100%;
      min-height: 200px;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px;
      font-size: 0.875rem;
      line-height: 1.65;
      resize: vertical;
      box-sizing: border-box;
      font-family: inherit;
      color: #1e293b;
      transition: border-color .15s;
    }
    #aip-textarea:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37,99,235,.15);
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
      color: #94a3b8;
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
      background: #2563eb;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 9px 24px;
      font-size: 0.875rem;
      font-weight: 700;
      cursor: pointer;
      transition: background .15s;
    }
    #aip-save-btn:hover:not(:disabled) { background: #1d4ed8; }
    #aip-save-btn:disabled { opacity: .5; cursor: not-allowed; }
  `;
  document.head.appendChild(style);

  /* ── State ── */
  var currentLang = 'en';
  var prompts = { en: null, am: null };
  var greetings = { en: null, am: null };

  /* ── Build modal DOM (lazily, on first open) ── */
  function buildUI() {
    if (document.getElementById('aip-overlay')) return;

    var overlay = document.createElement('div');
    overlay.id = 'aip-overlay';
    overlay.innerHTML = `
      <div id="aip-modal">
        <div id="aip-modal-header">
          <h2>AI Prompt Settings <span class="aip-badge">gemini-2.0-flash</span></h2>
          <button id="aip-close-btn" title="Close">&times;</button>
        </div>
        <div id="aip-modal-body">
          <p class="aip-sub">Edit what the AI assistant says to visitors. Property listings are automatically appended — just write your instructions.</p>
          <div class="aip-tabs">
            <button class="aip-tab active" data-lang="en">English</button>
            <button class="aip-tab" data-lang="am">Amharic</button>
          </div>
          <label for="aip-greeting" style="display:block;font-size:0.78rem;font-weight:700;color:#334155;margin:4px 0 6px;">Opening greeting (shown &amp; spoken when the panel opens)</label>
          <textarea id="aip-greeting" placeholder="e.g. Welcome to Ethio Property! How can I help?" style="width:100%;min-height:64px;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 12px;font-size:0.875rem;line-height:1.5;resize:vertical;box-sizing:border-box;font-family:inherit;color:#1e293b;margin-bottom:12px;"></textarea>
          <label for="aip-textarea" style="display:block;font-size:0.78rem;font-weight:700;color:#334155;margin:4px 0 6px;">System prompt (instructions for the AI)</label>
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

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
  }

  function openModal() {
    buildUI();
    var overlay = document.getElementById('aip-overlay');
    if (!overlay) return;
    overlay.classList.add('aip-open');
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

  window.ethioPropertyOpenAIPrompt = openModal;

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
        if (r.status === 401) throw new Error('SESSION_EXPIRED');
        if (!r.ok) throw new Error('Server error ' + r.status);
        return r.json();
      })
      .then(function () {
        prompts[currentLang] = text;
        greetings[currentLang] = greet;
        showStatus('✓ Saved!', 'success');
      })
      .catch(function (e) {
        if (e.message === 'SESSION_EXPIRED') {
          showStatus('Session expired — please log in again', 'error');
          setTimeout(function () {
            window.location.href = '/auth';
          }, 1500);
        } else {
          showStatus('Error: ' + e.message, 'error');
        }
      })
      .finally(function () {
        btn.disabled = false;
        btn.textContent = 'Save Prompt';
      });
  }

  /* ── Add sidebar menu item to admin dashboard (same pattern as
     admin-subscribers-patch.js: locate the "View All Inquiries" button
     and append a sibling into its container). ── */
  function addSidebarButton() {
    if (!/^\/admin/i.test(location.pathname)) return;
    if (document.getElementById('aip-sidebar-btn')) return;

    var allEls = Array.from(document.querySelectorAll('button, a'));
    var inquiriesBtn = allEls.find(function (b) { return b.textContent.trim() === 'View All Inquiries'; });
    if (!inquiriesBtn) return;

    var container = inquiriesBtn.closest('.space-y-2') || inquiriesBtn.closest('div') || inquiriesBtn.parentElement;
    if (!container) return;

    var btn = document.createElement('button');
    btn.id = 'aip-sidebar-btn';
    btn.type = 'button';
    btn.className = inquiriesBtn.className;
    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px;"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>AI Prompt Settings';
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      openModal();
    });

    container.appendChild(btn);
  }

  /* ── Route/DOM watch (mirrors admin-subscribers-patch.js) ── */
  function handleRoute() {
    if (/^\/admin/i.test(location.pathname)) addSidebarButton();
  }

  var timer;
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(handleRoute, 250);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule, { once: true });
  } else {
    schedule();
  }

  new MutationObserver(function (mutations) {
    if (mutations.some(function (m) { return m.addedNodes.length > 0; })) schedule();
  }).observe(document.documentElement, { childList: true, subtree: true });

  var _push = history.pushState;
  history.pushState = function () { _push.apply(this, arguments); schedule(); };
  window.addEventListener('popstate', schedule);

  setTimeout(schedule, 600);
  setTimeout(schedule, 1500);
})();
