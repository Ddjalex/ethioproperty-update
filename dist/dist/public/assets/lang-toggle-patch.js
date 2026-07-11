/**
 * lang-toggle-patch.js
 * Site-wide English/Amharic switcher using Google Website Translator,
 * but with a clean custom toggle instead of Google's default dropdown UI.
 * Ethio Property — non-invasive DOM patch.
 */
(function () {
  'use strict';

  var COOKIE_NAME = 'googtrans';

  function setCookie(name, value) {
    var domain = window.location.hostname;
    // Set on both current host and parent domain so it survives www/non-www and subpaths
    document.cookie = name + '=' + value + ';path=/';
    document.cookie = name + '=' + value + ';path=/;domain=.' + domain;
  }

  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  function currentLang() {
    var c = getCookie(COOKIE_NAME); // format: /en/am when translated
    if (c && c.indexOf('/am') !== -1) return 'am';
    return 'en';
  }

  function switchTo(lang) {
    if (lang === 'en') {
      // Clear translation cookie to revert to original English
      setCookie(COOKIE_NAME, '');
      document.cookie = COOKIE_NAME + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    } else {
      setCookie(COOKIE_NAME, '/en/am');
    }
    window.location.reload();
  }

  function injectGoogleTranslateScript() {
    if (window.__ethioGTInit) return;
    window.__ethioGTInit = true;

    window.googleTranslateElementInit = function () {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: 'am',
          autoDisplay: false,
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
        },
        'google_translate_element_hidden'
      );
    };

    var hiddenDiv = document.createElement('div');
    hiddenDiv.id = 'google_translate_element_hidden';
    hiddenDiv.style.cssText = 'position:absolute;top:-9999px;left:-9999px;visibility:hidden;';
    document.body.appendChild(hiddenDiv);

    var script = document.createElement('script');
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    document.body.appendChild(script);
  }

  function hideGoogleTranslateChrome() {
    // Google injects a top banner iframe/bar when active — hide it, and
    // prevent the page from being pushed down by Google's default toolbar.
    var style = document.createElement('style');
    style.textContent = [
      '.goog-te-banner-frame, .goog-te-gadget, #goog-gt-tt, .goog-tooltip { display:none !important; }',
      'body { top: 0 !important; }',
      '.goog-text-highlight { background: none !important; box-shadow: none !important; }'
    ].join('\n');
    document.head.appendChild(style);
  }

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
      'font-family:inherit'
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
        'color:#0F1729'
      ].join(';');
    });

    enBtn.textContent = 'EN';
    amBtn.textContent = 'አማ';

    function paint() {
      var lang = currentLang();
      enBtn.style.background = lang === 'en' ? '#0F1729' : 'transparent';
      enBtn.style.color = lang === 'en' ? '#ffffff' : '#0F1729';
      amBtn.style.background = lang === 'am' ? '#0F1729' : 'transparent';
      amBtn.style.color = lang === 'am' ? '#ffffff' : '#0F1729';
    }

    enBtn.addEventListener('click', function () {
      if (currentLang() !== 'en') switchTo('en');
    });
    amBtn.addEventListener('click', function () {
      if (currentLang() !== 'am') switchTo('am');
    });

    wrap.appendChild(enBtn);
    wrap.appendChild(amBtn);
    paint();
    return wrap;
  }

  function findNavbarSlot() {
    // The site's <nav> (link list) is desktop-only (Tailwind "hidden md:flex"),
    // so appending into it would make the toggle disappear on mobile widths.
    // Prefer the header's always-visible control cluster instead — the flex
    // container that holds the account menu / mobile hamburger button, which
    // stays visible at every breakpoint.
    var header = document.querySelector('header');
    if (header) {
      var menuBtn = header.querySelector('button[aria-label="Toggle menu"]');
      if (menuBtn && menuBtn.parentElement) return menuBtn.parentElement;
      var controls = header.querySelector('.flex.items-center.space-x-4');
      if (controls) return controls;
    }
    // Fallback heuristic: a <nav> element, or the header containing links
    // like Home/Properties/Blog/Contact.
    var nav = document.querySelector('nav');
    if (nav) return nav;
    var homeLink = Array.prototype.find.call(
      document.querySelectorAll('a'),
      function (a) { return /^home$/i.test((a.textContent || '').trim()); }
    );
    return homeLink ? homeLink.closest('header') || homeLink.parentElement : null;
  }

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
    toggle.style.flexShrink = '0';
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
