/**
 * whatsapp-header-patch.js
 * Adds a WhatsApp contact button (+251952000777) in the header,
 * immediately before the EN/አማ language toggle.
 * Ethio Property — non-invasive DOM patch.
 */
(function () {
  'use strict';

  var PHONE = '+251952000777';
  var WA_URL = 'https://wa.me/251952000777';
  var PATCH_ID = 'ethio-whatsapp-header-btn';

  function buildButton() {
    var a = document.createElement('a');
    a.id = PATCH_ID;
    a.href = WA_URL;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('aria-label', 'Chat on WhatsApp');

    a.style.cssText = [
      'display:inline-flex',
      'align-items:center',
      'gap:7px',
      'background:#25D366',
      'color:#ffffff',
      'border:none',
      'border-radius:9999px',
      'padding:7px 16px',
      'font-size:14px',
      'font-weight:600',
      'font-family:inherit',
      'text-decoration:none',
      'cursor:pointer',
      'white-space:nowrap',
      'flex-shrink:0',
      'box-shadow:0 1px 4px rgba(0,0,0,0.15)',
      'transition:background 0.2s'
    ].join(';');

    // WhatsApp SVG icon
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '18');
    svg.setAttribute('height', '18');
    svg.setAttribute('fill', '#ffffff');
    svg.style.flexShrink = '0';
    svg.innerHTML = '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>';
    a.appendChild(svg);

    var span = document.createElement('span');
    span.textContent = PHONE;
    // Hide number text on very small screens, keep icon only
    span.style.cssText = 'display:inline';
    a.appendChild(span);

    a.addEventListener('mouseenter', function () {
      a.style.background = '#1ebe57';
    });
    a.addEventListener('mouseleave', function () {
      a.style.background = '#25D366';
    });

    return a;
  }

  function inject() {
    if (document.getElementById(PATCH_ID)) return;

    // Wait for the lang toggle to exist — insert right before it
    var langToggle = document.getElementById('ethio-lang-toggle');
    if (langToggle && langToggle.parentElement) {
      langToggle.parentElement.insertBefore(buildButton(), langToggle);
      return;
    }

    // Fallback: find the same header slot the lang toggle uses
    var header = document.querySelector('header');
    if (!header) return;

    var menuBtn = header.querySelector('button[aria-label="Toggle menu"]');
    var slot = (menuBtn && menuBtn.parentElement) ||
               header.querySelector('.flex.items-center.space-x-4');
    if (!slot) return;

    var btn = buildButton();
    if (menuBtn) {
      slot.insertBefore(btn, menuBtn);
    } else {
      slot.appendChild(btn);
    }
  }

  function tryInject() {
    inject();
    if (!document.getElementById(PATCH_ID)) {
      setTimeout(tryInject, 400);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInject);
  } else {
    tryInject();
  }

  // Re-check after React re-renders
  new MutationObserver(function () {
    if (!document.getElementById(PATCH_ID)) inject();
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
