(function () {
  var ATTR = 'data-footer-credit-patch';

  function patch() {
    var footer = document.querySelector('footer');
    if (!footer) return;
    if (footer.querySelector('[' + ATTR + ']')) return; // already injected

    var bar = document.createElement('div');
    bar.setAttribute(ATTR, 'true');
    bar.style.cssText = 'width:100%;text-align:center;padding:8px 0 10px;font-size:13px;color:#aaa;border-top:1px solid rgba(255,255,255,0.1);margin-top:8px;';

    bar.innerHTML = 'Made in \u2764\ufe0f with <a href="https://neodigitalsolutions.com/" target="_blank" rel="noopener noreferrer" style="color:#aaa;text-decoration:underline;text-underline-offset:2px;">https://neodigitalsolutions.com/</a>';

    footer.appendChild(bar);
  }

  var timer;
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(patch, 150);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule);
  } else {
    schedule();
  }

  new MutationObserver(schedule).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
