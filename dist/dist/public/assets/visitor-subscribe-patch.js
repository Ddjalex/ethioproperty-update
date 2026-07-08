(function () {
  'use strict';
  var KEY = '__paVisitorSubscribeV3__';
  if (window[KEY]) return;
  window[KEY] = true;
  var DISMISSED = 'pa_subscribe_dismissed_v3';
  var SUBSCRIBED = 'pa_subscribed_v3';
  var GOLD = '#90824B';
  var NAVY = '#0F1729';

  function shouldShow() {
    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/auth')) return false;
    if (localStorage.getItem(SUBSCRIBED) === '1') return false;
    var dismissedAt = Number(localStorage.getItem(DISMISSED) || 0);
    if (dismissedAt && Date.now() - dismissedAt < 86400000) return false;
    return true;
  }

  function closePopup() {
    var backdrop = document.getElementById('pa-subscribe-backdrop');
    var popup = document.getElementById('pa-subscribe-popup');
    if (backdrop) {
      backdrop.style.opacity = '0';
      setTimeout(function () { if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop); }, 300);
    }
    if (popup) {
      popup.style.opacity = '0';
      popup.style.transform = 'translateY(20px) scale(0.97)';
      setTimeout(function () { if (popup && popup.parentNode) popup.parentNode.removeChild(popup); }, 300);
    }
  }

  function dismissPopup() {
    localStorage.setItem(DISMISSED, String(Date.now()));
    closePopup();
  }

  function showPopup() {
    if (!shouldShow() || document.getElementById('pa-subscribe-popup')) return;
    if (!document.body) return;

    /* --- Backdrop (blurs the page) --- */
    var backdrop = document.createElement('div');
    backdrop.id = 'pa-subscribe-backdrop';
    backdrop.style.cssText = [
      'position:fixed;inset:0;z-index:2147483644;',
      'background:rgba(15,23,42,0.45);',
      '-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);',
      'opacity:0;transition:opacity .3s ease;cursor:pointer;'
    ].join('');
    document.body.appendChild(backdrop);
    requestAnimationFrame(function () { backdrop.style.opacity = '1'; });
    backdrop.addEventListener('click', dismissPopup);

    /* --- Popup card --- */
    var wrapper = document.createElement('div');
    wrapper.id = 'pa-subscribe-popup';
    wrapper.style.cssText = [
      'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%) scale(0.97);',
      'z-index:2147483645;width:min(460px,calc(100vw - 32px));',
      'background:#fff;border-radius:20px;',
      'box-shadow:0 24px 60px rgba(15,23,42,.35);',
      'padding:28px 28px 24px;font-family:Arial,sans-serif;',
      'opacity:0;transition:opacity .3s ease,transform .3s ease;'
    ].join('');

    wrapper.innerHTML = [
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:4px;">',
        '<div>',
          '<div style="font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:' + GOLD + ';margin-bottom:8px;">Property Alerts</div>',
          '<h3 style="margin:0 0 8px;font-size:24px;line-height:1.2;color:' + NAVY + ';font-weight:800;">Get new listings by email</h3>',
          '<p style="margin:0 0 18px;color:#4b5563;font-size:14px;line-height:1.5;">Subscribe and we will notify you when Ethio Property adds a new property.</p>',
        '</div>',
        '<button type="button" data-pa-sub-close style="flex-shrink:0;border:none;background:#f3f4f6;color:#374151;width:34px;height:34px;border-radius:50%;font-size:20px;line-height:34px;text-align:center;cursor:pointer;transition:background .2s;">×</button>',
      '</div>',
      '<form data-pa-sub-form style="display:flex;gap:8px;align-items:center;">',
        '<input type="email" name="email" required placeholder="Enter your email" style="flex:1;min-width:0;border:1.5px solid #d1d5db;border-radius:10px;padding:12px 14px;font-size:15px;outline:none;transition:border-color .2s;" ',
          'onfocus="this.style.borderColor=\'' + GOLD + '\'" onblur="this.style.borderColor=\'#d1d5db\'">',
        '<button type="submit" style="border:none;background:' + NAVY + ';color:#fff;border-radius:10px;padding:12px 18px;font-size:15px;font-weight:800;cursor:pointer;white-space:nowrap;transition:opacity .2s;">Subscribe</button>',
      '</form>',
      '<div data-pa-sub-msg style="display:none;margin-top:12px;font-size:13px;border-radius:8px;padding:8px 12px;"></div>',
    ].join('');

    document.body.appendChild(wrapper);

    /* Animate in */
    requestAnimationFrame(function () {
      wrapper.style.opacity = '1';
      wrapper.style.transform = 'translate(-50%,-50%) scale(1)';
    });

    wrapper.querySelector('[data-pa-sub-close]').addEventListener('click', dismissPopup);

    wrapper.querySelector('[data-pa-sub-form]').addEventListener('submit', function (event) {
      event.preventDefault();
      var form = event.currentTarget;
      var email = form.email.value.trim();
      var msg = wrapper.querySelector('[data-pa-sub-msg]');
      var button = form.querySelector('button[type="submit"]');
      if (!email) return;
      button.disabled = true;
      button.style.opacity = '0.6';
      button.textContent = 'Saving…';
      fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: 'Website Visitor',
          email: email,
          phone: 'Not provided',
          propertyInterests: 'New property updates'
        })
      }).then(function (res) {
        return res.json().then(function (body) { return { ok: res.ok, body: body }; });
      }).then(function (result) {
        if (!result.ok) throw new Error(result.body && result.body.message ? result.body.message : 'Subscription failed');
        localStorage.setItem(SUBSCRIBED, '1');
        msg.style.display = 'block';
        msg.style.background = '#ecfdf5';
        msg.style.color = '#047857';
        msg.textContent = result.body.message || 'Thank you for subscribing!';
        form.style.display = 'none';
        setTimeout(closePopup, 2000);
      }).catch(function (error) {
        msg.style.display = 'block';
        msg.style.background = '#fef2f2';
        msg.style.color = '#b91c1c';
        msg.textContent = error.message || 'Could not subscribe. Please try again.';
        button.disabled = false;
        button.style.opacity = '1';
        button.textContent = 'Subscribe';
      });
    });
  }

  /* Safety net: if the popup somehow gets orphaned (e.g. navigation), clean up */
  window.addEventListener('popstate', function () {
    closePopup();
  });

  setTimeout(showPopup, 2500);
})();
