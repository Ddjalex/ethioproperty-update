(function () {
  var ATTR = 'data-footer-credit-patch';

  var style = document.createElement('style');
  style.textContent = [
    '@keyframes neo-shine {',
    '  0%   { background-position: -200% center; }',
    '  100% { background-position:  200% center; }',
    '}',
    '.neo-link {',
    '  display: inline-block;',
    '  font-weight: 600;',
    '  letter-spacing: 0.02em;',
    '  text-decoration: none;',
    '  background: linear-gradient(90deg, #4ade80 0%, #ffffff 40%, #4ade80 60%, #a3e635 100%);',
    '  background-size: 200% auto;',
    '  -webkit-background-clip: text;',
    '  background-clip: text;',
    '  -webkit-text-fill-color: transparent;',
    '  animation: neo-shine 2.8s linear infinite;',
    '  transition: letter-spacing 0.25s ease;',
    '}',
    '.neo-link:hover {',
    '  letter-spacing: 0.06em;',
    '  animation-duration: 1.2s;',
    '}'
  ].join('\n');
  document.head.appendChild(style);

  function patch() {
    var footer = document.querySelector('footer');
    if (!footer) return;
    if (footer.querySelector('[' + ATTR + ']')) return;

    var bar = document.createElement('div');
    bar.setAttribute(ATTR, 'true');
    bar.style.cssText = 'width:100%;text-align:center;padding:8px 0 10px;font-size:13px;color:#aaa;border-top:1px solid rgba(255,255,255,0.1);margin-top:8px;';

    bar.innerHTML = 'Made in \u2764\ufe0f with <a href="https://neodigitalsolutions.com/" target="_blank" rel="noopener noreferrer" class="neo-link">Neodigitalsolutions</a>';

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
