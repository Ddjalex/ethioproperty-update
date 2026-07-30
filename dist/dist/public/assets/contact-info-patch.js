// contact-info-patch.js
// Replaces hardcoded contact info on the homepage with live data from /api/contact-info
(function () {
  'use strict';
  var PATCH_KEY = '__CONTACT_INFO_PATCH_V1__';
  if (window[PATCH_KEY]) return;
  window[PATCH_KEY] = true;

  async function getContactInfo() {
    try {
      var res = await fetch('/api/contact-info', { credentials: 'same-origin' });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  function findParaByText(text) {
    var paras = document.querySelectorAll('p');
    for (var i = 0; i < paras.length; i++) {
      if ((paras[i].textContent || '').includes(text)) return paras[i];
    }
    return null;
  }

  function buildAddressHTML(address) {
    if (!address) return '';
    var lines = address.split('\n').filter(Boolean);
    if (lines.length <= 1) return escHtml(address);
    return lines.map(function (l, idx) {
      return escHtml(l) + (idx < lines.length - 1 ? '<br>' : '');
    }).join('');
  }

  function escHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function buildHoursHTML(weekday, saturday, sunday) {
    var parts = [];
    if (weekday)  parts.push(escHtml(weekday));
    if (saturday) parts.push(escHtml(saturday));
    if (sunday)   parts.push(escHtml(sunday));
    return parts.join('<br>');
  }

  function applyPatch(info) {
    if (!info) return;

    // ── Address ──────────────────────────────────────────────
    // Hardcoded: "Bole Road, Atlas Building<br>4th Floor, Office 407<br>Addis Ababa, Ethiopia"
    var addrEl = findParaByText('Bole Road, Atlas Building') || findParaByText('Atlas Building');
    if (addrEl && info.address) {
      addrEl.innerHTML = buildAddressHTML(info.address);
    }

    // ── Phone ─────────────────────────────────────────────────
    // Hardcoded: "0952000777" — only replace if inside the dark contact section
    // (avoid hitting the WhatsApp header phone)
    var phoneEl = findParaByText('0952000777');
    if (phoneEl && info.phone) {
      phoneEl.textContent = info.phone;
    }

    // ── Email ─────────────────────────────────────────────────
    var emailEl = findParaByText('ethioproperty1@gmail.com');
    if (emailEl && info.email) {
      emailEl.textContent = info.email;
    }

    // ── Business hours ────────────────────────────────────────
    var hoursEl = findParaByText('Monday - Friday: 8:30 AM') || findParaByText('Monday - Friday:');
    if (hoursEl) {
      hoursEl.innerHTML = buildHoursHTML(
        info.businessHoursWeekday,
        info.businessHoursSaturday,
        info.businessHoursSunday
      );
    }
  }

  var applied = false;
  async function patch() {
    if (applied) return;
    // Only run on homepage or contact section pages
    var path = window.location.pathname;
    if (path !== '/' && path !== '/contact' && !path.startsWith('/?')) return;
    var info = await getContactInfo();
    if (!info) return;
    applyPatch(info);
    applied = true;
  }

  function schedulePatch() {
    applied = false; // allow re-apply on navigation
    setTimeout(patch, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedulePatch);
  } else {
    schedulePatch();
  }

  // Re-run on SPA navigation
  var lastPath = location.pathname;
  new MutationObserver(function () {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      schedulePatch();
    } else {
      // Also re-apply if DOM changed and element wasn't there yet
      if (!applied) setTimeout(patch, 150);
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
