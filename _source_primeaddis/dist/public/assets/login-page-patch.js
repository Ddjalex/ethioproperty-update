(function () {
  var PATCH_KEY = '__paLoginPagePatch_v11__';
  if (window[PATCH_KEY]) return;
  window[PATCH_KEY] = true;

  /* ── Inject persistent CSS that targets the auth page layout ── */
  var styleEl = document.createElement('style');
  styleEl.id = 'pa-login-fix-css';
  styleEl.textContent = `
    body.pa-auth-page footer,
    body.pa-auth-page .footer {
      display: none !important;
    }

    /* Replacement container — covers the full viewport below the navbar */
    #pa-auth-replacement {
      position: fixed !important;
      left: 0 !important;
      right: 0 !important;
      top: 64px !important;
      bottom: 0 !important;
      z-index: 2147483647 !important;
      overflow-y: auto !important;
      background: #f8fafc !important;
      padding: 40px 20px 80px !important;
      box-sizing: border-box !important;
      display: flex !important;
      align-items: flex-start !important;
      justify-content: center !important;
    }

    #pa-auth-replacement * {
      box-sizing: border-box !important;
    }

    #pa-auth-replacement .pa-auth-card {
      width: 100% !important;
      max-width: 460px !important;
      margin: 0 auto !important;
      background: #ffffff !important;
      border: 1px solid #e5e7eb !important;
      border-radius: 14px !important;
      box-shadow: 0 8px 24px rgba(15,23,42,0.10) !important;
      padding: 32px !important;
    }

    #pa-auth-replacement input,
    #pa-auth-replacement button[type="submit"] {
      width: 100% !important;
      min-height: 46px !important;
      font-size: 16px !important;
      position: relative !important;
      z-index: 2147483640 !important;
      pointer-events: auto !important;
    }

    #pa-auth-replacement button[data-pa-tab] {
      flex: 1 !important;
      padding: 8px 0 !important;
      cursor: pointer !important;
    }

    @media (max-width: 900px) {
      #pa-auth-replacement {
        top: 0 !important;
        padding: 72px 16px 100px !important;
        -webkit-overflow-scrolling: touch !important;
      }

      #pa-auth-replacement .pa-auth-card {
        max-width: 100% !important;
        padding: 20px 16px !important;
      }

      #pa-auth-replacement input,
      #pa-auth-replacement button[type="submit"] {
        min-height: 48px !important;
      }
    }
  `;
  document.head.appendChild(styleEl);

  function isAuthPage() {
    var p = window.location.pathname;
    return p === '/auth' || p === '/login' || p === '/register';
  }

  function fixAuthLayout() {
    if (!isAuthPage()) {
      document.body.classList.remove('pa-auth-page');
      var existing = document.getElementById('pa-auth-replacement');
      if (existing) existing.remove();
      return;
    }
    document.body.classList.add('pa-auth-page');
    renderReplacementAuth();
  }

  function getActiveTab() {
    return new URLSearchParams(window.location.search).get('tab') === 'register' ? 'register' : 'login';
  }

  function setActiveTab(tab) {
    var url = tab === 'register' ? '/auth?tab=register' : '/auth';
    history.replaceState(null, '', url);
    renderReplacementAuth();
  }

  function renderReplacementAuth() {
    if (!isAuthPage()) {
      var existing = document.getElementById('pa-auth-replacement');
      if (existing) existing.remove();
      return;
    }

    var mount = document.getElementById('pa-auth-replacement');
    if (!mount) {
      mount = document.createElement('div');
      mount.id = 'pa-auth-replacement';
      document.body.appendChild(mount);
    }

    var tab = getActiveTab();
    mount.innerHTML = [
      '<div class="pa-auth-card">',
        '<div style="display:flex;margin-bottom:18px;background:#f3f4f6;border-radius:8px;padding:3px;gap:3px;">',
          '<button type="button" data-pa-tab="login" style="border:0;border-radius:7px;background:'+(tab === 'login' ? '#fff' : 'transparent')+';color:#111827;font-weight:600;">Login</button>',
          '<button type="button" data-pa-tab="register" style="border:0;border-radius:7px;background:'+(tab === 'register' ? '#fff' : 'transparent')+';color:#111827;font-weight:600;">Register</button>',
        '</div>',
        '<h2 style="margin:0 0 6px;font-size:24px;line-height:1.2;color:#111827;">'+(tab === 'register' ? 'Create Account' : 'Account Login')+'</h2>',
        '<p style="margin:0 0 18px;color:#6b7280;font-size:14px;">'+(tab === 'register' ? 'Create your account to save and manage properties' : 'Enter your credentials to access your account')+'</p>',
        '<form id="pa-auth-replacement-form" style="display:flex;flex-direction:column;gap:14px;">',
          '<div style="display:flex;flex-direction:column;gap:6px;"><label for="pa-username">Username</label><input id="pa-username" name="username" autocomplete="username" required placeholder="Enter your username" style="border:1px solid #d1d5db;border-radius:8px;padding:0 12px;background:#fff;color:#111827;width:100%;min-height:46px;font-size:16px;box-sizing:border-box;"></div>',
          tab === 'register' ? '<div style="display:flex;flex-direction:column;gap:6px;"><label for="pa-email">Email</label><input id="pa-email" name="email" type="email" autocomplete="email" required placeholder="Enter your email" style="border:1px solid #d1d5db;border-radius:8px;padding:0 12px;background:#fff;color:#111827;width:100%;min-height:46px;font-size:16px;box-sizing:border-box;"></div>' : '',
          '<div style="display:flex;flex-direction:column;gap:6px;"><label for="pa-password">Password</label><input id="pa-password" name="password" type="password" autocomplete="'+(tab === 'register' ? 'new-password' : 'current-password')+'" required placeholder="Enter your password" style="border:1px solid #d1d5db;border-radius:8px;padding:0 12px;background:#fff;color:#111827;width:100%;min-height:46px;font-size:16px;box-sizing:border-box;"></div>',
          '<button type="submit" style="border:0;border-radius:8px;background:#020617;color:#fff;font-weight:700;margin-top:4px;width:100%;min-height:48px;font-size:16px;cursor:pointer;">'+(tab === 'register' ? 'Register' : 'Login')+'</button>',
          '<div id="pa-auth-message" style="min-height:18px;font-size:13px;color:#b91c1c;text-align:center;"></div>',
        '</form>',
      '</div>'
    ].join('');

    mount.querySelectorAll('[data-pa-tab]').forEach(function (button) {
      button.addEventListener('click', function () {
        setActiveTab(button.getAttribute('data-pa-tab'));
      });
    });

    var form = document.getElementById('pa-auth-replacement-form');
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var message = document.getElementById('pa-auth-message');
      var submit = form.querySelector('button[type="submit"]');
      var data = {
        username: form.username.value.trim(),
        password: form.password.value
      };
      if (tab === 'register') data.email = form.email.value.trim();
      message.textContent = '';
      submit.disabled = true;
      submit.textContent = tab === 'register' ? 'Registering...' : 'Logging in...';
      fetch(tab === 'register' ? '/api/register' : '/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      }).then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (body) {
          if (!response.ok) throw new Error(body.message || 'Please check your details and try again.');
          return body;
        });
      }).then(function (user) {
        window.location.href = user && user.isAdmin ? '/admin' : '/';
      }).catch(function (error) {
        message.textContent = error.message || 'Please check your details and try again.';
        submit.disabled = false;
        submit.textContent = tab === 'register' ? 'Register' : 'Login';
      });
    });
  }

  /* Guard to prevent re-entrant / looping calls to fixAuthLayout */
  var _fixing = false;
  var _origFixAuthLayout = fixAuthLayout;
  fixAuthLayout = function () {
    if (_fixing) return;
    _fixing = true;
    try { _origFixAuthLayout(); } finally { _fixing = false; }
  };

  function boot() {
    fixAuthLayout();
    setTimeout(fixAuthLayout, 300);
    setTimeout(fixAuthLayout, 800);

    var lastPath = window.location.pathname;
    /* Only re-run on actual URL/path changes — never on every DOM mutation
       (that caused an infinite loop because fixAuthLayout itself mutates the DOM) */
    new MutationObserver(function () {
      var currentPath = window.location.pathname;
      if (currentPath !== lastPath) {
        lastPath = currentPath;
        setTimeout(fixAuthLayout, 150);
      }
    }).observe(document.body, { childList: true, subtree: false });

    ['pushState', 'replaceState'].forEach(function (method) {
      var orig = history[method];
      history[method] = function () {
        orig.apply(this, arguments);
        setTimeout(fixAuthLayout, 150);
      };
    });

    window.addEventListener('popstate', function () {
      setTimeout(fixAuthLayout, 150);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
