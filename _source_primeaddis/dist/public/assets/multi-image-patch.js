// multi-image-patch.js
// Adds multi-image upload to admin property form and a manual slideshow on property detail pages.

(function () {
  var KEY = '__paMultiImagePatch_v2__';
  if (window[KEY]) return;
  window[KEY] = true;

  /* ── UTILS ── */
  function isAdminPropertyForm() {
    var p = location.pathname;
    return /\/admin\/properties\/(add|new|create|\d+\/edit|edit\/\d+)/i.test(p) ||
           /\/admin\/properties\/(add|new)$/i.test(p);
  }
  function isPropertyDetail() {
    // Matches /properties/10 or /properties/10-some-slug
    return /^\/properties\/\d+/i.test(location.pathname);
  }
  function getPropertyIdFromUrl() {
    // Extract leading number from /properties/10 or /properties/10-some-slug
    var m = location.pathname.match(/^\/properties\/(\d+)/i);
    return m ? m[1] : null;
  }

  /* ── STYLES ── */
  function ensureStyles() {
    if (document.getElementById('multi-image-patch-style')) return;
    var s = document.createElement('style');
    s.id = 'multi-image-patch-style';
    s.textContent = `
      /* ── Suppress original React carousel when our slideshow is active ── */
      body.pa-slideshow-active .relative.mb-6.rounded-xl.overflow-hidden:not(#pa-slideshow-wrap):not([id="pa-slideshow-wrap"]) {
        display: none !important;
      }

      /* ── Admin multi-upload ── */
      #pa-multi-upload-wrap {
        margin-top: 16px;
        padding: 16px;
        border: 2px dashed #cbd5e1;
        border-radius: 10px;
        background: #f8fafc;
      }
      #pa-multi-upload-wrap h4 {
        font-size: 14px;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 10px;
      }
      #pa-multi-upload-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        background: #1B2A4A;
        color: #fff;
        border: none;
        border-radius: 7px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      }
      #pa-multi-upload-btn:hover { background: #253d6e; }
      #pa-multi-upload-btn:disabled { background: #94a3b8; cursor: not-allowed; }
      #pa-multi-upload-input { display: none; }
      #pa-multi-upload-status {
        font-size: 12px;
        color: #64748b;
        margin-top: 6px;
        min-height: 18px;
      }
      #pa-admin-thumb-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 12px;
      }
      .pa-admin-thumb-item {
        position: relative;
        width: 80px;
        height: 80px;
        border-radius: 8px;
        overflow: hidden;
        border: 2px solid #e2e8f0;
        background: #f1f5f9;
        flex-shrink: 0;
      }
      .pa-admin-thumb-item img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .pa-admin-thumb-delete {
        position: absolute;
        top: 2px;
        right: 2px;
        width: 20px;
        height: 20px;
        background: rgba(220,38,38,0.92);
        border: none;
        border-radius: 50%;
        color: #fff;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        line-height: 1;
      }
      .pa-admin-thumb-delete:hover { background: #dc2626; }

      /* ── Property detail slideshow ── */
      #pa-slideshow-wrap {
        position: relative;
        background: #0f172a;
        border-radius: 12px;
        overflow: hidden;
        margin-bottom: 24px;
      }
      #pa-slide-main {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 320px;
        max-height: 480px;
        overflow: hidden;
        position: relative;
        background: #0f172a;
      }
      #pa-slide-img {
        max-width: 100%;
        max-height: 100%;
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
        transition: opacity 0.25s ease;
      }
      .pa-slide-btn {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(255,255,255,0.18);
        border: none;
        color: #fff;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        font-size: 20px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
        z-index: 10;
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        user-select: none;
      }
      .pa-slide-btn:hover { background: rgba(255,255,255,0.38); }
      #pa-slide-prev { left: 12px; }
      #pa-slide-next { right: 12px; }
      #pa-slide-counter {
        position: absolute;
        bottom: 12px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.6);
        color: #fff;
        font-size: 12px;
        font-weight: 600;
        padding: 3px 12px;
        border-radius: 20px;
        pointer-events: none;
        white-space: nowrap;
      }
      #pa-thumb-strip {
        display: flex;
        gap: 6px;
        padding: 8px 12px;
        overflow-x: auto;
        background: rgba(0,0,0,0.45);
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,0.25) transparent;
      }
      .pa-thumb-strip-item {
        width: 64px;
        height: 48px;
        border-radius: 6px;
        overflow: hidden;
        flex-shrink: 0;
        cursor: pointer;
        border: 2px solid transparent;
        opacity: 0.6;
        transition: opacity 0.2s, border-color 0.2s;
      }
      .pa-thumb-strip-item.pa-active {
        border-color: #C4922A;
        opacity: 1;
      }
      .pa-thumb-strip-item img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
    `;
    document.head.appendChild(s);
  }

  /* ══════════════════════════════════════════
     ADMIN FORM — MULTI IMAGE UPLOAD WIDGET
  ══════════════════════════════════════════ */
  var adminInjected = false;

  function injectAdminWidget() {
    if (!isAdminPropertyForm()) return;
    if (document.getElementById('pa-multi-upload-wrap')) return;

    var fileInput = document.querySelector('input[type="file"][accept*="image"]');
    if (!fileInput) return;

    ensureStyles();

    var container = fileInput.closest('div') || fileInput.parentElement;
    // Walk up 3 levels to find a sensible insertion point
    var insertAfter = container;
    for (var i = 0; i < 3 && insertAfter && insertAfter.parentElement; i++) {
      insertAfter = insertAfter.parentElement;
    }

    var wrap = document.createElement('div');
    wrap.id = 'pa-multi-upload-wrap';
    wrap.innerHTML = `
      <h4>📸 Upload Multiple Images at Once</h4>
      <button type="button" id="pa-multi-upload-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        Select Images (up to 20)
      </button>
      <input type="file" id="pa-multi-upload-input" accept="image/jpeg,image/png,image/webp" multiple />
      <div id="pa-multi-upload-status"></div>
      <div id="pa-admin-thumb-grid"></div>
    `;

    insertAfter.parentNode
      ? insertAfter.parentNode.insertBefore(wrap, insertAfter.nextSibling)
      : document.body.appendChild(wrap);

    var btn    = document.getElementById('pa-multi-upload-btn');
    var input  = document.getElementById('pa-multi-upload-input');
    var status = document.getElementById('pa-multi-upload-status');
    var grid   = document.getElementById('pa-admin-thumb-grid');

    btn.addEventListener('click', function () { input.click(); });

    input.addEventListener('change', async function () {
      var files = Array.from(input.files || []);
      if (!files.length) return;

      // Filter oversized
      var oversized = files.filter(function (f) { return f.size > 5 * 1024 * 1024; });
      if (oversized.length) {
        status.textContent = '⚠️ ' + oversized.length + ' file(s) over 5MB skipped.';
        files = files.filter(function (f) { return f.size <= 5 * 1024 * 1024; });
      }
      if (!files.length) return;

      btn.disabled = true;
      status.textContent = '⏳ Uploading ' + files.length + ' image(s)…';

      try {
        var fd = new FormData();
        files.forEach(function (f) { fd.append('images', f); });

        var res = await fetch('/api/upload-images', {
          method: 'POST',
          body: fd,
          credentials: 'include'
        });
        if (!res.ok) throw new Error('Server responded ' + res.status);
        var data = await res.json();
        var urls = data.urls || [];

        // Inject each URL into the React form via the URL input + Add button
        injectUrlsIntoForm(urls);

        // Also show local thumbnails
        urls.forEach(function (url) { addAdminThumb(url, grid); });

        status.textContent = '✅ ' + urls.length + ' image(s) added!';
        setTimeout(function () { status.textContent = ''; }, 3000);
      } catch (err) {
        status.textContent = '❌ Upload failed: ' + err.message;
      } finally {
        btn.disabled = false;
        input.value = '';
      }
    });

    adminInjected = true;
  }

  function injectUrlsIntoForm(urls) {
    var urlInput = document.querySelector('input[placeholder*="http"], input[placeholder*="URL"], input[placeholder*="url"], input[placeholder*="Image URL"]');
    if (!urlInput) return;

    var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;

    urls.forEach(function (url) {
      // Set value via React's native setter so React state updates
      nativeSetter.call(urlInput, url);
      urlInput.dispatchEvent(new Event('input', { bubbles: true }));

      // Find and click the Add button near the URL input
      var addBtn = findAddButton(urlInput);
      if (addBtn) {
        addBtn.click();
      }
    });
  }

  function findAddButton(input) {
    // Look for a button sibling or nearby
    var parent = input.parentElement;
    for (var depth = 0; depth < 4 && parent; depth++) {
      var btns = Array.from(parent.querySelectorAll('button[type="button"]'));
      var found = btns.find(function (b) {
        var txt = (b.textContent || '').toLowerCase();
        return txt.includes('add') || txt.includes('+') || txt.includes('upload');
      });
      if (found) return found;
      parent = parent.parentElement;
    }
    return null;
  }

  function addAdminThumb(url, grid) {
    var item = document.createElement('div');
    item.className = 'pa-admin-thumb-item';
    var img = document.createElement('img');
    img.src = url;
    img.alt = 'Property image';
    img.loading = 'lazy';
    var del = document.createElement('button');
    del.className = 'pa-admin-thumb-delete';
    del.type = 'button';
    del.title = 'Remove';
    del.textContent = '×';
    del.addEventListener('click', function () { item.remove(); });
    item.appendChild(img);
    item.appendChild(del);
    grid.appendChild(item);
  }

  /* ═══════════════════════════════════════════
     PROPERTY DETAIL PAGE — IMAGE SLIDESHOW
  ═══════════════════════════════════════════ */
  var slideshowInjected = false;
  var currentSlide = 0;
  var allImages = [];

  function injectSlideshow() {
    if (!isPropertyDetail()) return;
    if (document.getElementById('pa-slideshow-wrap')) return;
    // Set flag immediately to prevent duplicate calls from MutationObserver
    if (slideshowInjected) return;
    slideshowInjected = true;

    var propId = getPropertyIdFromUrl();
    if (!propId) { slideshowInjected = false; return; }

    // Fetch property data to get all image URLs
    fetch('/api/properties/' + propId, { credentials: 'include' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (property) {
        if (!property) { slideshowInjected = false; return; }

        var images = (property.images || []).filter(Boolean);
        if (images.length < 2) { slideshowInjected = false; return; } // No need for slideshow with 0-1 images

        allImages = images;
        currentSlide = 0;

        ensureStyles();
        buildSlideshow(images, property.title || 'Property');
      })
      .catch(function () { slideshowInjected = false; });
  }

  function hideAllOriginalCarousels() {
    // Hide every instance of the React carousel container — including any
    // that React re-renders after our slideshow is injected.
    document.querySelectorAll('.relative.mb-6.rounded-xl.overflow-hidden').forEach(function (el) {
      if (el.id !== 'pa-slideshow-wrap' && !el.closest('#pa-slideshow-wrap')) {
        el.style.setProperty('display', 'none', 'important');
      }
    });
  }

  function buildSlideshow(images, title) {
    // Target the exact outer container rendered by the React bundle:
    //   <div class="relative mb-6 rounded-xl overflow-hidden"> … <Carousel> … </div>
    // We must hide THIS element (not a nested child) to kill the duplicate.
    var target = document.querySelector('.relative.mb-6.rounded-xl.overflow-hidden');

    // Fallback: walk up from any carousel-related child
    if (!target) {
      var inner = document.querySelector('[data-slot="carousel"], [class*="embla__container"], [class*="CarouselContent"]');
      if (inner) {
        var el = inner;
        while (el && el.parentElement) {
          if (el.classList.contains('relative') && el.classList.contains('mb-6')) { target = el; break; }
          el = el.parentElement;
        }
      }
    }

    if (!target) return;

    var thumbsHtml = images.map(function (src, i) {
      return '<div class="pa-thumb-strip-item' + (i === 0 ? ' pa-active' : '') +
             '" data-idx="' + i + '" role="button" aria-label="Image ' + (i + 1) + '">' +
             '<img src="' + src + '" alt="Thumbnail ' + (i + 1) + '" loading="lazy" /></div>';
    }).join('');

    var wrap = document.createElement('div');
    wrap.id = 'pa-slideshow-wrap';
    wrap.innerHTML =
      '<div id="pa-slide-main">' +
        '<img id="pa-slide-img" src="' + images[0] + '" alt="' + title + ' - Image 1" />' +
        '<button class="pa-slide-btn" id="pa-slide-prev" aria-label="Previous image">&#8592;</button>' +
        '<button class="pa-slide-btn" id="pa-slide-next" aria-label="Next image">&#8594;</button>' +
        '<span id="pa-slide-counter">1 / ' + images.length + '</span>' +
      '</div>' +
      '<div id="pa-thumb-strip">' + thumbsHtml + '</div>';

    // Insert my slideshow before the original carousel container, then hide it
    if (target.parentNode) {
      target.parentNode.insertBefore(wrap, target);
    }
    // Mark body so CSS rule suppresses the original carousel globally
    document.body.classList.add('pa-slideshow-active');
    // Hide the primary target
    target.style.setProperty('display', 'none', 'important');
    // Also sweep the whole page to hide any other matching carousel containers
    hideAllOriginalCarousels();

    var slideImg  = document.getElementById('pa-slide-img');
    var counter   = document.getElementById('pa-slide-counter');
    var prevBtn   = document.getElementById('pa-slide-prev');
    var nextBtn   = document.getElementById('pa-slide-next');
    var thumbStrip = document.getElementById('pa-thumb-strip');

    function goTo(idx) {
      currentSlide = ((idx % images.length) + images.length) % images.length;
      slideImg.style.opacity = '0';
      setTimeout(function () {
        slideImg.src = images[currentSlide];
        slideImg.alt = title + ' - Image ' + (currentSlide + 1);
        slideImg.style.opacity = '1';
        counter.textContent = (currentSlide + 1) + ' / ' + images.length;
        Array.from(thumbStrip.querySelectorAll('.pa-thumb-strip-item')).forEach(function (t, i) {
          t.classList.toggle('pa-active', i === currentSlide);
        });
        // Scroll active thumbnail into view
        var activeThumb = thumbStrip.querySelector('.pa-thumb-strip-item.pa-active');
        if (activeThumb) activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }, 180);
    }

    prevBtn.addEventListener('click', function () { goTo(currentSlide - 1); });
    nextBtn.addEventListener('click', function () { goTo(currentSlide + 1); });

    thumbStrip.addEventListener('click', function (e) {
      var item = e.target.closest('.pa-thumb-strip-item');
      if (item) goTo(parseInt(item.dataset.idx, 10));
    });

    // Swipe support (touch)
    var touchStartX = 0;
    wrap.addEventListener('touchstart', function (e) { touchStartX = e.touches[0].clientX; }, { passive: true });
    wrap.addEventListener('touchend', function (e) {
      var diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) goTo(diff > 0 ? currentSlide + 1 : currentSlide - 1);
    }, { passive: true });

    // Keyboard nav
    document.addEventListener('keydown', function (e) {
      if (!document.getElementById('pa-slideshow-wrap')) return;
      if (e.key === 'ArrowLeft')  goTo(currentSlide - 1);
      if (e.key === 'ArrowRight') goTo(currentSlide + 1);
    });

    slideshowInjected = true;
  }

  /* ── ROUTE OBSERVER ── */
  function runPatches() {
    ensureStyles();
    if (isAdminPropertyForm()) injectAdminWidget();
    if (isPropertyDetail() && !slideshowInjected) setTimeout(injectSlideshow, 900);
    // Continuously suppress the original carousel if our slideshow is present
    if (isPropertyDetail() && document.getElementById('pa-slideshow-wrap')) {
      hideAllOriginalCarousels();
    }
  }

  var lastPath = location.pathname;

  function resetOnNavigate() {
    lastPath = location.pathname;
    adminInjected = false;
    slideshowInjected = false;
    currentSlide = 0;
    allImages = [];
    // Remove body class when leaving a property detail page
    if (!isPropertyDetail()) {
      document.body.classList.remove('pa-slideshow-active');
    }
  }

  new MutationObserver(function () {
    if (!isAdminPropertyForm()) adminInjected = false;
    if (location.pathname !== lastPath) resetOnNavigate();
    runPatches();
  }).observe(document.documentElement, { childList: true, subtree: true });

  setInterval(function () {
    if (location.pathname !== lastPath) {
      resetOnNavigate();
      runPatches();
    }
  }, 500);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runPatches);
  } else {
    runPatches();
  }
})();
