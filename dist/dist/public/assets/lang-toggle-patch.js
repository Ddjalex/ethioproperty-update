/**
 * lang-toggle-patch.js  v2
 * English / Amharic switcher using Google Website Translator.
 * Custom toggle UI; no Google dropdown/toolbar shown.
 *
 * Fix (v2): after Google Translate widget initialises, check the
 * googtrans cookie and fire a programmatic change on the hidden
 * select element so the translation actually applies on page load.
 * Also fixes the English-restore cookie clearing across all domain
 * variants, and falls back to reload if the select is not found
 * within the polling window.
 *
 * Ethio Property — non-invasive DOM patch.
 */
(function () {
  'use strict';

  var COOKIE_NAME = 'googtrans';
  var TARGET_LANG = 'am';

  /* ── Cookie helpers ─────────────────────────────────────────── */
  function setCookie(name, value) {
    var host = window.location.hostname;
    document.cookie = name + '=' + value + ';path=/';
    document.cookie = name + '=' + value + ';path=/;domain=.' + host;
  }

  function clearCookie(name) {
    var host = window.location.hostname;
    var exp = ';expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
    document.cookie = name + '=' + exp;
    document.cookie = name + '=' + exp + ';domain=.' + host;
    // Also clear without leading dot, and the /en/am variant Google sets itself
    document.cookie = name + '=/en/am' + exp;
    document.cookie = name + '=/en/am' + exp + ';domain=.' + host;
  }

  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  function currentLang() {
    var c = getCookie(COOKIE_NAME);
    if (c && c.indexOf('/' + TARGET_LANG) !== -1) return TARGET_LANG;
    return 'en';
  }

  /* ── Suppress Google's native chrome (banner, tooltip, bar) ─── */
  function hideGoogleTranslateChrome() {
    var style = document.createElement('style');
    style.textContent = [
      '.goog-te-banner-frame, .goog-te-gadget, .goog-te-menu-frame,',
      '#goog-gt-tt, .goog-tooltip { display:none !important; }',
      'body { top: 0 !important; }',
      '.goog-text-highlight { background: none !important; box-shadow: none !important; }'
    ].join('\n');
    document.head.appendChild(style);
  }

  /* ── Trigger translation via the hidden select GT injects ────── */
  // Google Translate renders a <select class="goog-te-combo"> inside the
  // hidden div. Changing its value + firing 'change' is the reliable way
  // to programmatically switch language without a page reload.
  function applyViaSelect(lang, attempt) {
    attempt = attempt || 0;
    var select = document.querySelector('select.goog-te-combo');
    if (select) {
      var target = (lang === TARGET_LANG) ? TARGET_LANG : '';
      if (select.value !== target) {
        select.value = target;
        // Use both modern and legacy event dispatch for maximum compatibility
        try {
          select.dispatchEvent(new Event('change', { bubbles: true }));
        } catch (e) {
          var ev = document.createEvent('HTMLEvents');
          ev.initEvent('change', true, true);
          select.dispatchEvent(ev);
        }
      }
      return true;
    }
    // Not ready yet — poll up to 10 s
    if (attempt < 50) {
      setTimeout(function () { applyViaSelect(lang, attempt + 1); }, 200);
    }
    return false;
  }

  /* ── Load Google Translate widget (hidden) ───────────────────── */
  function injectGoogleTranslateScript() {
    if (window.__ethioGTInit) return;
    window.__ethioGTInit = true;

    window.googleTranslateElementInit = function () {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: TARGET_LANG,
          autoDisplay: false,
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
        },
        'google_translate_element_hidden'
      );
      // KEY FIX: widget just initialised — now read the cookie and apply
      // the stored language.  Without this, autoDisplay:false means the
      // page always shows English even when the cookie says Amharic.
      if (currentLang() === TARGET_LANG) {
        applyViaSelect(TARGET_LANG);
      }
    };

    var hiddenDiv = document.createElement('div');
    hiddenDiv.id = 'google_translate_element_hidden';
    hiddenDiv.style.cssText = [
      'position:absolute',
      'top:-9999px',
      'left:-9999px',
      'visibility:hidden',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(hiddenDiv);

    var script = document.createElement('script');
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    document.body.appendChild(script);
  }

  /* ── Switch language ─────────────────────────────────────────── */
  function switchTo(lang) {
    if (lang === 'en') {
      clearCookie(COOKIE_NAME);
      // Reload to restore original page text reliably
      window.location.reload();
    } else {
      setCookie(COOKIE_NAME, '/en/' + lang);
      // Attempt to apply without a full reload (fast path)
      var applied = applyViaSelect(lang);
      if (!applied) {
        // GT not loaded yet; reload — init callback will apply translation
        setTimeout(function () { window.location.reload(); }, 80);
      } else {
        // Widget was already loaded; update button appearance
        if (window.__ethioLangPaint) window.__ethioLangPaint();
      }
    }
  }

  /* ── Toggle UI ───────────────────────────────────────────────── */
  function buildToggle() {
    var wrap = document.createElement('div');
    wrap.id = 'ethio-lang-toggle';
    wrap.style.cssText = [
      'display:inline-flex',
      'align-items:center',
      'gap:4px',
      'background:#ffffff',
      'border:1px solid #e2e2e2',
      'border-radius:9999px',
      'padding:3px',
      'font-family:inherit',
      'flex-shrink:0'
    ].join(';');

    var enBtn = document.createElement('button');
    var amBtn = document.createElement('button');

    [enBtn, amBtn].forEach(function (btn) {
      btn.type = 'button';
      btn.style.cssText = [
        'border:none',
        'cursor:pointer',
        'font-weight:600',
        'font-size:13px',
        'padding:6px 14px',
        'border-radius:9999px',
        'background:transparent',
        'color:#0F1729',
        'transition:background 0.15s,color 0.15s'
      ].join(';');
    });

    enBtn.textContent = 'EN';
    amBtn.textContent = '\u12a0\u121b'; // አማ in Unicode escape

    function paint() {
      var lang = currentLang();
      enBtn.style.background = lang === 'en' ? '#0F1729' : 'transparent';
      enBtn.style.color     = lang === 'en' ? '#ffffff' : '#0F1729';
      amBtn.style.background = lang === TARGET_LANG ? '#0F1729' : 'transparent';
      amBtn.style.color     = lang === TARGET_LANG ? '#ffffff' : '#0F1729';
    }

    // Expose paint so switchTo() fast-path can update the button
    window.__ethioLangPaint = paint;

    enBtn.addEventListener('click', function () {
      if (currentLang() !== 'en') switchTo('en');
    });
    amBtn.addEventListener('click', function () {
      if (currentLang() !== TARGET_LANG) switchTo(TARGET_LANG);
    });

    wrap.appendChild(enBtn);
    wrap.appendChild(amBtn);
    paint();
    return wrap;
  }

  /* ── Find the best header slot ───────────────────────────────── */
  function findNavbarSlot() {
    var header = document.querySelector('header');
    if (header) {
      var menuBtn = header.querySelector('button[aria-label="Toggle menu"]');
      if (menuBtn && menuBtn.parentElement) return menuBtn.parentElement;
      var controls = header.querySelector('.flex.items-center.space-x-4');
      if (controls) return controls;
    }
    var nav = document.querySelector('nav');
    if (nav) return nav;
    var homeLink = Array.prototype.find
      ? Array.prototype.find.call(
          document.querySelectorAll('a'),
          function (a) { return /^home$/i.test((a.textContent || '').trim()); }
        )
      : null;
    return homeLink ? (homeLink.closest('header') || homeLink.parentElement) : null;
  }

  /* ── Entry point ─────────────────────────────────────────────── */
  function init() {
    injectGoogleTranslateScript();
    hideGoogleTranslateChrome();

    var slot = findNavbarSlot();
    if (!slot) {
      setTimeout(init, 500);
      return;
    }
    if (document.getElementById('ethio-lang-toggle')) return;

    var toggle = buildToggle();
    var menuBtn = slot.querySelector('button[aria-label="Toggle menu"]');
    if (menuBtn) {
      slot.insertBefore(toggle, menuBtn);
    } else {
      slot.appendChild(toggle);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
