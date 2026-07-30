// /assets/admin-amenities-patch.js
// Runtime patch for the built dist app.
// Includes:
// 1) Amenities & Features checkbox UI on admin property add/edit
// 2) Optional bedrooms/bathrooms/squareFeet handling
// 3) Video URL field on admin property add/edit, saved as videoUrl/video_url
// No rebuild required.

(() => {
  const PATCH_KEY = "__adminAmenitiesVideoPatch_v7__";
  if (window[PATCH_KEY]) return;
  window[PATCH_KEY] = { lastPath: location.pathname };

  const DEFAULT_AMENITIES = [
    "Central AC",
    "Hardwood Floors",
    "Fireplace",
    "Walk-in Closets",
    "Stainless Appliances",
    "Swimming Pool",
    "Gym / Fitness Center",
    "Elevator",
    "Parking",
    "Security",
    "Balcony",
    "Garden",
    "Laundry",
    "Generator",
    "Internet Ready",
  ];

  function normStr(s) {
    return (s ?? "").toString().trim();
  }

  function uniq(arr) {
    const seen = new Set();
    const out = [];
    for (const x of arr) {
      const v = normStr(x);
      if (!v) continue;
      const k = v.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(v);
    }
    return out;
  }

  function parseFeaturesAny(v) {
    if (Array.isArray(v)) return uniq(v);
    if (v == null) return [];
    if (typeof v === "string") {
      const s = v.trim();
      if (!s) return [];
      if ((s.startsWith("[") && s.endsWith("]")) || (s.startsWith('"') && s.endsWith('"'))) {
        try {
          const parsed = JSON.parse(s);
          if (Array.isArray(parsed)) return uniq(parsed);
          if (typeof parsed === "string") return uniq(parsed.split(","));
        } catch {}
      }
      return uniq(s.split(","));
    }
    return [];
  }

  function isAdminPropertiesPage() {
    const p = location.pathname || "";
    if (!p.startsWith("/admin/properties")) return false;
    if (/(\/add$|\/new$|\/create$)/i.test(p)) return true;
    if (/(\/edit\/\d+$|\/\d+\/edit$)/i.test(p)) return true;
    return /\/admin\/properties\//i.test(p);
  }

  function getPropertyIdFromUrl() {
    const p = location.pathname || "";
    let m = p.match(/\/admin\/properties\/edit\/(\d+)/i);
    if (m) return m[1];
    m = p.match(/\/admin\/properties\/(\d+)\/edit/i);
    if (m) return m[1];
    return null;
  }

  function findNativeHeadingEl() {
    const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4,label,strong"));
    return headings.find(h => {
      if (!h || !h.textContent) return false;
      if (h.closest("#amenities-features-patch")) return false;
      const t = normStr(h.textContent).toLowerCase();
      return t === "features" || t === "property features";
    }) || null;
  }

  function findNativeFeaturesSectionRoot() {
    const h = findNativeHeadingEl();
    if (!h) return null;
    let root = h.closest("section,article,form,fieldset,div");
    if (!root) root = h.parentElement;
    return root || null;
  }

  function findFeatureInputRow(root) {
    if (!root) return null;
    const inputs = Array.from(root.querySelectorAll('input[placeholder*="feature" i], input[aria-label*="feature" i]'));
    if (!inputs.length) return null;
    const input = inputs[0];
    let row = input.closest("div");
    for (let i = 0; i < 8 && row; i++) {
      const hasAddBtn = Array.from(row.querySelectorAll("button")).some(b => /^add$/i.test(normStr(b.textContent)));
      if (hasAddBtn) return row;
      row = row.parentElement;
    }
    return input.parentElement;
  }

  function hideOldFeaturesUI(root, featureRow) {
    if (featureRow && featureRow.style) featureRow.style.display = "none";
    if (!root) return;
    const nodes = Array.from(root.querySelectorAll("p,div,span"));
    for (const n of nodes) {
      if (!n || n.closest("#amenities-features-patch")) continue;
      const t = normStr(n.textContent).toLowerCase();
      if (!t) continue;
      if (t.includes("no features added") || t.includes("no features added yet")) {
        n.style.display = "none";
      }
    }
  }

  function getSelectedAmenitiesFromDom(container) {
    if (!container) return [];
    const checks = Array.from(container.querySelectorAll('input[type="checkbox"][data-amenity="1"]'));
    return uniq(checks.filter(c => c.checked).map(c => c.value));
  }

  function findLabelByText(re) {
    return Array.from(document.querySelectorAll("label,h1,h2,h3,h4,strong,p,span")).find(el => {
      if (!el || !el.textContent) return false;
      if (el.closest("#property-video-url-patch")) return false;
      return re.test(normStr(el.textContent));
    }) || null;
  }

  function findVideoMountAnchor() {
    const featuredLabel = findLabelByText(/^featured property$/i) || findLabelByText(/featured property/i);
    if (featuredLabel) {
      let node = featuredLabel.closest("div") || featuredLabel.parentElement;
      for (let i = 0; i < 8 && node; i++) {
        const text = normStr(node.textContent).toLowerCase();
        const hasCheckbox = !!node.querySelector('input[type="checkbox"], button[role="switch"], [aria-checked]');
        if (text.includes("featured property") && hasCheckbox) {
          return node;
        }
        node = node.parentElement;
      }
    }

    const propertyImagesLabel = findLabelByText(/^property images?$/i) || findLabelByText(/property images?/i);
    if (propertyImagesLabel) {
      let node = propertyImagesLabel.closest("div") || propertyImagesLabel.parentElement;
      for (let i = 0; i < 8 && node; i++) {
        const text = normStr(node.textContent).toLowerCase();
        const hasFileInput = !!node.querySelector('input[type="file"]');
        if (text.includes("property image") && hasFileInput) {
          return node;
        }
        node = node.parentElement;
      }
      return propertyImagesLabel.closest("div") || propertyImagesLabel.parentElement || propertyImagesLabel;
    }

    const yearBuiltLabel = findLabelByText(/^year built$/i);
    if (yearBuiltLabel) {
      let node = yearBuiltLabel.closest("div") || yearBuiltLabel.parentElement;
      for (let i = 0; i < 6 && node; i++) {
        const text = normStr(node.textContent).toLowerCase();
        const hasInput = !!node.querySelector('input, textarea, select');
        if (text.includes("year built") && hasInput) {
          return node;
        }
        node = node.parentElement;
      }
    }

    const nativeFeaturesRoot = findNativeFeaturesSectionRoot();
    if (nativeFeaturesRoot) return nativeFeaturesRoot;

    return document.querySelector("form");
  }

  function getVideoInput() {
    return document.getElementById("propertyVideoUrlInput");
  }

  function buildVideoUI() {
    const wrap = document.createElement("div");
    wrap.id = "property-video-url-patch";
    wrap.style.marginTop = "14px";

    wrap.innerHTML = `
      <label for="propertyVideoUrlInput" style="display:block;font-size:14px;font-weight:600;margin-bottom:6px;">Video URL</label>
      <input
        id="propertyVideoUrlInput"
        type="url"
        placeholder="Paste YouTube, Vimeo, or Telegram video link"
        style="width:100%;padding:10px 12px;border:1px solid rgba(0,0,0,0.15);border-radius:8px;font-size:14px;background:#fff;"
      />
      <div style="margin-top:6px;font-size:12px;opacity:.75;line-height:1.4;">
        Optional: this link will be saved to the property and shown in the website Video panel.
      </div>
    `;

    return wrap;
  }

  function dedupeVideoBoxes() {
    const boxes = Array.from(document.querySelectorAll("#property-video-url-patch"));
    if (boxes.length <= 1) return;
    for (let i = 1; i < boxes.length; i++) boxes[i]?.remove();
  }

  function ensureVideoInput() {
    if (!isAdminPropertiesPage()) return;
    dedupeVideoBoxes();
    let box = document.getElementById("property-video-url-patch");
    const anchor = findVideoMountAnchor();
    if (!anchor) return;

    if (!box) {
      box = buildVideoUI();
    }

    const parent = anchor.parentElement || document.querySelector("form");
    if (parent && box.previousElementSibling !== anchor) {
      if (anchor.insertAdjacentElement) {
        anchor.insertAdjacentElement("afterend", box);
      } else {
        parent.appendChild(box);
      }
    }

    const input = getVideoInput();
    if (input && !input.dataset.videoPatchBound) {
      input.dataset.videoPatchBound = "1";
      input.addEventListener("input", () => {
        window.__propertyVideoUrlValue = input.value || "";
      });
      input.addEventListener("change", () => {
        window.__propertyVideoUrlValue = input.value || "";
      });
    }
  }

  async function fetchExistingPropertyIfEdit() {
    const id = getPropertyIdFromUrl();
    if (!id) return null;

    const urlsToTry = [
      `/api/admin/properties/${id}`,
      `/api/properties/${id}`,
    ];

    for (const url of urlsToTry) {
      try {
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) continue;
        const data = await res.json();
        const property = data?.property || data;
        return {
          features: parseFeaturesAny(property?.features),
          videoUrl: normStr(property?.videoUrl || property?.video_url || ""),
        };
      } catch {}
    }
    return null;
  }

  function buildAmenitiesUI({ initialSelected = [] } = {}) {
    const selectedSet = new Set((initialSelected || []).map(x => normStr(x).toLowerCase()));

    const container = document.createElement("div");
    container.id = "amenities-features-patch";
    container.style.marginTop = "10px";
    container.style.border = "1px solid rgba(0,0,0,0.08)";
    container.style.borderRadius = "10px";
    container.style.padding = "14px";

    const title = document.createElement("div");
    title.style.fontWeight = "700";
    title.style.marginBottom = "10px";
    title.textContent = "Amenities & Features";
    container.appendChild(title);

    const grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(auto-fit, minmax(180px, 1fr))";
    grid.style.gap = "10px 14px";
    container.appendChild(grid);

    function addAmenity(name, checked) {
      const label = document.createElement("label");
      label.style.display = "flex";
      label.style.alignItems = "center";
      label.style.gap = "8px";
      label.style.fontSize = "14px";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = name;
      cb.checked = !!checked;
      cb.setAttribute("data-amenity", "1");

      const span = document.createElement("span");
      span.textContent = name;

      label.appendChild(cb);
      label.appendChild(span);
      grid.appendChild(label);
    }

    for (const a of DEFAULT_AMENITIES) addAmenity(a, selectedSet.has(a.toLowerCase()));

    const addRow = document.createElement("div");
    addRow.style.display = "flex";
    addRow.style.gap = "10px";
    addRow.style.marginTop = "14px";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Add new amenity (e.g. Solar, CCTV)";
    input.style.flex = "1";
    input.style.padding = "10px 12px";
    input.style.border = "1px solid rgba(0,0,0,0.15)";
    input.style.borderRadius = "8px";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "Add";
    btn.style.padding = "10px 14px";
    btn.style.borderRadius = "8px";
    btn.style.border = "1px solid rgba(0,0,0,0.2)";
    btn.style.background = "white";
    btn.style.cursor = "pointer";

    btn.addEventListener("click", () => {
      const name = normStr(input.value);
      if (!name) return;
      input.value = "";
      const exists = Array.from(container.querySelectorAll('input[type="checkbox"][data-amenity="1"]'))
        .some(c => normStr(c.value).toLowerCase() === name.toLowerCase());
      if (exists) return;
      addAmenity(name, true);
    });

    addRow.appendChild(input);
    addRow.appendChild(btn);
    container.appendChild(addRow);

    const note = document.createElement("div");
    note.style.marginTop = "10px";
    note.style.fontSize = "12px";
    note.style.opacity = "0.75";
    note.textContent = "Selected amenities will be saved inside the property Features field.";
    container.appendChild(note);

    return container;
  }

  function dedupeAmenitiesBoxes() {
    const boxes = Array.from(document.querySelectorAll("#amenities-features-patch"));
    if (boxes.length <= 1) return;
    for (let i = 1; i < boxes.length; i++) boxes[i]?.remove();
  }

  async function injectAmenitiesIfNeeded() {
    if (!isAdminPropertiesPage()) return;

    dedupeAmenitiesBoxes();
    if (document.getElementById("amenities-features-patch")) {
      const root = findNativeFeaturesSectionRoot();
      const row = root ? findFeatureInputRow(root) : null;
      hideOldFeaturesUI(root, row);
      return;
    }

    const root = findNativeFeaturesSectionRoot();
    if (!root) return;

    const headingEl = findNativeHeadingEl();
    const featureRow = findFeatureInputRow(root);

    let initial = [];
    try {
      const existing = await fetchExistingPropertyIfEdit();
      if (existing?.features?.length) initial = existing.features;
    } catch {}

    const ui = buildAmenitiesUI({ initialSelected: initial });

    if (featureRow && featureRow.insertAdjacentElement) {
      featureRow.insertAdjacentElement("afterend", ui);
    } else if (headingEl && headingEl.insertAdjacentElement) {
      headingEl.insertAdjacentElement("afterend", ui);
    } else {
      root.appendChild(ui);
    }

    hideOldFeaturesUI(root, featureRow);
  }

  async function prefillVideoIfEdit() {
    if (!isAdminPropertiesPage()) return;
    const input = getVideoInput();
    if (!input || input.dataset.prefilled === "1") return;

    try {
      const existing = await fetchExistingPropertyIfEdit();
      const videoUrl = normStr(existing?.videoUrl || "");
      if (videoUrl && !input.value) {
        input.value = videoUrl;
        window.__propertyVideoUrlValue = videoUrl;
      }
      input.dataset.prefilled = "1";
    } catch {}
  }

  const _fetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    try {
      const url = typeof input === "string" ? input : (input?.url || "");
      const method = (init?.method || (typeof input !== "string" ? input?.method : "") || "GET").toUpperCase();
      const isWrite = method === "POST" || method === "PUT" || method === "PATCH";
      const isPropertiesApi =
        /\/api\/properties(\/\d+)?$/i.test(url) ||
        /\/api\/admin\/properties(\/\d+)?$/i.test(url);

      if (isWrite && isPropertiesApi && init?.body && typeof init.body === "string") {
        const ct = (init.headers && (init.headers["Content-Type"] || init.headers["content-type"])) || "";
        if (ct.includes("application/json")) {
          const bodyObj = JSON.parse(init.body);

          const numericKeys = ["bedrooms", "bathrooms", "squareFeet"];
          for (const k of numericKeys) {
            if (bodyObj[k] === "" || bodyObj[k] == null) bodyObj[k] = 0;
          }

          const amenitiesUI = document.getElementById("amenities-features-patch");
          const selectedAmenities = getSelectedAmenitiesFromDom(amenitiesUI);
          const existingFeatures = parseFeaturesAny(bodyObj.features);
          bodyObj.features = uniq([...(existingFeatures || []), ...(selectedAmenities || [])]);

          const videoInput = getVideoInput();
          const videoUrl = normStr((videoInput && videoInput.value) || window.__propertyVideoUrlValue || bodyObj.videoUrl || bodyObj.video_url || "");
          bodyObj.videoUrl = videoUrl;
          bodyObj.video_url = videoUrl;

          init.body = JSON.stringify(bodyObj);
        }
      }
    } catch {
      // never break app requests
    }
    return _fetch(input, init);
  };

  async function injectAll() {
    if (!isAdminPropertiesPage()) return;
    ensureVideoInput();
    await injectAmenitiesIfNeeded();
    ensureVideoInput();
    await prefillVideoIfEdit();
  }

  const observer = new MutationObserver(() => {
    if (window[PATCH_KEY].lastPath !== location.pathname) {
      window[PATCH_KEY].lastPath = location.pathname;
    }
    injectAll();
  });

  function start() {
    try {
      observer.observe(document.documentElement, { childList: true, subtree: true });
    } catch {}
    injectAll();
    setTimeout(injectAll, 400);
    setTimeout(injectAll, 1200);
    setTimeout(injectAll, 2500);
    setInterval(() => {
      if (!isAdminPropertiesPage()) return;
      ensureVideoInput();
    }, 1500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
