(function () {
  /* ── Inject keyframe + utility CSS ── */
  var style = document.createElement('style');
  style.textContent = `
    /* Fade + slide up on enter */
    .pa-animate {
      opacity: 0;
      transform: translateY(40px);
      transition: opacity 0.65s cubic-bezier(0.22, 1, 0.36, 1),
                  transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);
      will-change: opacity, transform;
    }
    .pa-animate.pa-visible {
      opacity: 1;
      transform: translateY(0);
    }

    /* Fade + slide in from LEFT */
    .pa-animate-left {
      opacity: 0;
      transform: translateX(-50px);
      transition: opacity 0.65s cubic-bezier(0.22, 1, 0.36, 1),
                  transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);
      will-change: opacity, transform;
    }
    .pa-animate-left.pa-visible {
      opacity: 1;
      transform: translateX(0);
    }

    /* Fade + slide in from RIGHT */
    .pa-animate-right {
      opacity: 0;
      transform: translateX(50px);
      transition: opacity 0.65s cubic-bezier(0.22, 1, 0.36, 1),
                  transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);
      will-change: opacity, transform;
    }
    .pa-animate-right.pa-visible {
      opacity: 1;
      transform: translateX(0);
    }

    /* Stagger delay helpers */
    .pa-delay-1 { transition-delay: 0.1s !important; }
    .pa-delay-2 { transition-delay: 0.2s !important; }
    .pa-delay-3 { transition-delay: 0.3s !important; }
    .pa-delay-4 { transition-delay: 0.4s !important; }
    .pa-delay-5 { transition-delay: 0.5s !important; }
    .pa-delay-6 { transition-delay: 0.6s !important; }

    /* Navbar smooth box-shadow on scroll */
    .pa-nav-scrolled {
      box-shadow: 0 2px 20px rgba(0,0,0,0.12) !important;
      backdrop-filter: blur(12px) !important;
      transition: box-shadow 0.3s ease, backdrop-filter 0.3s ease !important;
    }
  `;
  document.head.appendChild(style);

  /* ── Intersection Observer ── */
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('pa-visible');
      } else {
        /* Remove on scroll away so they re-animate when scrolled back */
        entry.target.classList.remove('pa-visible');
      }
    });
  }, { threshold: 0.12 });

  /* ── Tag elements once the React app has rendered ── */
  function tagElements() {
    /* --- Cards (property cards, feature cards, blog cards, etc.) --- */
    var cards = document.querySelectorAll(
      '[class*="card"]:not(.pa-animate):not(.pa-animate-left):not(.pa-animate-right), ' +
      '[class*="Card"]:not(.pa-animate):not(.pa-animate-left):not(.pa-animate-right)'
    );
    cards.forEach(function (el, i) {
      if (el.closest('.pa-animate, .pa-animate-left, .pa-animate-right')) return;
      el.classList.add('pa-animate');
      var delay = (i % 4) + 1;
      if (delay <= 6) el.classList.add('pa-delay-' + delay);
      observer.observe(el);
    });

    /* --- Section headings --- */
    var headings = document.querySelectorAll(
      'h1:not(.pa-animate), h2:not(.pa-animate), h3:not(.pa-animate)'
    );
    headings.forEach(function (el) {
      if (el.closest('.pa-animate')) return;
      el.classList.add('pa-animate');
      observer.observe(el);
    });

    /* --- Sections / top-level content blocks --- */
    var sections = document.querySelectorAll(
      'section:not(.pa-animate), ' +
      'article:not(.pa-animate)'
    );
    sections.forEach(function (el) {
      if (el.closest('.pa-animate')) return;
      el.classList.add('pa-animate');
      observer.observe(el);
    });

    /* --- Buttons in hero / CTA areas --- */
    var buttons = document.querySelectorAll(
      'button:not(.pa-animate)[class*="btn"], ' +
      'a:not(.pa-animate)[class*="btn"]'
    );
    buttons.forEach(function (el, i) {
      if (el.closest('.pa-animate')) return;
      el.classList.add('pa-animate');
      if (i % 2 === 1) el.classList.add('pa-delay-2');
      observer.observe(el);
    });

    /* --- Images --- */
    var images = document.querySelectorAll(
      'img:not(.pa-animate)[class*="property"], ' +
      'img:not(.pa-animate)[class*="hero"], ' +
      'img:not(.pa-animate)[class*="banner"]'
    );
    images.forEach(function (el) {
      if (el.closest('.pa-animate')) return;
      el.classList.add('pa-animate');
      observer.observe(el);
    });

    /* --- Alternate left/right for sibling grid items --- */
    var grids = document.querySelectorAll('[class*="grid"], [class*="Grid"]');
    grids.forEach(function (grid) {
      var children = Array.from(grid.children);
      children.forEach(function (child, i) {
        if (child.classList.contains('pa-animate') ||
            child.classList.contains('pa-animate-left') ||
            child.classList.contains('pa-animate-right')) return;
        if (i % 2 === 0) {
          child.classList.add('pa-animate-left');
        } else {
          child.classList.add('pa-animate-right');
        }
        var delay = (i % 4) + 1;
        if (delay <= 6) child.classList.add('pa-delay-' + delay);
        observer.observe(child);
      });
    });
  }

  /* ── Navbar scroll shadow ── */
  function handleNavScroll() {
    var nav = document.querySelector('nav, header');
    if (!nav) return;
    if (window.scrollY > 10) {
      nav.classList.add('pa-nav-scrolled');
    } else {
      nav.classList.remove('pa-nav-scrolled');
    }
  }
  window.addEventListener('scroll', handleNavScroll, { passive: true });

  /* ── Wait for React to render, then run once + watch for route changes ── */
  var initDone = false;
  var mutObs = new MutationObserver(function () {
    tagElements();
    if (!initDone) {
      initDone = true;
      handleNavScroll();
    }
  });

  function init() {
    mutObs.observe(document.body, { childList: true, subtree: true });
    tagElements();
    handleNavScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
