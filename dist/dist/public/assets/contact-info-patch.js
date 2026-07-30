// contact-info-patch.js v2
// Replaces hardcoded contact section data with live /api/contact-info data:
//   address, phone, email, business hours, social links, left-side image
(function () {
  'use strict';
  var PATCH_KEY = '__CONTACT_INFO_PATCH_V2__';
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

  function escHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function findParaByText(needle) {
    var paras = document.querySelectorAll('p');
    for (var i = 0; i < paras.length; i++) {
      if ((paras[i].textContent || '').includes(needle)) return paras[i];
    }
    return null;
  }

  function buildAddressHTML(address) {
    if (!address) return '';
    var lines = address.split('\n').filter(Boolean);
    return lines.map(function (l, idx) {
      return escHtml(l) + (idx < lines.length - 1 ? '<br>' : '');
    }).join('');
  }

  function buildHoursHTML(weekday, saturday, sunday) {
    var parts = [];
    if (weekday)  parts.push(escHtml(weekday));
    if (saturday) parts.push(escHtml(saturday));
    if (sunday)   parts.push(escHtml(sunday));
    return parts.join('<br>');
  }

  /* Find the dark contact section that contains address + hours */
  function findContactSection() {
    var blocks = document.querySelectorAll('section, div');
    for (var i = 0; i < blocks.length; i++) {
      var text = (blocks[i].textContent || '').toLowerCase();
      if (
        (text.includes('bole road') || text.includes('addis ababa') || text.includes('atlas building')) &&
        (text.includes('monday') || text.includes('saturday') || text.includes('closed'))
      ) {
        return blocks[i].closest('section') || blocks[i];
      }
    }
    return null;
  }

  function applyContactText(info) {
    // ── Address ──────────────────────────────────────────────
    var addrEl = findParaByText('Bole Road, Atlas Building') || findParaByText('Atlas Building');
    if (addrEl && info.address) {
      addrEl.innerHTML = buildAddressHTML(info.address);
    }

    // ── Phone ─────────────────────────────────────────────────
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

  function applySocialLinks(info) {
    // Replace hardcoded social links: Facebook, LinkedIn, TikTok, YouTube
    var section = findContactSection();
    if (!section) return;

    var links = section.querySelectorAll('a[aria-label]');
    links.forEach(function (a) {
      var label = (a.getAttribute('aria-label') || '').toLowerCase();
      if (label === 'facebook'  && info.facebookUrl) a.href = info.facebookUrl;
      if (label === 'linkedin'  && info.linkedinUrl) a.href = info.linkedinUrl;
      if (label === 'tiktok'    && info.tiktokUrl)   a.href = info.tiktokUrl;
      if (label === 'youtube'   && info.youtubeUrl)  a.href = info.youtubeUrl;
    });
  }

  function applyContactImage(info) {
    if (!info.contactSectionImage) return;
    var section = findContactSection();
    if (!section) return;
    // The left side image is the first <img> inside the contact section
    // that is NOT a small icon (width > 100px or no width set)
    var imgs = section.querySelectorAll('img');
    for (var i = 0; i < imgs.length; i++) {
      var img = imgs[i];
      // Skip tiny icons / logo images
      var w = img.naturalWidth || img.width || img.offsetWidth || 0;
      if (w > 0 && w < 80) continue;
      var src = (img.getAttribute('src') || '');
      // Skip logo/brand images
      if (src.includes('ethioproperty') || src.includes('favicon') || src.includes('avatar')) continue;
      img.src = info.contactSectionImage;
      img.style.objectFit = 'cover';
      break;
    }
  }

  var applied = false;

  async function patch() {
    if (applied) return;
    var path = window.location.pathname;
    if (path !== '/' && path !== '/contact' && !path.startsWith('/?')) return;

    var info = await getContactInfo();
    if (!info) return;

    applyContactText(info);
    applySocialLinks(info);
    applyContactImage(info);
    applied = true;
  }

  function schedulePatch() {
    applied = false;
    setTimeout(patch, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedulePatch);
  } else {
    schedulePatch();
  }

  var lastPath = location.pathname;
  new MutationObserver(function () {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      schedulePatch();
    } else if (!applied) {
      setTimeout(patch, 150);
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
