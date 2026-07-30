// admin-contact-info-patch.js
// Adds a "Contact Information" editor card to /admin/site-settings
(function () {
  'use strict';
  var PATCH_KEY = '__ADMIN_CONTACT_INFO_PATCH_V1__';
  if (window[PATCH_KEY]) return;
  window[PATCH_KEY] = true;

  /* ── styles ── */
  var style = document.createElement('style');
  style.textContent = `
    #aci-card {
      background: #fff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      padding: 24px 28px 28px;
      margin-top: 28px;
      font-family: inherit;
      max-width: 720px;
    }
    #aci-card h3 {
      font-size: 1.05rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    #aci-card .aci-sub {
      font-size: 0.82rem;
      color: #64748b;
      margin: 0 0 20px;
    }
    .aci-field { margin-bottom: 16px; }
    .aci-field label {
      display: block;
      font-size: 0.83rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 5px;
    }
    .aci-field input,
    .aci-field textarea {
      width: 100%;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      padding: 9px 12px;
      font-size: 0.875rem;
      font-family: inherit;
      color: #1e293b;
      background: #fff;
      box-sizing: border-box;
      transition: border-color .15s;
      resize: vertical;
    }
    .aci-field input:focus,
    .aci-field textarea:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37,99,235,.12);
    }
    .aci-hint {
      font-size: 0.75rem;
      color: #94a3b8;
      margin-top: 4px;
    }
    #aci-footer {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 20px;
      flex-wrap: wrap;
    }
    #aci-save-btn {
      background: #2563eb;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 10px 26px;
      font-size: 0.875rem;
      font-weight: 700;
      cursor: pointer;
      transition: background .15s;
    }
    #aci-save-btn:hover:not(:disabled) { background: #1d4ed8; }
    #aci-save-btn:disabled { opacity: .55; cursor: not-allowed; }
    #aci-status {
      font-size: 0.82rem;
      padding: 6px 14px;
      border-radius: 6px;
      display: none;
    }
    #aci-status.success { display: inline-block; background: #d1fae5; color: #065f46; }
    #aci-status.error   { display: inline-block; background: #fee2e2; color: #991b1b; }
  `;
  document.head.appendChild(style);

  /* ── API helpers ── */
  async function loadContactInfo() {
    try {
      var r = await fetch('/api/contact-info', { credentials: 'same-origin' });
      if (!r.ok) return {};
      return await r.json();
    } catch (e) { return {}; }
  }

  async function saveContactInfo(data) {
    var r = await fetch('/api/admin/contact-info', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!r.ok) {
      var err = await r.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Save failed');
    }
    return await r.json();
  }

  /* ── build UI ── */
  function buildCard() {
    var card = document.createElement('div');
    card.id = 'aci-card';
    card.innerHTML = `
      <h3>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
             stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
        Contact Information
      </h3>
      <p class="aci-sub">These details appear in the contact section of the homepage.</p>

      <div class="aci-field">
        <label for="aci-address">Address</label>
        <textarea id="aci-address" rows="3" placeholder="Bole Road, Atlas Building&#10;4th Floor, Office 407&#10;Addis Ababa, Ethiopia"></textarea>
        <p class="aci-hint">Use one line per address line (press Enter to add a new line).</p>
      </div>

      <div class="aci-field">
        <label for="aci-phone">Phone Number</label>
        <input id="aci-phone" type="text" placeholder="0952000777">
      </div>

      <div class="aci-field">
        <label for="aci-email">Email Address</label>
        <input id="aci-email" type="text" placeholder="ethioproperty1@gmail.com">
      </div>

      <div class="aci-field">
        <label for="aci-weekday">Weekday Hours</label>
        <input id="aci-weekday" type="text" placeholder="Monday - Friday: 8:30 AM - 5:30 PM">
      </div>

      <div class="aci-field">
        <label for="aci-saturday">Saturday Hours</label>
        <input id="aci-saturday" type="text" placeholder="Saturday: 9:00 AM - 3:00 PM">
      </div>

      <div class="aci-field">
        <label for="aci-sunday">Sunday Hours</label>
        <input id="aci-sunday" type="text" placeholder="Sunday: Closed">
      </div>

      <div id="aci-footer">
        <button id="aci-save-btn" type="button">Save Contact Info</button>
        <span id="aci-status"></span>
      </div>
    `;
    return card;
  }

  function setStatus(msg, type) {
    var el = document.getElementById('aci-status');
    if (!el) return;
    el.textContent = msg;
    el.className = type;
    if (type === 'success') setTimeout(function () { el.className = ''; el.textContent = ''; }, 3500);
  }

  async function init(card) {
    var info = await loadContactInfo();
    var get = function (id) { return document.getElementById(id); };

    if (info.address)               get('aci-address').value  = info.address;
    if (info.phone)                 get('aci-phone').value    = info.phone;
    if (info.email)                 get('aci-email').value    = info.email;
    if (info.businessHoursWeekday)  get('aci-weekday').value  = info.businessHoursWeekday;
    if (info.businessHoursSaturday) get('aci-saturday').value = info.businessHoursSaturday;
    if (info.businessHoursSunday)   get('aci-sunday').value   = info.businessHoursSunday;

    get('aci-save-btn').addEventListener('click', async function () {
      var btn = get('aci-save-btn');
      btn.disabled = true;
      btn.textContent = 'Saving…';
      try {
        await saveContactInfo({
          address:              get('aci-address').value.trim(),
          phone:                get('aci-phone').value.trim(),
          email:                get('aci-email').value.trim(),
          businessHoursWeekday: get('aci-weekday').value.trim(),
          businessHoursSaturday:get('aci-saturday').value.trim(),
          businessHoursSunday:  get('aci-sunday').value.trim(),
        });
        setStatus('Saved successfully!', 'success');
      } catch (e) {
        setStatus(e.message || 'Error saving', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Save Contact Info';
      }
    });
  }

  /* ── inject card into the admin settings page ── */
  function isAdminSettingsPage() {
    return /^\/admin\/site-settings\b/.test(window.location.pathname);
  }

  function findInsertTarget() {
    // Look for the form element or main content area
    var form = document.querySelector('form');
    if (form) return form;
    // Fallback: any main/section content block
    var main = document.querySelector('main');
    if (main) return main;
    return null;
  }

  async function patch() {
    if (!isAdminSettingsPage()) return;
    if (document.getElementById('aci-card')) return; // already injected

    var target = findInsertTarget();
    if (!target) return;

    var card = buildCard();
    target.appendChild(card);
    await init(card);
  }

  var lastPath = location.pathname;
  function schedulePatch() {
    setTimeout(patch, 400);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedulePatch);
  } else {
    schedulePatch();
  }

  new MutationObserver(function () {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      schedulePatch();
    } else if (isAdminSettingsPage() && !document.getElementById('aci-card')) {
      setTimeout(patch, 200);
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
