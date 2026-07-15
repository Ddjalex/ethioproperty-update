(function () {
  'use strict';
  var PATCH_KEY = '__ethioPropertyBlogPatch_v1__';
  if (window[PATCH_KEY]) return;
  window[PATCH_KEY] = true;

  /* ── Styles (matches admin-subscribers-patch.js palette) ── */
  function ensureStyles() {
    if (document.getElementById('blog-patch-style')) return;
    var s = document.createElement('style');
    s.id = 'blog-patch-style';
    s.textContent = [
      '#blog-page { font-family: inherit; padding: 32px; max-width: 1100px; margin: 0 auto; }',
      '#blog-page h1 { font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }',
      '#blog-page .blog-desc { color: #64748b; font-size: 14px; margin-bottom: 24px; }',
      '#blog-page .blog-toolbar { display: flex; gap: 12px; margin-bottom: 16px; align-items: center; flex-wrap: wrap; }',
      '#blog-page .blog-back { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; cursor: pointer; color: #334155; text-decoration: none; }',
      '#blog-page .blog-back:hover { background: #e2e8f0; }',
      '#blog-page .blog-new-btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; background: #2563eb; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }',
      '#blog-page .blog-new-btn:hover { background: #1d4ed8; }',
      '#blog-page .blog-count { font-size: 13px; color: #64748b; margin-left: auto; }',
      '#blog-page table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.08); }',
      '#blog-page thead { background: #f8fafc; }',
      '#blog-page th { text-align: left; padding: 12px 16px; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: .05em; border-bottom: 1px solid #e2e8f0; }',
      '#blog-page td { padding: 14px 16px; font-size: 14px; color: #1e293b; border-bottom: 1px solid #f1f5f9; vertical-align: top; }',
      '#blog-page tr:last-child td { border-bottom: none; }',
      '#blog-page tr:hover td { background: #f8fafc; }',
      '#blog-page .blog-badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }',
      '#blog-page .blog-badge.pub { background: #d1fae5; color: #065f46; }',
      '#blog-page .blog-badge.draft { background: #f1f5f9; color: #64748b; }',
      '#blog-page .blog-actions { display: flex; gap: 8px; }',
      '#blog-page .blog-edit { padding: 4px 10px; background: #eff6ff; color: #1d4ed8; border: none; border-radius: 6px; font-size: 12px; cursor: pointer; font-weight: 600; }',
      '#blog-page .blog-edit:hover { background: #dbeafe; }',
      '#blog-page .blog-del { padding: 4px 10px; background: #fee2e2; color: #b91c1c; border: none; border-radius: 6px; font-size: 12px; cursor: pointer; font-weight: 600; }',
      '#blog-page .blog-del:hover { background: #fecaca; }',
      '#blog-page .blog-empty { text-align: center; color: #94a3b8; padding: 48px 0; font-size: 15px; }',
      '#blog-page .blog-form { background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,.08); padding: 24px; max-width: 720px; }',
      '#blog-page .blog-field { margin-bottom: 16px; }',
      '#blog-page .blog-field label { display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px; }',
      '#blog-page .blog-field .blog-hint { font-size: 12px; color: #94a3b8; margin-top: 4px; }',
      '#blog-page .blog-field input[type=text], #blog-page .blog-field input[type=url], #blog-page .blog-field textarea { width: 100%; padding: 9px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; font-family: inherit; box-sizing: border-box; outline: none; }',
      '#blog-page .blog-field input:focus, #blog-page .blog-field textarea:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.15); }',
      '#blog-page .blog-field textarea { resize: vertical; }',
      '#blog-page .blog-field.blog-checkbox { display: flex; align-items: center; gap: 8px; }',
      '#blog-page .blog-field.blog-checkbox label { margin-bottom: 0; }',
      '#blog-page .blog-form-actions { display: flex; gap: 10px; margin-top: 20px; }',
      '#blog-page .blog-save-btn { padding: 9px 22px; background: #2563eb; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }',
      '#blog-page .blog-save-btn:hover:not(:disabled) { background: #1d4ed8; }',
      '#blog-page .blog-save-btn:disabled { opacity: .5; cursor: not-allowed; }',
      '#blog-page .blog-cancel-btn { padding: 9px 22px; background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }',
      '#blog-page .blog-cancel-btn:hover { background: #e2e8f0; }',
      '#blog-page .blog-status { font-size: 13px; margin-top: 12px; padding: 8px 12px; border-radius: 6px; display: none; }',
      '#blog-page .blog-status.success { display: block; background: #d1fae5; color: #065f46; }',
      '#blog-page .blog-status.error { display: block; background: #fee2e2; color: #991b1b; }',
      '#blog-page .blog-image-upload { border: 1px dashed #cbd5e1; border-radius: 8px; padding: 14px; }',
      '#blog-page .blog-image-preview-wrap { display: flex; align-items: center; gap: 14px; margin-bottom: 10px; }',
      '#blog-page .blog-image-preview-wrap img { width: 96px; height: 72px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0; background: #f1f5f9; }',
      '#blog-page .blog-image-preview-empty { width: 96px; height: 72px; border-radius: 6px; border: 1px dashed #cbd5e1; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 11px; text-align: center; padding: 4px; }',
      '#blog-page .blog-image-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }',
      '#blog-page .blog-image-pick-btn { padding: 7px 14px; background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; }',
      '#blog-page .blog-image-pick-btn:hover { background: #e2e8f0; }',
      '#blog-page .blog-image-remove-btn { padding: 7px 14px; background: #fee2e2; color: #b91c1c; border: none; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; }',
      '#blog-page .blog-image-remove-btn:hover { background: #fecaca; }',
      '#blog-page .blog-image-upload-status { font-size: 12px; color: #64748b; }',
      '#blog-page .blog-image-upload-status.error { color: #b91c1c; }',
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ── State ── */
  var blogData = [];
  var view = 'list'; // 'list' | 'form'
  var editingId = null;
  var formState = { title: '', slug: '', content: '', excerpt: '', featured_image: '', meta_description: '', meta_keywords: '', is_published: false };
  // True while a featured-image upload request is in flight. Save is blocked
  // during this window so a fast click can't save the post before the
  // uploaded image URL has been applied to formState.
  var imageUploading = false;

  function esc(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ── List view ── */
  function renderList() {
    var rows = blogData.length === 0
      ? '<tr><td colspan="4" class="blog-empty">No blog posts yet. Click "New Post" to create one.</td></tr>'
      : blogData.map(function (p) {
          var date = p.created_at ? new Date(p.created_at).toLocaleDateString('en-GB') : '—';
          var badge = p.is_published
            ? '<span class="blog-badge pub">Published</span>'
            : '<span class="blog-badge draft">Draft</span>';
          return '<tr>' +
            '<td><strong>' + esc(p.title) + '</strong><div style="color:#94a3b8;font-size:12px;margin-top:2px;">/blog/' + esc(p.slug) + '</div></td>' +
            '<td>' + badge + '</td>' +
            '<td>' + date + '</td>' +
            '<td class="blog-actions">' +
              '<button class="blog-edit" onclick="window.__blogEdit(' + p.id + ')">Edit</button>' +
              '<button class="blog-del" onclick="window.__blogDelete(' + p.id + ')">Delete</button>' +
            '</td>' +
          '</tr>';
        }).join('');

    return '<div style="display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap;margin-bottom:20px;">' +
        '<div>' +
          '<h1>Manage Blog</h1>' +
          '<p class="blog-desc">Create and manage blog posts shown on the public /blog page</p>' +
        '</div>' +
        '<div style="margin-left:auto;">' +
          '<a class="blog-back" href="/admin/dashboard">&#8592; Back to Dashboard</a>' +
        '</div>' +
      '</div>' +
      '<div class="blog-toolbar">' +
        '<button class="blog-new-btn" onclick="window.__blogNew()">+ New Post</button>' +
        '<span class="blog-count">' + blogData.length + ' post' + (blogData.length === 1 ? '' : 's') + '</span>' +
      '</div>' +
      '<table>' +
        '<thead><tr><th>Title</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>';
  }

  /* ── Form view (create/edit) ── */
  function renderForm() {
    var isEdit = editingId !== null;
    var slugField = isEdit
      ? '<div class="blog-field"><label>Slug</label><input type="text" value="' + esc(formState.slug) + '" disabled />' +
        '<div class="blog-hint">The slug is set from the title when a post is created and can\'t be changed here.</div></div>'
      : '<div class="blog-field"><label>Slug</label><input type="text" value="(auto-generated from title after saving)" disabled />' +
        '<div class="blog-hint">The slug will be generated automatically from the title.</div></div>';

    return '<div style="display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap;margin-bottom:20px;">' +
        '<div>' +
          '<h1>' + (isEdit ? 'Edit Post' : 'New Post') + '</h1>' +
          '<p class="blog-desc">' + (isEdit ? 'Update this blog post' : 'Write and publish a new blog post') + '</p>' +
        '</div>' +
        '<div style="margin-left:auto;">' +
          '<button class="blog-back" onclick="window.__blogCancel()">&#8592; Back to List</button>' +
        '</div>' +
      '</div>' +
      '<div class="blog-form">' +
        '<div class="blog-field"><label>Title *</label><input type="text" id="blog-f-title" value="' + esc(formState.title) + '" placeholder="e.g. 5 Tips for Buying Property in Addis Ababa" /></div>' +
        slugField +
        '<div class="blog-field"><label>Excerpt</label><textarea id="blog-f-excerpt" rows="2" placeholder="Short summary shown on the blog list">' + esc(formState.excerpt) + '</textarea></div>' +
        '<div class="blog-field"><label>Content *</label><textarea id="blog-f-content" rows="10" placeholder="Full post content">' + esc(formState.content) + '</textarea></div>' +
        '<div class="blog-field"><label>Featured Image</label>' +
          '<div class="blog-image-upload">' +
            '<div class="blog-image-preview-wrap">' +
              (formState.featured_image
                ? '<img id="blog-f-image-preview" src="' + esc(formState.featured_image) + '" alt="Featured image preview" />'
                : '<div id="blog-f-image-preview-empty" class="blog-image-preview-empty">No image</div>') +
              '<div class="blog-image-actions">' +
                '<button type="button" class="blog-image-pick-btn" onclick="document.getElementById(\'blog-f-image-file\').click()">' + (formState.featured_image ? 'Replace image' : 'Upload image') + '</button>' +
                (formState.featured_image ? '<button type="button" class="blog-image-remove-btn" onclick="window.__blogRemoveImage()">Remove</button>' : '') +
                '<span class="blog-image-upload-status" id="blog-f-image-status"></span>' +
              '</div>' +
            '</div>' +
            '<input type="file" id="blog-f-image-file" accept="image/jpeg,image/jpg,image/png,image/webp" style="display:none" onchange="window.__blogImageSelected(this)" />' +
            '<input type="hidden" id="blog-f-image" value="' + esc(formState.featured_image) + '" />' +
          '</div>' +
        '</div>' +
        '<div class="blog-field"><label>Meta Description</label><textarea id="blog-f-meta-desc" rows="2" placeholder="SEO description">' + esc(formState.meta_description) + '</textarea></div>' +
        '<div class="blog-field"><label>Meta Keywords</label><input type="text" id="blog-f-meta-keywords" value="' + esc(formState.meta_keywords) + '" placeholder="comma, separated, keywords" /></div>' +
        '<div class="blog-field blog-checkbox"><input type="checkbox" id="blog-f-published" ' + (formState.is_published ? 'checked' : '') + ' /><label for="blog-f-published">Published (visible on public /blog page)</label></div>' +
        '<div class="blog-form-actions">' +
          '<button class="blog-save-btn" id="blog-save-btn" onclick="window.__blogSave()">' + (isEdit ? 'Save Changes' : 'Create Post') + '</button>' +
          '<button class="blog-cancel-btn" onclick="window.__blogCancel()">Cancel</button>' +
        '</div>' +
        '<div class="blog-status" id="blog-status"></div>' +
      '</div>';
  }

  function renderPage() {
    var root = document.getElementById('root');
    if (!root) return;
    var inner = view === 'form' ? renderForm() : renderList();
    root.innerHTML = '<div id="blog-page">' + inner + '</div>';
  }

  function loadAndRender() {
    fetch('/api/admin/blog', { credentials: 'include' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        blogData = Array.isArray(data) ? data : [];
        renderPage();
      })
      .catch(function (err) {
        console.error('Failed to load blog posts:', err);
        blogData = [];
        renderPage();
      });
  }

  /* ── Actions ── */
  window.__blogNew = function () {
    editingId = null;
    formState = { title: '', slug: '', content: '', excerpt: '', featured_image: '', meta_description: '', meta_keywords: '', is_published: false };
    view = 'form';
    renderPage();
  };

  window.__blogEdit = function (id) {
    var post = blogData.find(function (p) { return p.id === id; });
    if (!post) return;
    editingId = id;
    formState = {
      title: post.title || '',
      slug: post.slug || '',
      content: post.content || '',
      excerpt: post.excerpt || '',
      featured_image: post.featured_image || '',
      meta_description: post.meta_description || '',
      meta_keywords: post.meta_keywords || '',
      is_published: !!post.is_published
    };
    view = 'form';
    renderPage();
  };

  window.__blogCancel = function () {
    view = 'list';
    editingId = null;
    renderPage();
  };

  window.__blogDelete = function (id) {
    if (!confirm('Delete this blog post? This cannot be undone.')) return;
    fetch('/api/admin/blog/' + id, {
      method: 'DELETE',
      credentials: 'include'
    }).then(function () {
      blogData = blogData.filter(function (p) { return p.id !== id; });
      renderPage();
    }).catch(function (e) { console.error('Delete failed', e); });
  };

  function showFormStatus(msg, type) {
    var el = document.getElementById('blog-status');
    if (!el) return;
    el.textContent = msg;
    el.className = 'blog-status ' + type;
  }

  function showImageStatus(msg, isError) {
    var el = document.getElementById('blog-f-image-status');
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'blog-image-upload-status' + (isError ? ' error' : '');
  }

  /* Re-rendering the form (e.g. after an image upload) rebuilds the whole
     innerHTML from formState — sync in-progress edits first so typed text
     in other fields isn't lost. */
  function syncFormFieldsFromDom() {
    var get = function (id) { var el = document.getElementById(id); return el ? el.value : undefined; };
    if (get('blog-f-title') !== undefined) formState.title = get('blog-f-title');
    if (get('blog-f-excerpt') !== undefined) formState.excerpt = get('blog-f-excerpt');
    if (get('blog-f-content') !== undefined) formState.content = get('blog-f-content');
    if (get('blog-f-meta-desc') !== undefined) formState.meta_description = get('blog-f-meta-desc');
    if (get('blog-f-meta-keywords') !== undefined) formState.meta_keywords = get('blog-f-meta-keywords');
    var pub = document.getElementById('blog-f-published');
    if (pub) formState.is_published = !!pub.checked;
  }

  window.__blogRemoveImage = function () {
    syncFormFieldsFromDom();
    formState.featured_image = '';
    renderPage();
  };

  window.__blogImageSelected = function (input) {
    var file = input && input.files && input.files[0];
    if (!file) return;

    var allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.indexOf(file.type) === -1) {
      showImageStatus('Only JPEG, PNG, or WEBP images are allowed.', true);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showImageStatus('Image must be under 5MB.', true);
      return;
    }

    showImageStatus('Uploading…', false);
    imageUploading = true;
    var saveBtn = document.getElementById('blog-save-btn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.dataset.origLabel = saveBtn.dataset.origLabel || saveBtn.textContent; saveBtn.textContent = 'Uploading image…'; }

    var fd = new FormData();
    fd.append('image', file);

    fetch('/api/upload-image', {
      method: 'POST',
      credentials: 'include',
      body: fd
    })
      .then(function (r) {
        if (!r.ok) throw new Error('Upload failed (' + r.status + ')');
        return r.json();
      })
      .then(function (data) {
        imageUploading = false;
        syncFormFieldsFromDom();
        formState.featured_image = data.url;
        renderPage();
      })
      .catch(function (err) {
        imageUploading = false;
        console.error('Featured image upload failed:', err);
        showImageStatus('Upload failed: ' + err.message, true);
        var btn = document.getElementById('blog-save-btn');
        if (btn) { btn.disabled = false; btn.textContent = btn.dataset.origLabel || btn.textContent; }
      });
  };

  window.__blogSave = function () {
    if (imageUploading) {
      showFormStatus('Please wait for the image upload to finish before saving.', 'error');
      return;
    }
    var title = (document.getElementById('blog-f-title') || {}).value || '';
    var content = (document.getElementById('blog-f-content') || {}).value || '';
    var excerpt = (document.getElementById('blog-f-excerpt') || {}).value || '';
    var featuredImage = (document.getElementById('blog-f-image') || {}).value || '';
    var metaDescription = (document.getElementById('blog-f-meta-desc') || {}).value || '';
    var metaKeywords = (document.getElementById('blog-f-meta-keywords') || {}).value || '';
    var isPublished = !!(document.getElementById('blog-f-published') || {}).checked;

    title = title.trim();
    content = content.trim();

    if (!title) { showFormStatus('Title is required.', 'error'); return; }
    if (!content) { showFormStatus('Content is required.', 'error'); return; }

    var payload = {
      title: title,
      content: content,
      excerpt: excerpt.trim(),
      featured_image: featuredImage.trim() || null,
      meta_description: metaDescription.trim(),
      meta_keywords: metaKeywords.trim(),
      is_published: isPublished
    };

    var btn = document.getElementById('blog-save-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

    var url = editingId !== null ? '/api/admin/blog/' + editingId : '/api/admin/blog';
    var method = editingId !== null ? 'PUT' : 'POST';

    fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include'
    })
      .then(function (r) {
        if (!r.ok) throw new Error('Server error ' + r.status);
        return r.json();
      })
      .then(function () {
        view = 'list';
        editingId = null;
        loadAndRender();
      })
      .catch(function (e) {
        showFormStatus('Error: ' + e.message, 'error');
        if (btn) { btn.disabled = false; btn.textContent = editingId !== null ? 'Save Changes' : 'Create Post'; }
      });
  };

  /* ── Add sidebar button to admin dashboard (same pattern as
     admin-subscribers-patch.js) ── */
  function addSidebarButton() {
    if (!/^\/admin/i.test(location.pathname)) return;
    if (location.pathname.includes('/admin/blog')) return;
    if (document.getElementById('blog-sidebar-btn')) return;

    var allEls = Array.from(document.querySelectorAll('button, a'));
    var inquiriesBtn = allEls.find(function (b) { return b.textContent.trim() === 'View All Inquiries'; });
    if (!inquiriesBtn) return;

    var container = inquiriesBtn.closest('.space-y-2') || inquiriesBtn.closest('div') || inquiriesBtn.parentElement;
    if (!container) return;

    var blogBtn = document.createElement('a');
    blogBtn.id = 'blog-sidebar-btn';
    blogBtn.className = inquiriesBtn.className;
    blogBtn.href = '/admin/blog';
    blogBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px;"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>Manage Blog';
    blogBtn.addEventListener('click', function (e) {
      e.preventDefault();
      view = 'list';
      editingId = null;
      history.pushState(null, '', '/admin/blog');
      schedule();
    });

    container.appendChild(blogBtn);
  }

  /* ── Route handler ── */
  var lastLoadedPath = null;

  function handleRoute() {
    var path = location.pathname;
    ensureStyles();
    if (path === '/admin/blog') {
      // Only (re)load from the API when we've just entered this route —
      // renderPage() rewrites #root, which itself triggers the
      // MutationObserver; without this guard that would create a
      // fetch/render loop instead of a stable page.
      if (lastLoadedPath !== path) {
        lastLoadedPath = path;
        view = 'list';
        editingId = null;
        loadAndRender();
      }
    } else {
      lastLoadedPath = null;
      if (/^\/admin/i.test(path)) addSidebarButton();
    }
  }

  var timer;
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(handleRoute, 250);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule, { once: true });
  } else {
    schedule();
  }

  new MutationObserver(function (mutations) {
    if (mutations.some(function (m) { return m.addedNodes.length > 0; })) schedule();
  }).observe(document.documentElement, { childList: true, subtree: true });

  var _push = history.pushState;
  history.pushState = function () { _push.apply(this, arguments); schedule(); };
  window.addEventListener('popstate', schedule);

  setTimeout(schedule, 600);
  setTimeout(schedule, 1500);
})();
