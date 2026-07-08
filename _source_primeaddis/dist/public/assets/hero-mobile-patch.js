(function () {
  var PATCH_KEY = '__primeAddisHeroMobilePatch_v7__';
  if (window[PATCH_KEY]) return;
  window[PATCH_KEY] = true;

  var style = document.createElement('style');
  style.textContent = `
    @media (max-width: 768px) {
      /* Hero slide container uses h-[600px] — shrink it on mobile */
      .h-\\[600px\\] {
        height: 260px !important;
        min-height: 260px !important;
        max-height: 260px !important;
      }

      /* Outer section wrapper */
      main > section:first-child,
      main > div:first-child {
        max-height: 260px !important;
        overflow: hidden !important;
      }

      /* Any child still declaring 600px inline */
      main > section:first-child [style*="600px"],
      main > div:first-child [style*="600px"] {
        height: 260px !important;
        min-height: 260px !important;
        max-height: 260px !important;
      }

      /* Scale down the hero h1 — it's text-4xl (36px) by default */
      .h-\\[600px\\] h1,
      main > section:first-child h1,
      main > div:first-child h1 {
        font-size: 1.15rem !important;
        line-height: 1.4 !important;
        margin-bottom: 0.5rem !important;
      }

      /* Scale down any buttons/CTAs inside the hero */
      .h-\\[600px\\] a,
      .h-\\[600px\\] button,
      main > section:first-child a,
      main > section:first-child button {
        font-size: 0.8rem !important;
        padding-top: 0.35rem !important;
        padding-bottom: 0.35rem !important;
        padding-left: 0.75rem !important;
        padding-right: 0.75rem !important;
      }

      /* Reduce gap/margin inside the hero overlay */
      .h-\\[600px\\] .flex.flex-col {
        gap: 0.5rem !important;
      }
    }
  `;
  document.head.appendChild(style);

  function clampHero() {
    if (window.innerWidth > 768) return;

    document.querySelectorAll('.h-\\[600px\\]').forEach(function (el) {
      el.style.setProperty('height',     '260px', 'important');
      el.style.setProperty('min-height', '260px', 'important');
      el.style.setProperty('max-height', '260px', 'important');
      el.style.setProperty('overflow',   'hidden', 'important');

      var h1 = el.querySelector('h1');
      if (h1) {
        h1.style.setProperty('font-size',   '1.15rem', 'important');
        h1.style.setProperty('line-height', '1.4',     'important');
        h1.style.setProperty('margin-bottom', '0.5rem', 'important');
      }
    });

    var main = document.querySelector('main');
    if (main && main.firstElementChild) {
      main.firstElementChild.querySelectorAll('[style*="600px"]').forEach(function (el) {
        el.style.setProperty('height',     '260px', 'important');
        el.style.setProperty('min-height', '260px', 'important');
        el.style.setProperty('max-height', '260px', 'important');
      });
    }
  }

  function boot() {
    clampHero();
    setTimeout(clampHero, 200);
    setTimeout(clampHero, 600);
    setTimeout(clampHero, 1500);

    if (document.body) {
      new MutationObserver(function () {
        if (window.innerWidth <= 768) clampHero();
      }).observe(document.body, { childList: true, subtree: true });
    }

    window.addEventListener('resize', clampHero);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
