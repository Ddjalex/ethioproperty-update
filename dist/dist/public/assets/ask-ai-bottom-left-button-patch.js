/*
 * Bottom-left "Ask AI" launcher — the ONLY way to open the Ask AI panel now
 * that the navbar button (desktop pill + mobile pill) has been removed from
 * ai-voice-assistant-patch.js. Sits where the Tawk.to bubble used to be
 * (bottom-left), so it doesn't collide with the WhatsApp/Telegram/phone
 * cluster (fixed bottom-6 right-6) or the EN/AM language toggle (top navbar).
 *
 * Visual: the uploaded circular avatar photo (ask-ai-avatar.png) instead of
 * a generic icon, with a curved "We are here!" text arcing over the top of
 * the icon — no flat label/pill/wedge, just bold curved text directly on
 * the page (Tawk.to-style curved greeting, applied to our own avatar icon).
 *
 * Behavior: unchanged — clicking calls window.__paAskAI(), the same toggle
 * function the old navbar buttons called, which opens/closes the existing
 * Ask AI panel built by ai-voice-assistant-patch.js.
 */
(function () {
  if (window.__paAskAIFabPatchV1__) return;
  window.__paAskAIFabPatchV1__ = true;

  var AVATAR_SRC = '/assets/ask-ai-avatar.png';

  function injectStyles() {
    if (document.getElementById('pa-ai-fab-style')) return;
    var style = document.createElement('style');
    style.id = 'pa-ai-fab-style';
    style.textContent = `
      #pa-ai-fab-wrap {
        position: fixed;
        left: 14px;
        bottom: 24px;
        width: 128px;
        height: 118px;
        z-index: 9998; /* below the Ask AI panel (10001) but above page content */
        font-family: inherit;
      }
      #pa-ai-fab-btn {
        position: absolute;
        left: 34px;
        bottom: 0;
        width: 60px; height: 60px;
        border-radius: 50%;
        border: none;
        padding: 0;
        cursor: pointer;
        background: #fff;
        box-shadow: 0 6px 20px rgba(0,0,0,0.22), 0 0 0 3px rgba(99,102,241,0.18);
        display: flex; align-items: center; justify-content: center;
        overflow: hidden;
        flex-shrink: 0;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        animation: pa-fab-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
      }
      #pa-ai-fab-btn:hover {
        transform: translateY(-2px) scale(1.04);
        box-shadow: 0 8px 26px rgba(0,0,0,0.28), 0 0 0 3px rgba(99,102,241,0.3);
      }
      #pa-ai-fab-btn img {
        width: 100%; height: 100%;
        object-fit: cover;
        border-radius: 50%;
        display: block;
      }
      #pa-ai-fab-btn.active {
        box-shadow: 0 8px 26px rgba(0,0,0,0.28), 0 0 0 3px rgba(99,102,241,0.55);
      }
      @keyframes pa-fab-pop {
        from { transform: scale(0.6); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      #pa-ai-fab-curve {
        position: absolute;
        top: 0; left: 0;
        width: 128px; height: 118px;
        pointer-events: none;
        animation: pa-fab-label-in 0.4s ease 0.2s both;
      }
      #pa-ai-fab-curve text {
        font-family: inherit;
        font-size: 15px;
        font-weight: 800;
        letter-spacing: 0.5px;
        fill: #0f4c3c;
        paint-order: stroke fill;
        stroke: #fff;
        stroke-width: 4px;
        stroke-linejoin: round;
      }
      @keyframes pa-fab-label-in {
        from { opacity: 0; transform: translateY(4px); }
        to { opacity: 1; transform: translateY(0); }
      }
      #pa-ai-fab-dot {
        position: absolute;
        left: 86px;
        bottom: 46px;
        width: 10px; height: 10px;
        border-radius: 50%;
        background: #4ade80;
        box-shadow: 0 0 0 2px #fff, 0 0 0 4px rgba(74,222,128,0.35);
        z-index: 1;
      }
      /* On narrow screens, shrink the whole badge (icon + curved text)
         proportionally instead of hiding the text, so it still fits
         without overlapping page content. */
      @media (max-width: 480px) {
        #pa-ai-fab-wrap {
          left: 6px;
          bottom: 14px;
          transform: scale(0.72);
          transform-origin: bottom left;
        }
      }
      /* Hide the launcher while the Ask AI panel itself is open, and on
         admin pages (matches prior header-button behavior). */
      body.pa-ai-open #pa-ai-fab-wrap { display: none !important; }
    `;
    document.head.appendChild(style);
  }

  // Curved-text greeting arcing over the top of the avatar icon, Tawk.to
  // style — an SVG <textPath> along a circular arc, no background pill.
  var CURVE_SVG =
    '<svg id="pa-ai-fab-curve" viewBox="0 0 128 118" xmlns="http://www.w3.org/2000/svg">' +
      '<path id="pa-ai-fab-arc" d="M 6,96 A 58,58 0 0 1 122,96" fill="none"/>' +
      '<text><textPath href="#pa-ai-fab-arc" startOffset="50%" text-anchor="middle">We are here!</textPath></text>' +
    '</svg>';

  function buildFab() {
    var wrap = document.createElement('div');
    wrap.id = 'pa-ai-fab-wrap';

    wrap.insertAdjacentHTML('afterbegin', CURVE_SVG);

    var dot = document.createElement('div');
    dot.id = 'pa-ai-fab-dot';
    wrap.appendChild(dot);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'pa-ai-fab-btn';
    btn.title = 'AI Property Assistant';
    btn.setAttribute('aria-label', 'Open Ask AI chat');

    var img = document.createElement('img');
    img.src = AVATAR_SRC;
    img.alt = 'Ask AI';
    btn.appendChild(img);

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (typeof window.__paAskAI === 'function') window.__paAskAI();
    });

    wrap.appendChild(btn);
    return wrap;
  }

  function updateVisibilityForRoute() {
    var wrap = document.getElementById('pa-ai-fab-wrap');
    if (!wrap) return;
    var onAdmin = window.location.pathname.startsWith('/admin');
    wrap.style.display = onAdmin ? 'none' : '';
  }

  function inject() {
    injectStyles();
    if (document.getElementById('pa-ai-fab-wrap')) {
      updateVisibilityForRoute();
      return;
    }
    if (!document.body) return;
    document.body.appendChild(buildFab());
    updateVisibilityForRoute();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
  [500, 1500, 3000].forEach(function (d) { setTimeout(inject, d); });

  new MutationObserver(function () {
    if (!document.getElementById('pa-ai-fab-wrap')) inject();
  }).observe(document.documentElement, { childList: true, subtree: true });

  var _origPush = history.pushState.bind(history);
  history.pushState = function () {
    var ret = _origPush.apply(history, arguments);
    setTimeout(updateVisibilityForRoute, 100);
    return ret;
  };
  window.addEventListener('popstate', function () {
    setTimeout(updateVisibilityForRoute, 100);
  });
})();
