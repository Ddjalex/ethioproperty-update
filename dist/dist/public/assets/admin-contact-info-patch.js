// admin-contact-info-patch.js v2
// Adds Contact Information editor card to /admin/site-settings
// Includes: image upload, address, phone, email, hours, social media URLs
(function () {
  'use strict';
  var PATCH_KEY = '__ADMIN_CONTACT_INFO_PATCH_V2__';
  if (window[PATCH_KEY]) return;
  window[PATCH_KEY] = true;

  /* ── styles ─────────────────────────────────────────────── */
  var style = document.createElement('style');
  style.textContent = `
    #aci-card {
      background: #fff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      padding: 24px 28px 28px;
      margin-top: 28px;
      font-family: inherit;
      max-width: 720px;
    }
    #aci-card h3 {
      font-size: 1.05rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    #aci-card .aci-sub {
      font-size: 0.82rem;
      color: #64748b;
      margin: 0 0 20px;
    }
    #aci-card h4 {
      font-size: 0.9rem;
      font-weight: 700;
      color: #334155;
      margin: 22px 0 14px;
      padding-bottom: 8px;
      border-bottom: 1px solid #f1f5f9;
    }
    .aci-field { margin-bottom: 16px; }
    .aci-field label {
      display: block;
      font-size: 0.83rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 5px;
    }
    .aci-field input,
    .aci-field textarea {
      width: 100%;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      padding: 9px 12px;
      font-size: 0.875rem;
      font-family: inherit;
      color: #1e293b;
      background: #fff;
      box-sizing: border-box;
      transition: border-color .15s;
      resize: vertical;
    }
    .aci-field input:focus,
    .aci-field textarea:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37,99,235,.12);
    }
    .aci-hint {
      font-size: 0.75rem;
      color: #94a3b8;
      margin-top: 4px;
    }
    /* image upload */
    #aci-img-wrap {
      border: 2px dashed #e2e8f0;
      border-radius: 10px;
      padding: 18px;
      background: #f8fafc;
      margin-bottom: 10px;
    }
    #aci-img-preview {
      width: 100%;
      max-height: 180px;
      object-fit: cover;
      border-radius: 8px;
      display: none;
      margin-bottom: 12px;
    }
    #aci-img-preview.visible { display: block; }
    #aci-img-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 20px 0;
      color: #94a3b8;
      font-size: 0.82rem;
    }
    #aci-img-placeholder.hidden { display: none; }
    #aci-file-input { display: none; }
    #aci-upload-btn {
      background: #f1f5f9;
      border: 1.5px solid #e2e8f0;
      border-radius: 7px;
      padding: 8px 18px;
      font-size: 0.82rem;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
      transition: background .15s;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    #aci-upload-btn:hover { background: #e2e8f0; }
    #aci-upload-status {
      font-size: 0.78rem;
      color: #64748b;
      margin-top: 6px;
    }
    .aci-img-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 8px;
    }
    #aci-remove-img-btn {
      background: none;
      border: none;
      color: #ef4444;
      font-size: 0.78rem;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      display: none;
    }
    #aci-remove-img-btn.visible { display: inline-block; }
    #aci-remove-img-btn:hover { background: #fee2e2; }
    /* footer */
    #aci-footer {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 24px;
      flex-wrap: wrap;
    }
    #aci-save-btn {
      background: #2563eb;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 10px 26px;
      font-size: 0.875rem;
      font-weight: 700;
      cursor: pointer;
      transition: background .15s;
    }
    #aci-save-btn:hover:not(:disabled) { background: #1d4ed8; }
    #aci-save-btn:disabled { opacity: .55; cursor: not-allowed; }
    #aci-status {
      font-size: 0.82rem;
      padding: 6px 14px;
      border-radius: 6px;
      display: none;
    }
    #aci-status.success { display: inline-block; background: #d1fae5; color: #065f46; }
    #aci-status.error   { display: inline-block; background: #fee2e2; color: #991b1b; }
    .aci-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 16px;
    }
    @media (max-width: 600px) { .aci-grid-2 { grid-template-columns: 1fr; } }
  `;
  document.head.appendChild(style);

  /* ── state ── */
  var uploadedImageUrl = null; // set after a successful upload

  /* ── API helpers ── */
  async function loadContactInfo() {
    try {
      var r = await fetch('/api/contact-info', { credentials: 'same-origin' });
      if (!r.ok) return {};
      return await r.json();
    } catch (e) { return {}; }
  }

  async function saveContactInfo(data) {
    var r = await fetch('/api/admin/contact-info', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!r.ok) {
      var err = await r.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Save failed');
    }
    return await r.json();
  }

  async function uploadImage(file) {
    var fd = new FormData();
    fd.append('image', file);
    var r = await fetch('/api/upload-image', {
      method: 'POST',
      credentials: 'same-origin',
      body: fd,
    });
    if (!r.ok) {
      var err = await r.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Upload failed');
    }
    return await r.json(); // { url, filename, ... }
  }

  /* ── build UI ── */
  function buildCard() {
    var card = document.createElement('div');
    card.id = 'aci-card';
    card.innerHTML = `
      <h3>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
             stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
        Contact Information
      </h3>
      <p class="aci-sub">These details appear in the contact section of the homepage.</p>

      <!-- ── Section image ── -->
      <h4>📸 Contact Section Image</h4>
      <div id="aci-img-wrap">
        <img id="aci-img-preview" src="" alt="Contact section preview">
        <div id="aci-img-placeholder">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
               stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <span>No image selected</span>
        </div>
        <div class="aci-img-actions">
          <input type="file" id="aci-file-input" accept="image/jpeg,image/png,image/webp">
          <button type="button" id="aci-upload-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Choose Image
          </button>
          <button type="button" id="aci-remove-img-btn">✕ Remove</button>
        </div>
        <div id="aci-upload-status"></div>
      </div>
      <p class="aci-hint" style="margin-bottom:4px">Recommended: landscape photo, min 800×500 px. JPEG/PNG/WebP, max 5 MB.</p>

      <!-- ── Contact details ── -->
      <h4>📍 Contact Details</h4>
      <div class="aci-field">
        <label for="aci-address">Address</label>
        <textarea id="aci-address" rows="3" placeholder="Bole Road, Atlas Building&#10;4th Floor, Office 407&#10;Addis Ababa, Ethiopia"></textarea>
        <p class="aci-hint">Use one line per address line (press Enter).</p>
      </div>
      <div class="aci-grid-2">
        <div class="aci-field">
          <label for="aci-phone">Phone Number</label>
          <input id="aci-phone" type="text" placeholder="0952000777">
        </div>
        <div class="aci-field">
          <label for="aci-email">Email Address</label>
          <input id="aci-email" type="text" placeholder="ethioproperty1@gmail.com">
        </div>
      </div>

      <!-- ── Business hours ── -->
      <h4>🕐 Business Hours</h4>
      <div class="aci-field">
        <label for="aci-weekday">Weekday Hours</label>
        <input id="aci-weekday" type="text" placeholder="Monday - Friday: 8:30 AM - 5:30 PM">
      </div>
      <div class="aci-grid-2">
        <div class="aci-field">
          <label for="aci-saturday">Saturday Hours</label>
          <input id="aci-saturday" type="text" placeholder="Saturday: 9:00 AM - 3:00 PM">
        </div>
        <div class="aci-field">
          <label for="aci-sunday">Sunday Hours</label>
          <input id="aci-sunday" type="text" placeholder="Sunday: Closed">
        </div>
      </div>

      <!-- ── Social media ── -->
      <h4>🔗 Social Media URLs</h4>
      <div class="aci-grid-2">
        <div class="aci-field">
          <label for="aci-facebook">Facebook URL</label>
          <input id="aci-facebook" type="url" placeholder="https://facebook.com/...">
        </div>
        <div class="aci-field">
          <label for="aci-linkedin">LinkedIn URL</label>
          <input id="aci-linkedin" type="url" placeholder="https://linkedin.com/...">
        </div>
        <div class="aci-field">
          <label for="aci-tiktok">TikTok URL</label>
          <input id="aci-tiktok" type="url" placeholder="https://tiktok.com/@...">
        </div>
        <div class="aci-field">
          <label for="aci-youtube">YouTube URL</label>
          <input id="aci-youtube" type="url" placeholder="https://youtube.com/...">
        </div>
      </div>

      <div id="aci-footer">
        <button id="aci-save-btn" type="button">Save Contact Info</button>
        <span id="aci-status"></span>
      </div>
    `;
    return card;
  }

  function setStatus(msg, type) {
    var el = document.getElementById('aci-status');
    if (!el) return;
    el.textContent = msg;
    el.className = type;
    if (type === 'success') setTimeout(function () { el.className = ''; el.textContent = ''; }, 4000);
  }

  function setUploadStatus(msg) {
    var el = document.getElementById('aci-upload-status');
    if (el) el.textContent = msg;
  }

  function showPreview(url) {
    var img = document.getElementById('aci-img-preview');
    var placeholder = document.getElementById('aci-img-placeholder');
    var removeBtn = document.getElementById('aci-remove-img-btn');
    if (!img) return;
    if (url) {
      img.src = url;
      img.classList.add('visible');
      if (placeholder) placeholder.classList.add('hidden');
      if (removeBtn) removeBtn.classList.add('visible');
    } else {
      img.src = '';
      img.classList.remove('visible');
      if (placeholder) placeholder.classList.remove('hidden');
      if (removeBtn) removeBtn.classList.remove('visible');
    }
  }

  function get(id) { return document.getElementById(id); }

  function wireImageUpload() {
    var uploadBtn = get('aci-upload-btn');
    var fileInput = get('aci-file-input');
    var removeBtn = get('aci-remove-img-btn');

    if (uploadBtn) uploadBtn.addEventListener('click', function () {
      if (fileInput) fileInput.click();
    });

    if (fileInput) fileInput.addEventListener('change', async function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;
      setUploadStatus('Uploading…');
      if (uploadBtn) uploadBtn.disabled = true;
      try {
        var result = await uploadImage(file);
        uploadedImageUrl = result.url;
        showPreview(uploadedImageUrl);
        setUploadStatus('✓ Image uploaded — click Save Contact Info to apply.');
      } catch (e) {
        setUploadStatus('Upload failed: ' + e.message);
      } finally {
        if (uploadBtn) uploadBtn.disabled = false;
        fileInput.value = '';
      }
    });

    if (removeBtn) removeBtn.addEventListener('click', function () {
      uploadedImageUrl = '';
      showPreview(null);
      setUploadStatus('');
    });
  }

  async function init(card) {
    var info = await loadContactInfo();

    if (info.address)               get('aci-address').value  = info.address;
    if (info.phone)                 get('aci-phone').value    = info.phone;
    if (info.email)                 get('aci-email').value    = info.email;
    if (info.businessHoursWeekday)  get('aci-weekday').value  = info.businessHoursWeekday;
    if (info.businessHoursSaturday) get('aci-saturday').value = info.businessHoursSaturday;
    if (info.businessHoursSunday)   get('aci-sunday').value   = info.businessHoursSunday;
    if (info.facebookUrl)           get('aci-facebook').value = info.facebookUrl;
    if (info.linkedinUrl)           get('aci-linkedin').value = info.linkedinUrl;
    if (info.tiktokUrl)             get('aci-tiktok').value   = info.tiktokUrl;
    if (info.youtubeUrl)            get('aci-youtube').value  = info.youtubeUrl;
    if (info.contactSectionImage)   showPreview(info.contactSectionImage);

    wireImageUpload();

    get('aci-save-btn').addEventListener('click', async function () {
      var btn = get('aci-save-btn');
      btn.disabled = true;
      btn.textContent = 'Saving…';
      try {
        var payload = {
          address:              get('aci-address').value.trim(),
          phone:                get('aci-phone').value.trim(),
          email:                get('aci-email').value.trim(),
          businessHoursWeekday: get('aci-weekday').value.trim(),
          businessHoursSaturday:get('aci-saturday').value.trim(),
          businessHoursSunday:  get('aci-sunday').value.trim(),
          facebookUrl:          get('aci-facebook').value.trim(),
          linkedinUrl:          get('aci-linkedin').value.trim(),
          tiktokUrl:            get('aci-tiktok').value.trim(),
          youtubeUrl:           get('aci-youtube').value.trim(),
        };
        // Only send image URL if the admin explicitly uploaded/cleared one
        if (uploadedImageUrl !== null) {
          payload.contactSectionImage = uploadedImageUrl;
        }
        await saveContactInfo(payload);
        setStatus('Saved successfully!', 'success');
        setUploadStatus('');
        uploadedImageUrl = null; // reset pending state
      } catch (e) {
        setStatus(e.message || 'Error saving', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Save Contact Info';
      }
    });
  }

  /* ── inject card into the admin settings page ── */
  function isAdminSettingsPage() {
    return /^\/admin\/site-settings\b/.test(window.location.pathname);
  }

  function findInsertTarget() {
    var form = document.querySelector('form');
    if (form) return form;
    var main = document.querySelector('main');
    if (main) return main;
    return null;
  }

  async function patch() {
    if (!isAdminSettingsPage()) return;
    if (document.getElementById('aci-card')) return;
    var target = findInsertTarget();
    if (!target) return;
    var card = buildCard();
    target.appendChild(card);
    await init(card);
  }

  var lastPath = location.pathname;
  function schedulePatch() { setTimeout(patch, 400); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedulePatch);
  } else {
    schedulePatch();
  }

  new MutationObserver(function () {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      schedulePatch();
    } else if (isAdminSettingsPage() && !document.getElementById('aci-card')) {
      setTimeout(patch, 200);
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
