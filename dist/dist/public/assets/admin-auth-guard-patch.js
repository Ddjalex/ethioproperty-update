(function () {
  function checkAdminAuth() {
    if (!window.location.pathname.startsWith('/admin')) return;
    fetch('/api/user', { credentials: 'include' })
      .then(function (r) {
        if (r.status === 401) {
          window.location.href = '/auth';
        }
      })
      .catch(function () {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAdminAuth);
  } else {
    checkAdminAuth();
  }

  var _lastPath = window.location.pathname;
  setInterval(function () {
    var p = window.location.pathname;
    if (p !== _lastPath) {
      _lastPath = p;
      checkAdminAuth();
    }
  }, 500);
})();
