(function () {
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  function cleanPhone(value) {
    return String(value || '').replace(/[^\d+]/g, '');
  }

  function digitsOnly(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function toTelHref(phone) {
    const cleaned = cleanPhone(phone);
    return cleaned ? 'tel:' + cleaned : 'tel:';
  }

  function toWaHref(phone) {
    const digits = digitsOnly(phone);
    return digits ? 'https://wa.me/' + digits : 'https://wa.me/';
  }

  async function getSettings() {
    try {
      const res = await fetch('/api/site-settings', { credentials: 'same-origin' });
      if (!res.ok) throw new Error('site settings request failed');
      const data = await res.json();
      return data || {};
    } catch (e) {
      return {};
    }
  }

  function ensureStyle() {
    if (qs('#contact-action-buttons-style')) return;
    const style = document.createElement('style');
    style.id = 'contact-action-buttons-style';
    style.textContent = `
      .contact-action-buttons-wrap {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-top: 14px;
        width: 100%;
      }
      .contact-action-buttons-wrap a {
        flex: 1 1 180px;
        min-height: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border-radius: 10px;
        text-decoration: none;
        font-weight: 600;
        font-size: 14px;
        padding: 11px 14px;
        box-sizing: border-box;
        transition: opacity .2s ease, transform .2s ease;
      }
      .contact-action-buttons-wrap a:hover {
        opacity: .92;
        transform: translateY(-1px);
      }
      .contact-action-buttons-wrap .wa-btn {
        background: #25D366;
        color: #fff;
      }
      .contact-action-buttons-wrap .call-btn {
        background: #0f172a;
        color: #fff;
      }
      @media (max-width: 640px) {
        .contact-action-buttons-wrap a {
          flex-basis: 100%;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function findContactSection() {
    const blocks = qsa('section, div');
    for (const el of blocks) {
      const text = (el.innerText || '').toLowerCase();
      if (
        (text.includes('bole road') || text.includes('addis ababa')) &&
        (text.includes('monday') || text.includes('saturday') || text.includes('closed'))
      ) {
        return el.closest('section') || el;
      }
    }
    return null;
  }

  function findSocialRow(root) {
    const socialHints = ['facebook', 'linkedin', 'tiktok', 'youtube', 'instagram', 'telegram', 'x.com', 'twitter'];
    const links = qsa('a', root).filter(function (a) {
      const href = (a.getAttribute('href') || '').toLowerCase();
      return socialHints.some(function (hint) { return href.includes(hint); });
    });

    if (links.length) {
      const parentCount = new Map();
      links.forEach(function (link) {
        const parent = link.parentElement;
        if (parent) parentCount.set(parent, (parentCount.get(parent) || 0) + 1);
      });
      const best = Array.from(parentCount.entries()).sort(function (a, b) { return b[1] - a[1]; })[0];
      if (best) return best[0];
      return links[0].parentElement;
    }

    const blocks = qsa('div', root);
    return blocks.find(function (div) {
      const html = (div.innerHTML || '').toLowerCase();
      const count = socialHints.reduce(function (n, hint) { return n + (html.includes(hint) ? 1 : 0); }, 0);
      return count >= 2;
    }) || null;
  }

  function buildButtons(settings) {
    const existing = qs('.contact-action-buttons-wrap');
    if (existing) existing.remove();

    const primaryPhone = settings.primaryPhone || settings.primary_phone || '';
    const whatsappPhone = settings.whatsappPhone || settings.whatsapp_phone || primaryPhone || '';

    const wrap = document.createElement('div');
    wrap.className = 'contact-action-buttons-wrap';

    const wa = document.createElement('a');
    wa.className = 'wa-btn';
    wa.href = toWaHref(whatsappPhone);
    wa.target = '_blank';
    wa.rel = 'noopener';
    wa.textContent = 'Chat on WhatsApp';

    const call = document.createElement('a');
    call.className = 'call-btn';
    call.href = toTelHref(primaryPhone || whatsappPhone);
    call.textContent = 'Call Us';

    wrap.appendChild(wa);
    wrap.appendChild(call);
    return wrap;
  }

  async function patch() {
    ensureStyle();
    const contactSection = findContactSection();
    if (!contactSection) return;

    const socialRow = findSocialRow(contactSection);
    if (!socialRow || !socialRow.parentElement) return;

    const settings = await getSettings();
    const wrap = buildButtons(settings);
    socialRow.insertAdjacentElement('afterend', wrap);
  }

  let timer;
  function schedulePatch() {
    clearTimeout(timer);
    timer = setTimeout(patch, 250);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedulePatch);
  } else {
    schedulePatch();
  }

  new MutationObserver(schedulePatch).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
