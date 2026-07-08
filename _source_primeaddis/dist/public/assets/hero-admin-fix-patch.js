(function () {
  var PATCH_KEY = '__primeAddisHeroAdminFix_v1__';
  if (window[PATCH_KEY]) return;
  window[PATCH_KEY] = true;

  var style = document.createElement('style');
  style.textContent = `
    #haf-overlay {
      position: fixed; inset: 0; z-index: 9500;
      background: rgba(0,0,0,.55);
      display: flex; align-items: flex-start; justify-content: center;
      overflow-y: auto; padding: 40px 16px;
    }
    #haf-modal {
      background: #fff; border-radius: 16px; width: 100%; max-width: 700px;
      padding: 32px; box-shadow: 0 20px 60px rgba(0,0,0,.25); margin: auto;
    }
    #haf-modal h2 { font-size: 1.4rem; font-weight: 800; color: #0f172a; margin: 0 0 6px; }
    #haf-modal .haf-sub { font-size: 14px; color: #64748b; margin-bottom: 24px; }
    .haf-field { margin-bottom: 16px; }
    .haf-field label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 5px; }
    .haf-field input[type="text"], .haf-field input[type="number"], .haf-field textarea {
      width: 100%; box-sizing: border-box;
      border: 1.5px solid #e2e8f0; border-radius: 8px;
      padding: 9px 12px; font-size: 14px; color: #1e293b;
      background: #fff; outline: none; transition: border-color .2s;
    }
    .haf-field input:focus, .haf-field textarea:focus { border-color: #1d4ed8; }
    .haf-field textarea { min-height: 80px; resize: vertical; }
    .haf-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .haf-check { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #374151; cursor: pointer; }
    .haf-check input { width: auto; margin: 0; accent-color: #1d4ed8; }
    .haf-upload-row { display: flex; gap: 8px; align-items: center; }
    .haf-upload-row input[type="text"] { flex: 1; }
    .haf-upload-btn {
      padding: 9px 14px; border-radius: 8px; border: 1.5px solid #e2e8f0;
      background: #f8fafc; font-size: 13px; font-weight: 600; cursor: pointer;
      white-space: nowrap; color: #374151;
    }
    .haf-upload-btn:hover { background: #e2e8f0; }
    .haf-preview { margin-top: 8px; }
    .haf-preview img { max-height: 120px; max-width: 100%; object-fit: contain; border-radius: 8px; border: 1px solid #e2e8f0; padding: 4px; background: #f8fafc; }
    .haf-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 24px; }
    .haf-btn { padding: 9px 22px; border-radius: 8px; font-size: 14px; font-weight: 600; border: none; cursor: pointer; transition: opacity .2s; }
    .haf-btn:hover { opacity: .85; }
    .haf-btn-primary { background: #1B2A4A; color: #fff; }
    .haf-btn-cancel  { background: #f1f5f9; color: #374151; }
    .haf-btn-danger  { background: #ef4444; color: #fff; }
    .haf-btn-sm { padding: 5px 12px; font-size: 12px; border-radius: 6px; border: none; cursor: pointer; font-weight: 600; }
    .haf-table { width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 16px; }
    .haf-table th { text-align: left; padding: 10px 12px; background: #f8fafc; font-weight: 700; font-size: 12px; letter-spacing: .05em; text-transform: uppercase; color: #64748b; border-bottom: 1.5px solid #e2e8f0; }
    .haf-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; color: #1e293b; }
    .haf-table tr:hover td { background: #f8fafc; }
    .haf-thumb { height: 44px; max-width: 90px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0; background: #f8fafc; }
    .haf-badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; }
    .haf-badge-green { background: #dcfce7; color: #16a34a; }
    .haf-badge-gray  { background: #f1f5f9; color: #64748b; }
    .haf-spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%; animation: haf-spin .6s linear infinite; vertical-align: middle; margin-right: 6px; }
    @keyframes haf-spin { to { transform: rotate(360deg); } }
    .haf-error { background: #fef2f2; border: 1px solid #fca5a5; color: #991b1b; border-radius: 8px; padding: 10px 14px; font-size: 13px; margin-bottom: 16px; }
    .haf-success { background: #f0fdf4; border: 1px solid #86efac; color: #166534; border-radius: 8px; padding: 10px 14px; font-size: 13px; margin-bottom: 16px; }
    #haf-list-modal { background: #fff; border-radius: 16px; width: 100%; max-width: 860px; padding: 32px; box-shadow: 0 20px 60px rgba(0,0,0,.25); margin: auto; }
    #haf-list-modal h2 { font-size: 1.4rem; font-weight: 800; color: #0f172a; margin: 0 0 6px; }
    .haf-list-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .haf-empty { text-align: center; padding: 40px; color: #94a3b8; font-size: 14px; }
  `;
  document.head.appendChild(style);

  var hiddenFileInput = document.createElement('input');
  hiddenFileInput.type = 'file';
  hiddenFileInput.accept = 'image/*';
  hiddenFileInput.style.display = 'none';
  function appendFileInput() {
    if (document.body) { document.body.appendChild(hiddenFileInput); }
    else { document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(hiddenFileInput); }); }
  }
  appendFileInput();

  var currentImageUrlTarget = null;
  var currentPreviewTarget = null;

  hiddenFileInput.addEventListener('change', function () {
    var file = hiddenFileInput.files && hiddenFileInput.files[0];
    if (!file) return;
    var fd = new FormData();
    fd.append('image', file);
    var btn = document.getElementById('haf-upload-trigger');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="haf-spinner"></span>Uploading…'; }
    fetch('/api/upload-image', { method: 'POST', credentials: 'include', body: fd })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.url && currentImageUrlTarget) {
          currentImageUrlTarget.value = data.url;
          if (currentPreviewTarget) {
            currentPreviewTarget.innerHTML = '<img src="' + data.url + '" />';
          }
          showMsg('haf-form-msg', 'Image uploaded successfully.', 'success');
        } else {
          showMsg('haf-form-msg', data.message || 'Upload failed.', 'error');
        }
      })
      .catch(function (e) { showMsg('haf-form-msg', 'Upload failed: ' + e.message, 'error'); })
      .finally(function () {
        if (btn) { btn.disabled = false; btn.innerHTML = 'Upload File'; }
        hiddenFileInput.value = '';
      });
  });

  function showMsg(id, text, type) {
    var el = document.getElementById(id);
    if (!el) return;
    el.className = type === 'success' ? 'haf-success' : 'haf-error';
    el.textContent = text;
    el.style.display = 'block';
    setTimeout(function () { el.style.display = 'none'; }, 4000);
  }

  function api(method, url, body) {
    var opts = { method: method, credentials: 'include', headers: {} };
    if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    return fetch(url, opts).then(function (r) {
      if (!r.ok) return r.json().then(function (d) { throw new Error(d.message || r.statusText); });
      return r.status === 204 ? null : r.json();
    });
  }

  window.primeAddisOpenHeroManager = function () { openListModal(); };
  document.addEventListener('primeAddisOpenHeroManager', function () { openListModal(); });
  document.addEventListener('click', function (e) {
    if (e.target && e.target.closest('[data-open-hero-manager]')) { openListModal(); }
  });

  function openListModal() {
    var existing = document.getElementById('haf-overlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'haf-overlay';
    overlay.innerHTML = '<div id="haf-list-modal"><h2>Hero Images</h2><p class="haf-sub">Manage the slideshow images shown at the top of the homepage.</p><div id="haf-list-msg" style="display:none"></div><div class="haf-list-actions"><span id="haf-count" style="font-size:13px;color:#64748b"></span><button class="haf-btn haf-btn-primary" id="haf-add-btn">+ Add Hero Image</button></div><div id="haf-table-wrap"><div class="haf-empty">Loading…</div></div><div class="haf-actions"><button class="haf-btn haf-btn-cancel" id="haf-close-list">Close</button></div></div>';
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeAll(); });
    document.getElementById('haf-close-list').addEventListener('click', closeAll);
    document.getElementById('haf-add-btn').addEventListener('click', function () { openFormModal(null); });

    loadList();
  }

  function loadList() {
    var wrap = document.getElementById('haf-table-wrap');
    if (!wrap) return;
    api('GET', '/api/admin/hero-images').then(function (items) {
      var count = document.getElementById('haf-count');
      if (count) count.textContent = items.length + ' image(s)';
      if (!items.length) {
        wrap.innerHTML = '<div class="haf-empty">No hero images yet. Click "+ Add Hero Image" to add one.</div>';
        return;
      }
      var rows = items.map(function (img) {
        return '<tr data-id="' + img.id + '">' +
          '<td>' + (img.imageUrl ? '<img class="haf-thumb" src="' + escHtml(img.imageUrl) + '" onerror="this.style.display=\'none\'" />' : '—') + '</td>' +
          '<td>' + escHtml(img.title || '—') + '</td>' +
          '<td>' + (img.active ? '<span class="haf-badge haf-badge-green">Active</span>' : '<span class="haf-badge haf-badge-gray">Inactive</span>') + '</td>' +
          '<td>' + (img.displayOrder || 0) + '</td>' +
          '<td style="white-space:nowrap">' +
            '<button class="haf-btn-sm" style="background:#e0e7ff;color:#3730a3;margin-right:4px" data-action="edit" data-id="' + img.id + '">Edit</button>' +
            '<button class="haf-btn-sm" style="background:' + (img.active ? '#fef9c3;color:#854d0e' : '#dcfce7;color:#166534') + '" data-action="toggle" data-id="' + img.id + '" data-active="' + img.active + '">' + (img.active ? 'Deactivate' : 'Activate') + '</button>' +
            '<button class="haf-btn-sm" style="background:#fee2e2;color:#991b1b;margin-left:4px" data-action="delete" data-id="' + img.id + '">Delete</button>' +
          '</td>' +
        '</tr>';
      }).join('');
      wrap.innerHTML = '<table class="haf-table"><thead><tr><th>Image</th><th>Title</th><th>Status</th><th>Order</th><th>Actions</th></tr></thead><tbody>' + rows + '</tbody></table>';

      wrap.querySelectorAll('[data-action="edit"]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = parseInt(this.getAttribute('data-id'));
          var img = items.find(function (i) { return i.id === id; });
          if (img) openFormModal(img);
        });
      });
      wrap.querySelectorAll('[data-action="toggle"]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = parseInt(this.getAttribute('data-id'));
          var active = this.getAttribute('data-active') === 'true';
          api('PATCH', '/api/admin/hero-images/' + id, { active: !active })
            .then(function () { showMsg('haf-list-msg', 'Status updated.', 'success'); loadList(); })
            .catch(function (e) { showMsg('haf-list-msg', 'Error: ' + e.message, 'error'); });
        });
      });
      wrap.querySelectorAll('[data-action="delete"]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = parseInt(this.getAttribute('data-id'));
          if (!confirm('Delete this hero image? This cannot be undone.')) return;
          api('DELETE', '/api/admin/hero-images/' + id)
            .then(function () { showMsg('haf-list-msg', 'Deleted.', 'success'); loadList(); })
            .catch(function (e) { showMsg('haf-list-msg', 'Error: ' + e.message, 'error'); });
        });
      });
    }).catch(function (e) {
      wrap.innerHTML = '<div class="haf-empty" style="color:#991b1b">Failed to load hero images: ' + escHtml(e.message) + '</div>';
    });
  }

  function openFormModal(img) {
    var existing = document.getElementById('haf-overlay');
    if (existing) existing.remove();

    var isEdit = !!img;
    var overlay = document.createElement('div');
    overlay.id = 'haf-overlay';
    overlay.innerHTML = '<div id="haf-modal">' +
      '<h2>' + (isEdit ? 'Edit Hero Image' : 'Add Hero Image') + '</h2>' +
      '<p class="haf-sub">' + (isEdit ? 'Update the image details below.' : 'Fill in the details for the new hero image.') + '</p>' +
      '<div id="haf-form-msg" style="display:none"></div>' +
      '<div class="haf-field"><label>Image URL <span style="color:#ef4444">*</span></label>' +
        '<div class="haf-upload-row">' +
          '<input type="text" id="haf-img-url" placeholder="https://... or /uploads/..." value="' + escAttr(img ? (img.imageUrl || '') : '') + '" />' +
          '<button class="haf-upload-btn" id="haf-upload-trigger">Upload File</button>' +
        '</div>' +
        '<div class="haf-preview" id="haf-preview">' + (img && img.imageUrl ? '<img src="' + escHtml(img.imageUrl) + '" />' : '') + '</div>' +
      '</div>' +
      '<div class="haf-row">' +
        '<div class="haf-field"><label>Title</label><input type="text" id="haf-title" placeholder="Slide title (optional)" value="' + escAttr(img ? (img.title || '') : '') + '" /></div>' +
        '<div class="haf-field"><label>Display Order</label><input type="number" id="haf-order" min="0" value="' + (img ? (img.displayOrder || 0) : 0) + '" /></div>' +
      '</div>' +
      '<div class="haf-field"><label>Description</label><textarea id="haf-desc" placeholder="Optional description">' + escHtml(img ? (img.description || '') : '') + '</textarea></div>' +
      '<div class="haf-field"><label class="haf-check"><input type="checkbox" id="haf-active" ' + (!img || img.active ? 'checked' : '') + ' /> Active (show on homepage)</label></div>' +
      '<div class="haf-actions">' +
        (isEdit ? '<button class="haf-btn haf-btn-cancel" id="haf-back-btn">← Back</button>' : '') +
        '<button class="haf-btn haf-btn-cancel" id="haf-cancel-btn">Cancel</button>' +
        '<button class="haf-btn haf-btn-primary" id="haf-save-btn">Save Changes</button>' +
      '</div>' +
    '</div>';
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeAll(); });
    document.getElementById('haf-cancel-btn').addEventListener('click', closeAll);
    if (isEdit) {
      document.getElementById('haf-back-btn').addEventListener('click', function () { closeAll(); openListModal(); });
    }

    currentImageUrlTarget = document.getElementById('haf-img-url');
    currentPreviewTarget = document.getElementById('haf-preview');

    document.getElementById('haf-upload-trigger').addEventListener('click', function () {
      hiddenFileInput.click();
    });

    document.getElementById('haf-img-url').addEventListener('input', function () {
      var val = this.value.trim();
      currentPreviewTarget.innerHTML = val ? '<img src="' + escHtml(val) + '" onerror="this.style.display=\'none\'" />' : '';
    });

    document.getElementById('haf-save-btn').addEventListener('click', function () {
      var imageUrl = document.getElementById('haf-img-url').value.trim();
      if (!imageUrl) {
        showMsg('haf-form-msg', 'Image URL is required. Please enter a URL or upload a file.', 'error');
        return;
      }
      var data = {
        imageUrl: imageUrl,
        title: document.getElementById('haf-title').value.trim() || '',
        description: document.getElementById('haf-desc').value.trim() || '',
        active: document.getElementById('haf-active').checked,
        displayOrder: parseInt(document.getElementById('haf-order').value) || 0
      };

      var saveBtn = document.getElementById('haf-save-btn');
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="haf-spinner"></span>Saving…';

      var method = isEdit ? 'PATCH' : 'POST';
      var url = isEdit ? '/api/admin/hero-images/' + img.id : '/api/admin/hero-images';

      api(method, url, data)
        .then(function () {
          showMsg('haf-form-msg', 'Hero image ' + (isEdit ? 'updated' : 'created') + ' successfully!', 'success');
          setTimeout(function () { closeAll(); openListModal(); }, 1200);
        })
        .catch(function (e) {
          showMsg('haf-form-msg', 'Error: ' + e.message, 'error');
          saveBtn.disabled = false;
          saveBtn.innerHTML = 'Save Changes';
        });
    });
  }

  function closeAll() {
    var overlay = document.getElementById('haf-overlay');
    if (overlay) overlay.remove();
    currentImageUrlTarget = null;
    currentPreviewTarget = null;
  }

  function escHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escAttr(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function injectButton() {
    if (!location.pathname.startsWith('/admin')) return;
    if (document.getElementById('haf-trigger-btn')) return;

    var anchor = document.querySelector('a[href="/admin/hero-images"]');
    if (!anchor) return;

    var btn = document.createElement('button');
    btn.id = 'haf-trigger-btn';
    btn.textContent = 'Manage Hero Images';
    btn.style.cssText = 'display:block;width:100%;margin-bottom:8px;padding:8px 16px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;font-size:14px;font-weight:600;cursor:pointer;text-align:left;color:#0f172a;transition:background .2s;';
    btn.onmouseenter = function () { btn.style.background = '#f1f5f9'; };
    btn.onmouseleave = function () { btn.style.background = '#fff'; };
    btn.addEventListener('click', function (e) { e.preventDefault(); openListModal(); });

    var parent = anchor.closest('button') || anchor;
    parent.parentElement.insertBefore(btn, parent);
  }

  function onHeroImagesPage() {
    if (location.pathname !== '/admin/hero-images') return;
    if (document.getElementById('haf-page-btn')) return;

    var heading = document.querySelector('h1');
    if (!heading) return;

    var container = heading.closest('div') || heading.parentElement;
    var banner = document.createElement('div');
    banner.id = 'haf-page-btn';
    banner.style.cssText = 'background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:10px;padding:14px 18px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;';
    banner.innerHTML = '<span style="font-size:14px;color:#1e40af;font-weight:600;">Use the button below to manage hero images directly.</span><button id="haf-page-open" style="padding:8px 18px;background:#1B2A4A;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">Open Hero Manager</button>';
    container.insertBefore(banner, container.firstChild);

    document.getElementById('haf-page-open').addEventListener('click', openListModal);
  }

  function boot() {
    injectButton();
    onHeroImagesPage();
  }

  var lastPath = location.pathname;
  new MutationObserver(function () {
    boot();
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      setTimeout(boot, 300);
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  [0, 300, 800, 1500].forEach(function (ms) { setTimeout(boot, ms); });

  var _push = history.pushState;
  history.pushState = function () { _push.apply(this, arguments); setTimeout(boot, 200); };
  var _replace = history.replaceState;
  history.replaceState = function () { _replace.apply(this, arguments); setTimeout(boot, 200); };
  window.addEventListener('popstate', function () { setTimeout(boot, 200); });
})();
