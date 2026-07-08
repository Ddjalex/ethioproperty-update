(function () {
  var PATCH_KEY = '__primeAddisAdminContent_v2__';
  if (window[PATCH_KEY]) return;
  window[PATCH_KEY] = true;

  /* ── shared styles ── */
  var style = document.createElement('style');
  style.textContent = `
    .pac-overlay { position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9000;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:40px 16px; }
    .pac-modal { background:#fff;border-radius:16px;width:100%;max-width:760px;padding:32px;box-shadow:0 20px 60px rgba(0,0,0,.2);margin:auto; }
    .pac-modal h2 { font-size:1.3rem;font-weight:700;margin-bottom:20px;color:#0f172a; }
    .pac-field { margin-bottom:16px; }
    .pac-field label { display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:5px; }
    .pac-field input,.pac-field textarea,.pac-field select { width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:9px 12px;font-size:14px;color:#1e293b;background:#fff;outline:none;transition:border-color .2s; }
    .pac-field input:focus,.pac-field textarea:focus { border-color:#1d4ed8; }
    .pac-field textarea { min-height:140px;resize:vertical; }
    .pac-field-row { display:grid;grid-template-columns:1fr 1fr;gap:12px; }
    .pac-check { display:flex;align-items:center;gap:8px;font-size:14px;color:#374151;cursor:pointer; }
    .pac-check input { width:auto;margin:0; }
    .pac-actions { display:flex;gap:10px;justify-content:flex-end;margin-top:20px; }
    .pac-btn { padding:9px 20px;border-radius:8px;font-size:14px;font-weight:600;border:none;cursor:pointer;transition:opacity .2s; }
    .pac-btn:hover { opacity:.85; }
    .pac-btn-primary { background:#0f172a;color:#fff; }
    .pac-btn-danger  { background:#ef4444;color:#fff; }
    .pac-btn-cancel  { background:#f1f5f9;color:#374151; }
    .pac-btn-sm { padding:5px 12px;font-size:12px;border-radius:6px;border:none;cursor:pointer;font-weight:600; }
    .pac-page { min-height:80vh; }
    .pac-page-header { display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;flex-wrap:wrap;gap:12px; }
    .pac-page-header h1 { font-size:1.6rem;font-weight:800;color:#0f172a; }
    .pac-table { width:100%;border-collapse:collapse;font-size:14px; }
    .pac-table th { text-align:left;padding:10px 14px;background:#f8fafc;font-weight:700;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#64748b;border-bottom:1.5px solid #e2e8f0; }
    .pac-table td { padding:12px 14px;border-bottom:1px solid #f1f5f9;color:#1e293b;vertical-align:middle; }
    .pac-table tr:hover td { background:#f8fafc; }
    .pac-badge { display:inline-block;padding:2px 10px;border-radius:999px;font-size:11px;font-weight:700; }
    .pac-badge-green { background:#dcfce7;color:#16a34a; }
    .pac-badge-gray  { background:#f1f5f9;color:#64748b; }
    .pac-partner-thumb { height:40px;max-width:100px;object-fit:contain;border-radius:4px;background:#f8fafc;padding:2px; }
    .pac-hint { font-size:13px;color:#94a3b8;margin-top:4px; }
    .pac-upload-box { border:1.5px dashed #cbd5e1;border-radius:10px;padding:14px;background:#f8fafc;display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center; }
    .pac-upload-box input[type="file"] { border:none;background:transparent;padding:0; }
    .pac-upload-preview { display:flex;align-items:center;gap:10px;margin-top:10px;min-height:42px; }
    .pac-upload-preview img { max-height:56px;max-width:140px;object-fit:contain;border-radius:8px;background:#fff;border:1px solid #e2e8f0;padding:4px; }
    .pac-upload-preview span { font-size:12px;color:#64748b;word-break:break-all; }

    /* ── Full-page management panel ── */
    #pac-panel {
      position: fixed; inset: 0; z-index: 8500;
      background: #f8fafc;
      overflow-y: auto;
      display: flex; flex-direction: column;
    }
    #pac-panel-header {
      background: #0f172a; color: #fff;
      display: flex; align-items: center; gap: 0;
      padding: 0; flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(0,0,0,.2);
    }
    .pac-tab {
      padding: 14px 22px; font-size: 14px; font-weight: 600;
      cursor: pointer; border: none; background: transparent;
      color: rgba(255,255,255,.65); transition: color .15s, background .15s;
      white-space: nowrap;
    }
    .pac-tab:hover { color: #fff; background: rgba(255,255,255,.08); }
    .pac-tab.pac-tab-active { color: #fff; background: rgba(255,255,255,.15); border-bottom: 3px solid #C4922A; }
    #pac-panel-close {
      margin-left: auto; padding: 14px 20px;
      font-size: 13px; font-weight: 700; cursor: pointer;
      color: rgba(255,255,255,.7); background: transparent; border: none;
      transition: color .15s;
    }
    #pac-panel-close:hover { color: #fff; }
    #pac-panel-body { flex: 1; padding: 32px; max-width: 1100px; width: 100%; margin: 0 auto; }

    /* ── Floating admin button ── */
    #pac-float-btn {
      position: fixed; bottom: 80px; right: 16px; z-index: 8000;
      background: #0f172a; color: #fff;
      border: none; border-radius: 12px;
      padding: 10px 18px; font-size: 13px; font-weight: 700;
      cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,.25);
      display: flex; align-items: center; gap: 7px;
      transition: opacity .2s, transform .2s;
    }
    #pac-float-btn:hover { opacity: .9; transform: translateY(-1px); }

    /* ── Admin panel quick-action buttons injected ── */
    .pac-admin-action-btn {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      width: 100%; padding: 14px 16px;
      border: 1px solid #e2e8f0; border-radius: 10px;
      background: #fff; font-size: 14px; font-weight: 500; color: #1e293b;
      cursor: pointer; text-align: center; transition: background .15s, border-color .15s;
    }
    .pac-admin-action-btn:hover { background: #f8fafc; border-color: #cbd5e1; }

    /* ── Navbar extra links ── */
    .pac-nav-extra { display: contents; }
    .pac-nav-extra a {
      font-size: 15px; font-weight: 500; color: #374151;
      text-decoration: none; cursor: pointer;
    }
    .pac-nav-extra a:hover { color: #0f172a; }
  `;
  document.head.appendChild(style);

  /* ── utilities ── */
  function esc(s) { return String(s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function api(path, opts) { return fetch(path, Object.assign({ credentials:'same-origin', headers:{'Content-Type':'application/json'} }, opts)); }
  async function uploadImage(file) {
    var fd = new FormData();
    fd.append('image', file);
    var res = await fetch('/api/upload-image', { method:'POST', credentials:'same-origin', body: fd });
    if (!res.ok) {
      var msg = 'Image upload failed';
      try { var data = await res.json(); if (data && data.message) msg = data.message; } catch(e) {}
      throw new Error(msg);
    }
    return res.json();
  }
  function imageUploadField(id, label, value, hint) {
    value = value || '';
    return '<div class="pac-field pac-image-field"><label>' + esc(label) + '</label><input type="hidden" id="' + esc(id) + '" value="' + esc(value) + '"><div class="pac-upload-box"><input type="file" class="pac-image-upload" data-target="' + esc(id) + '" accept="image/png,image/jpeg,image/jpg,image/webp"><button type="button" class="pac-btn pac-btn-cancel pac-clear-image" data-target="' + esc(id) + '">Clear</button></div><div class="pac-upload-preview" data-preview="' + esc(id) + '">' + (value ? '<img src="' + esc(value) + '" alt=""><span>' + esc(value) + '</span>' : '<span>' + esc(hint || 'Upload JPG, PNG, or WEBP image') + '</span>') + '</div></div>';
  }
  function setupImageUploads(scope) {
    scope.querySelectorAll('.pac-image-upload').forEach(function(input){
      input.onchange = async function(){
        if (!input.files || !input.files[0]) return;
        var target = scope.querySelector('#' + input.dataset.target);
        var preview = scope.querySelector('[data-preview="' + input.dataset.target + '"]');
        var oldText = preview ? preview.innerHTML : '';
        if (preview) preview.innerHTML = '<span>Uploading image...</span>';
        input.disabled = true;
        try {
          var data = await uploadImage(input.files[0]);
          target.value = data.url;
          if (preview) preview.innerHTML = '<img src="' + esc(data.url) + '" alt=""><span>' + esc(data.url) + '</span>';
        } catch (err) {
          if (preview) preview.innerHTML = oldText;
          alert(err.message || 'Image upload failed');
        } finally {
          input.disabled = false;
          input.value = '';
        }
      };
    });
    scope.querySelectorAll('.pac-clear-image').forEach(function(btn){
      btn.onclick = function(){
        var target = scope.querySelector('#' + btn.dataset.target);
        var preview = scope.querySelector('[data-preview="' + btn.dataset.target + '"]');
        if (target) target.value = '';
        if (preview) preview.innerHTML = '<span>Upload JPG, PNG, or WEBP image</span>';
      };
    });
  }

  /* ── MODAL helper ── */
  function openModal(content, onClose) {
    var ov = document.createElement('div');
    ov.className = 'pac-overlay';
    ov.innerHTML = '<div class="pac-modal">' + content + '</div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function(e){ if(e.target===ov){ close(); } });
    function close() { if(ov.parentNode) ov.parentNode.removeChild(ov); if(onClose) onClose(); }
    ov._close = close;
    return ov;
  }

  /* ══════════════════════════════════════════
     PARTNERS
  ══════════════════════════════════════════ */
  async function renderPartners(wrap) {
    var resp = await api('/api/admin/partners');
    var items = resp.ok ? await resp.json() : [];
    wrap.innerHTML = `
      <div class="pac-page">
        <div class="pac-page-header">
          <div>
            <h1>Partner Logos</h1>
            <p style="color:#64748b;font-size:14px;margin-top:4px">Logos shown in the homepage slider</p>
          </div>
          <button class="pac-btn pac-btn-primary" id="pac-add-partner">+ Add Partner</button>
        </div>
        <div style="overflow-x:auto">
        <table class="pac-table">
          <thead><tr><th>Logo</th><th>Name</th><th>Website</th><th>Order</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${items.length ? items.map(function(p){ return `
              <tr data-id="${p.id}">
                <td><img class="pac-partner-thumb" src="${esc(p.logo_url)}" alt="${esc(p.name)}"></td>
                <td>${esc(p.name)}</td>
                <td><a href="${esc(p.website_url||'#')}" target="_blank" style="color:#1d4ed8">${esc(p.website_url||'—')}</a></td>
                <td>${esc(p.display_order)}</td>
                <td><span class="pac-badge ${p.is_active?'pac-badge-green':'pac-badge-gray'}">${p.is_active?'Active':'Hidden'}</span></td>
                <td style="display:flex;gap:6px">
                  <button class="pac-btn-sm pac-btn-primary pac-edit-partner" data-id="${p.id}">Edit</button>
                  <button class="pac-btn-sm pac-btn-danger pac-del-partner" data-id="${p.id}">Delete</button>
                </td>
              </tr>
            `; }).join('') : '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:40px">No partners yet</td></tr>'}
          </tbody>
        </table>
        </div>
      </div>`;

    function partnerForm(data) {
      data = data || {};
      return `
        <h2>${data.id?'Edit Partner':'Add Partner'}</h2>
        <div class="pac-field"><label>Company Name</label><input id="pf-name" value="${esc(data.name||'')}" placeholder="ACME Corp"></div>
        ${imageUploadField('pf-logo', 'Partner Logo', data.logo_url, 'Upload the partner logo image')}
        <div class="pac-field"><label>Website URL (optional)</label><input id="pf-web" value="${esc(data.website_url||'')}" placeholder="https://partner.com"></div>
        <div class="pac-field-row">
          <div class="pac-field"><label>Display Order</label><input id="pf-order" type="number" value="${data.display_order||0}"></div>
          <div class="pac-field" style="display:flex;align-items:flex-end;padding-bottom:1px"><label class="pac-check"><input id="pf-active" type="checkbox" ${data.is_active!==false?'checked':''}> Active (show in slider)</label></div>
        </div>
        <div class="pac-actions">
          <button class="pac-btn pac-btn-cancel" id="pf-cancel">Cancel</button>
          <button class="pac-btn pac-btn-primary" id="pf-save">Save Partner</button>
        </div>`;
    }

    wrap.querySelector('#pac-add-partner').onclick = function() {
      var ov = openModal(partnerForm());
      setupImageUploads(ov);
      ov.querySelector('#pf-cancel').onclick = function(){ ov._close(); };
      ov.querySelector('#pf-save').onclick = async function(){
        var body = { name: ov.querySelector('#pf-name').value, logo_url: ov.querySelector('#pf-logo').value, website_url: ov.querySelector('#pf-web').value, display_order: parseInt(ov.querySelector('#pf-order').value)||0, is_active: ov.querySelector('#pf-active').checked };
        if (!body.logo_url) { alert('Partner logo image is required'); return; }
        await api('/api/admin/partners', { method:'POST', body: JSON.stringify(body) });
        ov._close(); renderPartners(wrap);
      };
    };

    wrap.querySelectorAll('.pac-edit-partner').forEach(function(btn){
      btn.onclick = async function(){
        var id = btn.dataset.id;
        var resp2 = await api('/api/admin/partners');
        var all = resp2.ok ? await resp2.json() : [];
        var data = all.find(function(x){ return String(x.id)===String(id); }) || {};
        var ov = openModal(partnerForm(data));
        setupImageUploads(ov);
        ov.querySelector('#pf-cancel').onclick = function(){ ov._close(); };
        ov.querySelector('#pf-save').onclick = async function(){
          var body = { name: ov.querySelector('#pf-name').value, logo_url: ov.querySelector('#pf-logo').value, website_url: ov.querySelector('#pf-web').value, display_order: parseInt(ov.querySelector('#pf-order').value)||0, is_active: ov.querySelector('#pf-active').checked };
          await api('/api/admin/partners/'+id, { method:'PUT', body: JSON.stringify(body) });
          ov._close(); renderPartners(wrap);
        };
      };
    });

    wrap.querySelectorAll('.pac-del-partner').forEach(function(btn){
      btn.onclick = async function(){
        if (!confirm('Delete this partner?')) return;
        await api('/api/admin/partners/'+btn.dataset.id, { method:'DELETE' });
        renderPartners(wrap);
      };
    });
  }

  /* ══════════════════════════════════════════
     BLOG
  ══════════════════════════════════════════ */
  async function renderBlog(wrap) {
    var resp = await api('/api/admin/blog');
    var posts = resp.ok ? await resp.json() : [];
    wrap.innerHTML = `
      <div class="pac-page">
        <div class="pac-page-header">
          <div><h1>Blog Posts</h1><p style="color:#64748b;font-size:14px;margin-top:4px">Published posts appear at <a href="/blog" target="_blank" style="color:#1d4ed8">/blog</a></p></div>
          <button class="pac-btn pac-btn-primary" id="pac-add-post">+ New Post</button>
        </div>
        <div style="overflow-x:auto">
        <table class="pac-table">
          <thead><tr><th>Title</th><th>Author</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${posts.length ? posts.map(function(p){ return `
              <tr>
                <td><strong>${esc(p.title)}</strong></td>
                <td>${esc(p.author||'Prime Addis')}</td>
                <td style="font-size:13px;color:#64748b">${p.published_at?new Date(p.published_at).toLocaleDateString():p.is_published?'Yes':'—'}</td>
                <td><span class="pac-badge ${p.is_published?'pac-badge-green':'pac-badge-gray'}">${p.is_published?'Published':'Draft'}</span></td>
                <td style="display:flex;gap:6px">
                  ${p.is_published?`<a href="/blog/${esc(p.slug)}" target="_blank" class="pac-btn-sm" style="background:#f0fdf4;color:#16a34a;border:none;padding:5px 10px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer">View</a>`:''}
                  <button class="pac-btn-sm pac-btn-primary pac-edit-post" data-id="${p.id}">Edit</button>
                  <button class="pac-btn-sm pac-btn-danger pac-del-post" data-id="${p.id}">Delete</button>
                </td>
              </tr>
            `; }).join('') : '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:40px">No posts yet. Click "+ New Post" to create one.</td></tr>'}
          </tbody>
        </table>
        </div>
      </div>`;

    function blogForm(data) {
      data = data || {};
      return `
        <h2>${data.id?'Edit Post':'New Blog Post'}</h2>
        <div class="pac-field"><label>Title *</label><input id="bf-title" value="${esc(data.title||'')}" placeholder="Post title"></div>
        <div class="pac-field"><label>Excerpt (summary shown in list)</label><textarea id="bf-excerpt" rows="2">${esc(data.excerpt||'')}</textarea></div>
        <div class="pac-field"><label>Content (HTML supported)</label><textarea id="bf-content" rows="10">${esc(data.content||'')}</textarea></div>
        <div class="pac-field-row">
          <div class="pac-field"><label>Author</label><input id="bf-author" value="${esc(data.author||'Prime Addis')}"></div>
          ${imageUploadField('bf-img', 'Featured Image', data.featured_image, 'Upload a blog cover image')}
        </div>
        <div class="pac-field"><label>Meta Description (SEO, ~150 chars)</label><input id="bf-metadesc" value="${esc(data.meta_description||'')}" placeholder="Brief description for search engines"></div>
        <div class="pac-field"><label>Meta Keywords (comma-separated)</label><input id="bf-keywords" value="${esc(data.meta_keywords||'')}" placeholder="real estate, Ethiopia, Addis Ababa"></div>
        <div class="pac-field"><label class="pac-check"><input id="bf-pub" type="checkbox" ${data.is_published?'checked':''}> Publish (make visible on /blog)</label></div>
        <div class="pac-actions">
          <button class="pac-btn pac-btn-cancel" id="bf-cancel">Cancel</button>
          <button class="pac-btn pac-btn-primary" id="bf-save">Save Post</button>
        </div>`;
    }

    function openBlogForm(data) {
      var ov = openModal(blogForm(data));
      setupImageUploads(ov);
      ov.querySelector('#bf-cancel').onclick = function(){ ov._close(); };
      ov.querySelector('#bf-save').onclick = async function(){
        var body = {
          title: ov.querySelector('#bf-title').value.trim(),
          excerpt: ov.querySelector('#bf-excerpt').value,
          content: ov.querySelector('#bf-content').value,
          author: ov.querySelector('#bf-author').value,
          featured_image: ov.querySelector('#bf-img').value,
          meta_description: ov.querySelector('#bf-metadesc').value,
          meta_keywords: ov.querySelector('#bf-keywords').value,
          is_published: ov.querySelector('#bf-pub').checked
        };
        if (!body.title) { alert('Title is required'); return; }
        if (data && data.id) {
          await api('/api/admin/blog/'+data.id, { method:'PUT', body: JSON.stringify(body) });
        } else {
          await api('/api/admin/blog', { method:'POST', body: JSON.stringify(body) });
        }
        ov._close(); renderBlog(wrap);
      };
    }

    wrap.querySelector('#pac-add-post').onclick = function(){ openBlogForm(null); };

    wrap.querySelectorAll('.pac-edit-post').forEach(function(btn){
      btn.onclick = async function(){
        var resp2 = await api('/api/admin/blog');
        var all = resp2.ok ? await resp2.json() : [];
        var data = all.find(function(x){ return String(x.id)===String(btn.dataset.id); });
        openBlogForm(data);
      };
    });

    wrap.querySelectorAll('.pac-del-post').forEach(function(btn){
      btn.onclick = async function(){
        if (!confirm('Delete this post?')) return;
        await api('/api/admin/blog/'+btn.dataset.id, { method:'DELETE' });
        renderBlog(wrap);
      };
    });
  }

  /* ══════════════════════════════════════════
     ABOUT
  ══════════════════════════════════════════ */
  async function renderAbout(wrap) {
    var resp = await api('/api/about');
    var data = resp.ok ? await resp.json() : {};
    wrap.innerHTML = `
      <div class="pac-page">
        <div class="pac-page-header">
          <div><h1>About Page</h1><p style="color:#64748b;font-size:14px;margin-top:4px">Visible at <a href="/about" target="_blank" style="color:#1d4ed8">/about</a></p></div>
          <div style="display:flex;gap:8px">
            <a href="/about" target="_blank" class="pac-btn pac-btn-cancel">Preview</a>
            <button class="pac-btn pac-btn-primary" id="pac-save-about">Save Changes</button>
          </div>
        </div>
        <div class="pac-field"><label>Page Title</label><input id="ab-title" value="${esc(data.title||'About Prime Addis')}"></div>
        <div class="pac-field"><label>Subtitle</label><input id="ab-subtitle" value="${esc(data.subtitle||'')}" placeholder="Short tagline below the title"></div>
        ${imageUploadField('ab-heroimg', 'Hero Image', data.hero_image, 'Upload an About page hero image')}
        <div class="pac-field"><label>Main Content (HTML supported)</label><textarea id="ab-content" rows="10">${esc(data.content||'')}</textarea></div>
        <div class="pac-field-row">
          <div class="pac-field"><label>Our Mission</label><textarea id="ab-mission" rows="4">${esc(data.mission||'')}</textarea></div>
          <div class="pac-field"><label>Our Vision</label><textarea id="ab-vision" rows="4">${esc(data.vision||'')}</textarea></div>
        </div>
        <div class="pac-field"><label>Meta Description (SEO)</label><input id="ab-metadesc" value="${esc(data.meta_description||'')}" placeholder="Shown in Google search results"></div>
        <div class="pac-field"><label>Meta Keywords (SEO)</label><input id="ab-keywords" value="${esc(data.meta_keywords||'')}" placeholder="real estate Ethiopia, Prime Addis, about"></div>
      </div>`;

    wrap.querySelector('#pac-save-about').onclick = async function(){
      var body = {
        title: wrap.querySelector('#ab-title').value,
        subtitle: wrap.querySelector('#ab-subtitle').value,
        content: wrap.querySelector('#ab-content').value,
        hero_image: wrap.querySelector('#ab-heroimg').value,
        mission: wrap.querySelector('#ab-mission').value,
        vision: wrap.querySelector('#ab-vision').value,
        meta_description: wrap.querySelector('#ab-metadesc').value,
        meta_keywords: wrap.querySelector('#ab-keywords').value
      };
      var r = await api('/api/admin/about', { method:'PUT', body: JSON.stringify(body) });
      if (r.ok) { alert('About page saved!'); } else { alert('Error saving'); }
    };
    setupImageUploads(wrap);
  }

  /* ══════════════════════════════════════════
     PORTFOLIO
  ══════════════════════════════════════════ */
  async function renderPortfolio(wrap) {
    var resp = await api('/api/admin/portfolio');
    var items = resp.ok ? await resp.json() : [];
    wrap.innerHTML = `
      <div class="pac-page">
        <div class="pac-page-header">
          <div><h1>Portfolio</h1><p style="color:#64748b;font-size:14px;margin-top:4px">Shown at <a href="/portfolio" target="_blank" style="color:#1d4ed8">/portfolio</a></p></div>
          <button class="pac-btn pac-btn-primary" id="pac-add-portfolio">+ Add Item</button>
        </div>
        <div style="overflow-x:auto">
        <table class="pac-table">
          <thead><tr><th>Image</th><th>Title</th><th>Category</th><th>Order</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${items.length ? items.map(function(p){ return `
              <tr>
                <td>${p.featured_image?`<img class="pac-partner-thumb" src="${esc(p.featured_image)}" alt="${esc(p.title)}" style="height:44px;max-width:80px">`:''}</td>
                <td><strong>${esc(p.title)}</strong></td>
                <td>${esc(p.category||'—')}</td>
                <td>${esc(p.display_order)}</td>
                <td><span class="pac-badge ${p.is_published?'pac-badge-green':'pac-badge-gray'}">${p.is_published?'Published':'Draft'}</span></td>
                <td style="display:flex;gap:6px">
                  ${p.is_published?`<a href="/portfolio/${esc(p.slug)}" target="_blank" class="pac-btn-sm" style="background:#f0fdf4;color:#16a34a;border:none;padding:5px 10px;border-radius:6px;font-size:12px;font-weight:600">View</a>`:''}
                  <button class="pac-btn-sm pac-btn-primary pac-edit-pf" data-id="${p.id}">Edit</button>
                  <button class="pac-btn-sm pac-btn-danger pac-del-pf" data-id="${p.id}">Delete</button>
                </td>
              </tr>
            `; }).join('') : '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:40px">No portfolio items yet</td></tr>'}
          </tbody>
        </table>
        </div>
      </div>`;

    function pfForm(data) {
      data = data || {};
      return `
        <h2>${data.id?'Edit Item':'Add Portfolio Item'}</h2>
        <div class="pac-field"><label>Title *</label><input id="pf2-title" value="${esc(data.title||'')}" placeholder="Project name"></div>
        <div class="pac-field"><label>Category</label><input id="pf2-cat" value="${esc(data.category||'')}" placeholder="e.g. Residential, Commercial, Villa"></div>
        <div class="pac-field"><label>Description</label><textarea id="pf2-desc" rows="3">${esc(data.description||'')}</textarea></div>
        <div class="pac-field"><label>Full Content (HTML supported)</label><textarea id="pf2-content" rows="8">${esc(data.content||'')}</textarea></div>
        ${imageUploadField('pf2-img', 'Featured Image', data.featured_image, 'Upload a portfolio image')}
        <div class="pac-field"><label>Meta Description (SEO)</label><input id="pf2-metadesc" value="${esc(data.meta_description||'')}" placeholder="Brief description for search results"></div>
        <div class="pac-field"><label>Meta Keywords (SEO)</label><input id="pf2-keywords" value="${esc(data.meta_keywords||'')}" placeholder="real estate project, Addis Ababa, Ethiopia"></div>
        <div class="pac-field-row">
          <div class="pac-field"><label>Display Order</label><input id="pf2-order" type="number" value="${data.display_order||0}"></div>
          <div class="pac-field" style="display:flex;align-items:flex-end;padding-bottom:1px"><label class="pac-check"><input id="pf2-pub" type="checkbox" ${data.is_published?'checked':''}> Published</label></div>
        </div>
        <div class="pac-actions">
          <button class="pac-btn pac-btn-cancel" id="pf2-cancel">Cancel</button>
          <button class="pac-btn pac-btn-primary" id="pf2-save">Save</button>
        </div>`;
    }

    function openPfForm(data) {
      var ov = openModal(pfForm(data));
      setupImageUploads(ov);
      ov.querySelector('#pf2-cancel').onclick = function(){ ov._close(); };
      ov.querySelector('#pf2-save').onclick = async function(){
        var body = {
          title: ov.querySelector('#pf2-title').value.trim(),
          category: ov.querySelector('#pf2-cat').value,
          description: ov.querySelector('#pf2-desc').value,
          content: ov.querySelector('#pf2-content').value,
          featured_image: ov.querySelector('#pf2-img').value,
          meta_description: ov.querySelector('#pf2-metadesc').value,
          meta_keywords: ov.querySelector('#pf2-keywords').value,
          display_order: parseInt(ov.querySelector('#pf2-order').value)||0,
          is_published: ov.querySelector('#pf2-pub').checked
        };
        if (!body.title) { alert('Title is required'); return; }
        if (data && data.id) {
          await api('/api/admin/portfolio/'+data.id, { method:'PUT', body: JSON.stringify(body) });
        } else {
          await api('/api/admin/portfolio', { method:'POST', body: JSON.stringify(body) });
        }
        ov._close(); renderPortfolio(wrap);
      };
    }

    wrap.querySelector('#pac-add-portfolio').onclick = function(){ openPfForm(null); };

    wrap.querySelectorAll('.pac-edit-pf').forEach(function(btn){
      btn.onclick = async function(){
        var resp2 = await api('/api/admin/portfolio');
        var all = resp2.ok ? await resp2.json() : [];
        var data = all.find(function(x){ return String(x.id)===String(btn.dataset.id); });
        openPfForm(data);
      };
    });

    wrap.querySelectorAll('.pac-del-pf').forEach(function(btn){
      btn.onclick = async function(){
        if (!confirm('Delete this portfolio item?')) return;
        await api('/api/admin/portfolio/'+btn.dataset.id, { method:'DELETE' });
        renderPortfolio(wrap);
      };
    });
  }

  /* ══════════════════════════════════════════
     FULL-PAGE MANAGEMENT PANEL
  ══════════════════════════════════════════ */
  var TABS = [
    { id: 'partners',  label: '🤝 Partners',   render: renderPartners },
    { id: 'blog',      label: '📝 Blog',        render: renderBlog },
    { id: 'about',     label: 'ℹ️ About Page',  render: renderAbout },
    { id: 'portfolio', label: '🗂️ Portfolio',  render: renderPortfolio }
  ];

  var activeTab = 'partners';

  function openPanel(tabId) {
    if (tabId) activeTab = tabId;

    var existing = document.getElementById('pac-panel');
    if (existing) existing.parentNode.removeChild(existing);

    var panel = document.createElement('div');
    panel.id = 'pac-panel';

    var header = document.createElement('div');
    header.id = 'pac-panel-header';

    TABS.forEach(function(t){
      var btn = document.createElement('button');
      btn.className = 'pac-tab' + (t.id === activeTab ? ' pac-tab-active' : '');
      btn.textContent = t.label;
      btn.onclick = function(){ openPanel(t.id); };
      header.appendChild(btn);
    });

    var closeBtn = document.createElement('button');
    closeBtn.id = 'pac-panel-close';
    closeBtn.textContent = '✕ Close';
    closeBtn.onclick = function(){
      if (panel.parentNode) panel.parentNode.removeChild(panel);
    };
    header.appendChild(closeBtn);

    var body = document.createElement('div');
    body.id = 'pac-panel-body';

    panel.appendChild(header);
    panel.appendChild(body);
    document.body.appendChild(panel);

    var tab = TABS.find(function(t){ return t.id === activeTab; }) || TABS[0];
    tab.render(body);
  }

  /* ══════════════════════════════════════════
     FLOATING BUTTON (admin pages only)
  ══════════════════════════════════════════ */
  function ensureFloatBtn() {
    if (!isAdminPage() || isAdminDashboardPage()) {
      removeFloatBtn();
      return;
    }
    if (document.getElementById('pac-float-btn')) return;
    var btn = document.createElement('button');
    btn.id = 'pac-float-btn';
    btn.innerHTML = '<span style="font-size:16px">📋</span> Content Management';
    btn.onclick = function(){ openPanel(); };
    document.body.appendChild(btn);
  }

  function removeFloatBtn() {
    var btn = document.getElementById('pac-float-btn');
    if (btn) btn.parentNode.removeChild(btn);
  }

  function isAdminPage() {
    return /^\/admin/i.test(location.pathname);
  }

  function isAdminDashboardPage() {
    return location.pathname === '/admin' || location.pathname === '/admin/dashboard';
  }

  window.primeAddisOpenContentManagement = openPanel;

  /* ══════════════════════════════════════════
     INJECT ADMIN QUICK-ACTION BUTTONS
     into the admin dashboard right panel
  ══════════════════════════════════════════ */
  var adminBtnsInjected = false;

  function injectAdminButtons() {
    if (!isAdminPage()) { adminBtnsInjected = false; return; }
    if (adminBtnsInjected) return;

    /* Find a button that contains known admin action text */
    var allBtns = Array.from(document.querySelectorAll('button'));
    var anchor = null;
    var texts = ['Manage Site Settings', 'Manage Property Types', 'Facebook Pixel', 'Manage Hero Images', 'Manage Subscribers', 'Manage Users'];
    for (var i = 0; i < texts.length; i++) {
      anchor = allBtns.find(function(b){ return b.textContent.includes(texts[i]); });
      if (anchor) break;
    }
    if (!anchor) return;

    /* Walk up to find the grid/flex container */
    var container = anchor.parentElement;
    for (var d = 0; d < 5; d++) {
      if (!container || container === document.body) break;
      var children = Array.from(container.children).filter(function(c){ return c.tagName === 'BUTTON' || c.querySelector('button'); });
      if (children.length >= 3) break;
      container = container.parentElement;
    }
    if (!container || container === document.body) return;

    if (container.querySelector('[data-pac-admin-btn]')) return;

    var configs = [
      { label: '🤝 Manage Partners',   tab: 'partners' },
      { label: '📝 Manage Blog',        tab: 'blog' },
      { label: 'ℹ️ Manage About Page',  tab: 'about' }
    ];

    configs.forEach(function(cfg){
      var btn = document.createElement('button');
      btn.className = 'pac-admin-action-btn';
      btn.setAttribute('data-pac-admin-btn', cfg.tab);
      btn.textContent = cfg.label;
      btn.onclick = function(){ openPanel(cfg.tab); };

      /* Try to match the existing button's wrapper if there is one */
      var anchorWrapper = anchor.parentElement === container ? null : anchor.parentElement;
      if (anchorWrapper && anchorWrapper !== container) {
        var wrapper = anchorWrapper.cloneNode(false);
        wrapper.appendChild(btn);
        container.appendChild(wrapper);
      } else {
        container.appendChild(btn);
      }
    });

    adminBtnsInjected = true;
  }

  var navLinksInjected = false;

  function injectNavLinks() {
    if (navLinksInjected) return;

    /* Find the "Contact" nav link */
    var contactLink = null;
    var allLinks = Array.from(document.querySelectorAll('a'));
    for (var i = 0; i < allLinks.length; i++) {
      var a = allLinks[i];
      var txt = (a.textContent || '').trim().toLowerCase();
      var href = (a.getAttribute('href') || '');
      if ((txt === 'contact' || href === '/contact') && isVisible(a)) {
        contactLink = a;
        break;
      }
    }
    if (!contactLink) return;

    /* Don't inject into the SSR nav (those pages have their own nav) */
    var nav = contactLink.closest('nav');
    if (!nav) return;

    /* Avoid double-injection */
    if (nav.querySelector('[data-pac-nav]')) return;

    var newLinks = [
      { href: '/blog',      label: 'Blog' },
      { href: '/about',     label: 'About' }
    ];

    /* Insert right after the Contact link, preserving sibling structure */
    var insertAfter = contactLink;

    newLinks.forEach(function(cfg){
      /* Check if already present */
      if (nav.querySelector('a[href="'+cfg.href+'"]')) return;

      var newLink = document.createElement('a');
      newLink.href = cfg.href;
      newLink.setAttribute('data-pac-nav', '1');
      newLink.textContent = cfg.label;

      /* Copy classes from the Contact link for consistent styling */
      if (contactLink.className) newLink.className = contactLink.className;

      /* Insert after the current anchor node */
      if (insertAfter.nextSibling) {
        insertAfter.parentNode.insertBefore(newLink, insertAfter.nextSibling);
      } else {
        insertAfter.parentNode.appendChild(newLink);
      }
      insertAfter = newLink;
    });

    navLinksInjected = true;
  }

  function isVisible(el) {
    if (!el) return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && window.getComputedStyle(el).display !== 'none';
  }

  /* ══════════════════════════════════════════
     SCHEDULER
  ══════════════════════════════════════════ */
  var schedTimer;
  function schedule() {
    clearTimeout(schedTimer);
    schedTimer = setTimeout(function(){
      ensureFloatBtn();
      injectAdminButtons();
      injectNavLinks();
    }, 350);
  }

  /* Reset nav injection on page change */
  var _lastPath = location.pathname;
  function checkRoute() {
    if (location.pathname !== _lastPath) {
      _lastPath = location.pathname;
      navLinksInjected = false;
      adminBtnsInjected = false;
      /* Close panel if navigated away from admin */
      if (!isAdminPage()) {
        var panel = document.getElementById('pac-panel');
        if (panel) panel.parentNode.removeChild(panel);
      }
    }
    schedule();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule, { once: true });
  } else { schedule(); }

  new MutationObserver(function(m){
    if (m.some(function(x){ return x.addedNodes.length > 0; })) schedule();
  }).observe(document.documentElement, { childList: true, subtree: true });

  var _push = history.pushState, _replace = history.replaceState;
  history.pushState = function(){ _push.apply(this, arguments); checkRoute(); };
  history.replaceState = function(){ _replace.apply(this, arguments); checkRoute(); };
  window.addEventListener('popstate', checkRoute);

  setInterval(checkRoute, 800);

  setTimeout(schedule, 600);
  setTimeout(schedule, 1500);
  setTimeout(schedule, 3000);
})();
