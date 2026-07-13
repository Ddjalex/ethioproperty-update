(function () {
  var PATCH_KEY = '__paAIVoiceAssistant_v3__';
  if (window[PATCH_KEY]) return;
  window[PATCH_KEY] = true;

  function init() {

  var lang = 'en';
  var messages = [];
  var isOpen = false;
  var greetingShown = false; // prevent double-greeting on rapid open
  var isSpeaking = false;
  var synthesis = window.speechSynthesis;
  var currentUtterance = null;
  var currentAudio = null;
  var sessionVoice = localStorage.getItem('pa_tts_voice') || null; // persisted: 'gemini'|'google'|null
  var langPickerShown = false;

  var T = {
    en: {
      btnTitle: 'AI Property Assistant',
      header: 'Ethio Property AI',
      subtitle: 'Your smart property guide',
      placeholder: 'Ask about properties...',
      send: 'Send',
      voiceTitle: 'Start live voice conversation',
      stopVoiceTitle: 'End live voice conversation',
      langToggle: 'አማርኛ',
      greeting: '',
      liveConnecting: '🎙️ Connecting...',
      liveActive: '🔴 Live — speak naturally...',
      thinking: 'Thinking...',
      micUnsupported: 'Voice input is not supported in this browser. Please try Chrome.',
      micDenied: 'Microphone access was denied. Please allow microphone in your browser settings.',
      liveFailed: '⚠️ Live voice connection failed. Please type your message instead.',
      liveEnded: 'Live voice session ended. You can keep typing.',
      close: 'Close',
      poweredBy: 'Powered by Gemini AI',
    },
    am: {
      btnTitle: 'AI ረዳት',
      header: 'Ethio Property AI',
      subtitle: 'የርስዎ የንብረት ረዳት',
      placeholder: 'ስለ ቤቶች ይጠይቁ...',
      send: 'ላክ',
      voiceTitle: 'ቀጥታ የድምጽ ውይይት ጀምር',
      stopVoiceTitle: 'ቀጥታ የድምጽ ውይይት አቁም',
      langToggle: 'English',
      greeting: '',
      liveConnecting: '🎙️ በመገናኘት ላይ...',
      liveActive: '🔴 ቀጥታ — በተፈጥሮ ይናገሩ...',
      thinking: 'እያስብኩ...',
      micUnsupported: 'ድምጽ ግብዓት በዚህ አሳሽ አይሰራም። Chrome ይጠቀሙ።',
      micDenied: 'ማይክሮፎን ፈቃድ ተከልክሏል። እባክዎ ፈቃዱን ፍቀዱ።',
      liveFailed: '⚠️ ቀጥታ የድምጽ ግንኙነት አልተሳካም። እባክዎ በጽሁፍ ይላኩ።',
      liveEnded: 'ቀጥታ የድምጽ ውይይት አብቅቷል። በጽሁፍ መቀጠል ይችላሉ።',
      close: 'ዝጋ',
      poweredBy: 'በ Gemini AI የሚሰራ',
    }
  };

  function t(key) { return (T[lang] && T[lang][key]) || T.en[key] || ''; }
  function hasAmharic(text) { return /[\u1200-\u137F]/.test(text || ''); }

  /* ── Styles ─────────────────────────────────── */
  var style = document.createElement('style');
  style.textContent = `
    .pa-stuck {
      position: fixed !important;
      top: 0 !important; left: 0 !important; right: 0 !important;
      width: 100% !important;
      z-index: 9999 !important;
      background: #fff !important;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08) !important;
    }

    /* ── Panel ── */
    #pa-ai-panel {
      position: fixed;
      left: 20px; bottom: 96px;
      top: 24px;
      width: 390px;
      max-height: calc(100vh - 132px);
      background: #ffffff;
      border-radius: 24px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(99,102,241,0.12);
      display: flex; flex-direction: column;
      z-index: 10001; overflow: hidden;
      transform: scale(0.92) translateY(16px);
      opacity: 0; pointer-events: none;
      transition: all 0.28s cubic-bezier(0.34,1.56,0.64,1);
      transform-origin: bottom left;
      border: 1px solid rgba(99,102,241,0.12);
    }
    #pa-ai-panel.open {
      transform: scale(1) translateY(0);
      opacity: 1; pointer-events: all;
    }

    /* ── Header ── */
    .pa-header {
      background: linear-gradient(135deg, #0F1729 0%, #16213b 55%, #1d2b4a 100%);
      padding: 14px 18px 12px;
      display: flex; align-items: center; gap: 12px;
      position: relative; overflow: hidden;
    }
    .pa-header::before {
      content: '';
      position: absolute; top: -30px; right: -30px;
      width: 120px; height: 120px;
      background: rgba(255,255,255,0.07);
      border-radius: 50%;
    }
    .pa-header::after {
      content: '';
      position: absolute; bottom: -20px; left: 40px;
      width: 80px; height: 80px;
      background: rgba(255,255,255,0.05);
      border-radius: 50%;
    }
    .pa-hdr-avatar {
      width: 40px; height: 40px; border-radius: 12px;
      background: #fff;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; padding: 5px; overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.18);
      position: relative; z-index: 1;
    }
    .pa-hdr-avatar img { width: 100%; height: 100%; object-fit: contain; display: block; }
    .pa-hdr-text { flex: 1; position: relative; z-index: 1; }
    .pa-hdr-title { font-size: 15px; font-weight: 800; color: #fff; line-height: 1.2; }
    .pa-hdr-sub { font-size: 11px; color: rgba(255,255,255,0.75); margin-top: 1px; }
    .pa-hdr-actions { display: flex; gap: 6px; align-items: center; position: relative; z-index: 1; }
    .pa-lang-btn {
      background: rgba(144,130,75,0.28);
      border: 1px solid rgba(144,130,75,0.55);
      color: #fff; border-radius: 12px;
      padding: 4px 10px; font-size: 11px;
      cursor: pointer; font-weight: 700;
      transition: background 0.15s;
    }
    .pa-lang-btn:hover { background: rgba(144,130,75,0.45); }
    .pa-close-btn {
      width: 28px; height: 28px; border-radius: 50%;
      background: rgba(255,255,255,0.18);
      border: 1px solid rgba(255,255,255,0.25);
      color: rgba(255,255,255,0.9);
      cursor: pointer; font-size: 14px;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s;
      line-height: 1;
    }
    .pa-close-btn:hover { background: rgba(255,255,255,0.35); color: #fff; }

    /* ── Online indicator ── */
    .pa-online-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #4ade80;
      box-shadow: 0 0 0 2px rgba(74,222,128,0.3);
      animation: pa-pulse 2s infinite;
      display: inline-block; margin-right: 5px;
    }
    @keyframes pa-pulse { 0%,100%{box-shadow:0 0 0 2px rgba(74,222,128,0.3)} 50%{box-shadow:0 0 0 5px rgba(74,222,128,0.1)} }

    /* ── Messages ── */
    .pa-msgs {
      flex: 1 1 auto; overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;
      scroll-behavior: smooth;
      padding: 16px 14px;
      display: flex; flex-direction: column; gap: 3px;
      min-height: 0;
      background: #f8faff;
    }
    .pa-msgs::-webkit-scrollbar { width: 4px; }
    .pa-msgs::-webkit-scrollbar-track { background: transparent; }
    .pa-msgs::-webkit-scrollbar-thumb { background: #c7d2fe; border-radius: 4px; }

    .pa-msg-group { display: flex; flex-direction: column; gap: 3px; margin-bottom: 9px; }

    .pa-msg-row {
      display: flex; align-items: flex-end; gap: 8px;
      animation: pa-msg-in 0.32s cubic-bezier(0.22,1,0.36,1) both;
    }
    .pa-msg-row.user { flex-direction: row-reverse; }
    @keyframes pa-msg-in {
      from { opacity: 0; transform: translateY(10px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @media (prefers-reduced-motion: reduce) {
      .pa-msg-row { animation: none; }
    }

    .pa-msg-avatar {
      width: 30px; height: 30px; border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; flex-shrink: 0;
      box-shadow: 0 2px 6px rgba(99,102,241,0.35);
    }

    .pa-msg {
      max-width: 80%;
      padding: 11px 14px;
      border-radius: 18px;
      font-size: 13.5px; line-height: 1.55;
      word-break: break-word;
      position: relative;
    }
    .pa-msg.ai {
      background: #fff;
      color: #1e293b;
      border-bottom-left-radius: 5px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.07);
      border: 1px solid rgba(99,102,241,0.1);
    }
    .pa-msg.user {
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: #fff;
      border-bottom-right-radius: 5px;
      box-shadow: 0 3px 10px rgba(79,70,229,0.3);
    }

    /* ── Timestamps ── */
    .pa-msg-time {
      font-size: 10px; color: #a3aed0;
      padding: 0 40px; margin-top: -1px;
      opacity: 0.85; user-select: none;
    }
    .pa-msg-row.user + .pa-msg-time { text-align: right; }

    /* ── Quick-reply suggestions ── */
    .pa-quick-replies {
      display: flex; flex-wrap: wrap; gap: 6px;
      padding: 2px 4px 8px 40px;
      animation: pa-msg-in 0.32s cubic-bezier(0.22,1,0.36,1) both;
    }
    .pa-qr-chip {
      padding: 6px 12px; border-radius: 14px;
      background: #fff; border: 1.5px solid #c7d2fe;
      color: #4338ca; font-size: 11.5px; font-weight: 600;
      cursor: pointer; font-family: inherit;
      transition: all 0.15s;
    }
    .pa-qr-chip:hover { background: #eef2ff; border-color: #818cf8; transform: translateY(-1px); }

    /* ── Typing indicator ── */
    .pa-typing-dots {
      display: inline-flex; gap: 4px; align-items: center;
      padding: 4px 2px;
    }
    .pa-typing-dots span {
      width: 7px; height: 7px; border-radius: 50%;
      background: #94a3b8;
      animation: pa-bounce 1.2s infinite;
    }
    .pa-typing-dots span:nth-child(2) { animation-delay: 0.2s; }
    .pa-typing-dots span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes pa-bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }

    /* ── Live voice indicator ── */
    .pa-live-banner {
      display: none; align-items: center; justify-content: center; gap: 7px;
      background: #fef2f2; color: #b91c1c; font-size: 11.5px; font-weight: 700;
      padding: 7px 12px; border-bottom: 1px solid rgba(185,28,28,0.15);
    }
    .pa-live-banner.on { display: flex; }
    .pa-live-dot {
      width: 8px; height: 8px; border-radius: 50%; background: #dc2626;
      animation: pa-live-pulse 1.2s infinite;
    }
    @keyframes pa-live-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.5); }
      50% { box-shadow: 0 0 0 5px rgba(220,38,38,0); }
    }

    /* ── Status bar ── */
    .pa-status {
      text-align: center; font-size: 11.5px;
      color: #7c3aed; padding: 5px 12px;
      font-weight: 600; min-height: 24px;
      background: rgba(99,102,241,0.04);
      border-top: 1px solid rgba(99,102,241,0.06);
      transition: opacity 0.2s;
    }

    /* ── Input area ── */
    .pa-input-wrap {
      background: #fff;
      border-top: 1px solid rgba(99,102,241,0.1);
      padding: 12px 14px 14px;
    }
    .pa-input-row {
      display: flex; gap: 8px; align-items: center;
    }
    .pa-input {
      flex: 1;
      border: 1.5px solid #e2e8f0;
      border-radius: 22px;
      padding: 10px 16px;
      font-size: 13.5px;
      outline: none;
      font-family: inherit;
      color: #1e293b;
      background: #f8faff;
      transition: border-color 0.2s, box-shadow 0.2s, border-radius 0.15s;
      resize: none;
      max-height: 108px;
      min-height: 40px;
      line-height: 1.4;
      overflow-y: auto;
    }
    .pa-input.pa-multiline { border-radius: 18px; }
    .pa-input:focus {
      border-color: #8b5cf6;
      box-shadow: 0 0 0 3px rgba(139,92,246,0.12);
      background: #fff;
    }
    .pa-input::placeholder { color: #94a3b8; }

    .pa-icon-btn {
      width: 40px; height: 40px; border-radius: 50%;
      border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 17px; flex-shrink: 0;
      transition: all 0.2s ease;
    }
    .pa-send-btn {
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: #fff;
      box-shadow: 0 3px 10px rgba(79,70,229,0.35);
    }
    .pa-send-btn:hover { transform: scale(1.08); box-shadow: 0 4px 14px rgba(79,70,229,0.45); }
    .pa-send-btn:active { transform: scale(0.96); }

    /* ── Single voice button: idle → connecting → live ── */
    .pa-voice-btn {
      background: #f1f5f9; color: #ef4444;
      border: 1.5px solid #fecaca;
    }
    .pa-voice-btn:hover { background: #fef2f2; color: #dc2626; border-color: #fca5a5; }
    .pa-voice-btn.connecting {
      background: #fff7ed; color: #ea580c; border-color: #fed7aa;
      animation: pa-live-pulse 0.9s infinite;
    }
    .pa-voice-btn.live-active {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: #fff; border-color: transparent;
      animation: pa-live-pulse 1.5s infinite;
    }
    @keyframes pa-live-pulse {
      0%,100% { box-shadow: 0 0 0 4px rgba(239,68,68,0.25); }
      50% { box-shadow: 0 0 0 9px rgba(239,68,68,0.07); }
    }

    /* ── Footer credit ── */
    .pa-footer {
      text-align: center; font-size: 10px; color: #94a3b8;
      padding: 6px 14px 8px; background: #fff;
    }
    .pa-footer span { display: inline-flex; align-items: center; gap: 4px; }

    /* ── Mobile ── */
    @media (max-width: 480px) {
      #pa-ai-panel { width: calc(100vw - 20px); left: 10px; bottom: 82px; top: 16px; border-radius: 20px; }
    }

    /* ── Welcome card ── */
    .pa-welcome-card {
      background: linear-gradient(135deg, #eef2ff, #f5f3ff);
      border: 1px solid #c7d2fe;
      border-radius: 16px; padding: 16px;
      text-align: center; margin: 4px 0;
    }
    .pa-welcome-card .pa-wc-icon { font-size: 32px; margin-bottom: 8px; }
    .pa-welcome-card .pa-wc-title { font-size: 14px; font-weight: 700; color: #4338ca; margin-bottom: 4px; }
    .pa-welcome-card .pa-wc-desc { font-size: 12px; color: #6366f1; line-height: 1.5; }

    /* ── Quick chips ── */
    .pa-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; justify-content: center; }
    .pa-chip {
      padding: 6px 12px; border-radius: 14px;
      background: #fff; border: 1.5px solid #c7d2fe;
      color: #4338ca; font-size: 11.5px; font-weight: 600;
      cursor: pointer; font-family: inherit;
      transition: all 0.15s;
    }
    .pa-chip:hover { background: #eef2ff; border-color: #818cf8; transform: translateY(-1px); }

    /* ── AI Contact Capture Card ── */
    .pa-contact-card {
      background: linear-gradient(135deg,#f0fdf4,#ecfdf5);
      border: 1.5px solid #6ee7b7;
      border-radius: 16px; padding: 16px; margin: 4px 0;
    }
    .pa-contact-card-title { font-size: 13px; font-weight: 700; color: #065f46; margin-bottom: 4px; }
    .pa-contact-card-sub { font-size: 11.5px; color: #047857; margin-bottom: 10px; line-height: 1.4; }
    .pa-contact-card input {
      width: 100%; border: 1.5px solid #a7f3d0; border-radius: 8px;
      padding: 8px 10px; font-size: 13px; font-family: inherit;
      outline: none; margin-bottom: 7px; background: #fff;
      transition: border-color 0.15s; box-sizing: border-box;
    }
    .pa-contact-card input:focus { border-color: #34d399; }
    .pa-contact-card-submit {
      width: 100%; padding: 9px; border-radius: 9px;
      background: linear-gradient(135deg,#059669,#10b981);
      color: #fff; border: none; font-size: 13px; font-weight: 700;
      cursor: pointer; font-family: inherit; margin-top: 2px;
      transition: opacity 0.15s;
    }
    .pa-contact-card-submit:hover { opacity: 0.9; }
    .pa-contact-card-skip {
      display: block; text-align: center; font-size: 11px;
      color: #6b7280; cursor: pointer; margin-top: 8px;
      background: none; border: none; font-family: inherit; width: 100%;
    }
    .pa-contact-card-skip:hover { color: #374151; text-decoration: underline; }
    .pa-contact-card-success { font-size: 13px; color: #065f46; text-align: center; font-weight: 600; padding: 4px 0; }

    /* ── Language Picker ── */
    #pa-lang-picker {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      flex: 1; padding: 20px 20px; gap: 0;
      background: linear-gradient(160deg, #f7f7f5 0%, #f2f1ec 100%);
    }
    .pa-lp-icon { width: 52px; height: 52px; margin-bottom: 12px; }
    .pa-lp-icon img { width: 100%; height: 100%; object-fit: contain; display: block; }
    .pa-lp-title {
      font-size: 16px; font-weight: 800; color: #0F1729;
      margin-bottom: 4px; text-align: center;
    }
    .pa-lp-sub {
      font-size: 12.5px; color: #6b7280; text-align: center;
      margin-bottom: 16px; line-height: 1.45;
    }
    .pa-lp-toggle {
      display: inline-flex; background: #fff; border-radius: 999px;
      padding: 4px; gap: 2px;
      border: 1px solid rgba(15,23,41,0.1);
      box-shadow: 0 4px 14px rgba(15,23,41,0.1);
    }
    .pa-lp-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 18px; border-radius: 999px;
      border: none; background: transparent; color: #0F1729;
      cursor: pointer; font-family: inherit;
      font-size: 13px; font-weight: 700;
      transition: background 0.18s, color 0.18s;
    }
    .pa-lp-btn:hover { background: #0F1729; color: #fff; }
    .pa-lp-flag { font-size: 15px; line-height: 1; }
  `;
  document.head.appendChild(style);

  /* ── Build panel DOM ─────────────────────────── */
  var panel = document.createElement('div');
  panel.id = 'pa-ai-panel';
  panel.innerHTML = `
    <div class="pa-header">
      <div class="pa-hdr-avatar"><img src="/assets/ethioproperty.png" alt="Ethio Property" /></div>
      <div class="pa-hdr-text">
        <div class="pa-hdr-title" id="pa-hdr-title">
          <span class="pa-online-dot"></span>${t('header')}
        </div>
        <div class="pa-hdr-sub" id="pa-hdr-sub">${t('subtitle')}</div>
      </div>
      <div class="pa-hdr-actions">
        <button class="pa-lang-btn" id="pa-lang">${t('langToggle')}</button>
        <button class="pa-close-btn" id="pa-close" title="${t('close')}">✕</button>
      </div>
    </div>
    <div class="pa-live-banner" id="pa-live-banner">
      <span class="pa-live-dot"></span>${t('liveActive')}
    </div>
    <div class="pa-msgs" id="pa-msgs"></div>
    <div class="pa-status" id="pa-status"></div>
    <div class="pa-input-wrap">
      <div class="pa-input-row">
        <textarea class="pa-input" id="pa-input" placeholder="${t('placeholder')}" rows="1" autocomplete="off"></textarea>
        <button class="pa-icon-btn pa-voice-btn" id="pa-voice" title="${t('voiceTitle')}">🎙️</button>
        <button class="pa-icon-btn pa-send-btn" id="pa-send" title="${t('send')}">➤</button>
      </div>
    </div>
    <div class="pa-footer"><span>✦ ${t('poweredBy')}</span></div>
  `;
  document.body.appendChild(panel);

  /* ── Element refs ───────────────────────────── */
  var msgsEl  = document.getElementById('pa-msgs');
  var inputEl = document.getElementById('pa-input');
  var sendEl  = document.getElementById('pa-send');
  var voiceEl = document.getElementById('pa-voice');
  var closeEl = document.getElementById('pa-close');
  var langEl  = document.getElementById('pa-lang');
  var statusEl  = document.getElementById('pa-status');
  var liveBannerEl = document.getElementById('pa-live-banner');

  function showLiveIndicator(on) {
    if (!liveBannerEl) return;
    liveBannerEl.classList.toggle('on', !!on);
  }
  var titleEl   = document.getElementById('pa-hdr-title');
  var subEl     = document.getElementById('pa-hdr-sub');

  /* ── Sticky nav ─────────────────────────────── */
  /* Note: the navbar "Ask AI" button (desktop + mobile pill) was removed.
     The only way to open Ask AI is now the bottom-left avatar launcher from
     ask-ai-bottom-left-button-patch.js, which calls window.__paAskAI(). */
  var stuckNav = null;
  function pinNav() {
    var candidates = document.querySelectorAll('nav, header');
    var nav = null;
    for (var i = 0; i < candidates.length; i++) {
      var el = candidates[i];
      if (el.id === 'pa-nav-bar' || el.closest('#pa-ai-panel')) continue;
      if (el.querySelector('img') && el.querySelectorAll('a').length >= 2) { nav = el; break; }
    }
    if (!nav) return;
    if (stuckNav && stuckNav !== nav) stuckNav.classList.remove('pa-stuck');
    stuckNav = nav;
    if (!nav.classList.contains('pa-stuck')) nav.classList.add('pa-stuck');
    var h = nav.getBoundingClientRect().height || 64;
    var spacer = document.getElementById('pa-nav-spacer');
    if (!spacer) {
      spacer = document.createElement('div');
      spacer.id = 'pa-nav-spacer'; spacer.style.cssText = 'width:100%;flex-shrink:0;';
      nav.parentElement.insertBefore(spacer, nav);
    }
    spacer.style.height = h + 'px';
  }

  function injectAll() { pinNav(); }
  injectAll();
  [500, 1500, 3000].forEach(function (d) { setTimeout(injectAll, d); });
  window.addEventListener('resize', injectAll);

  var _origPush = history.pushState.bind(history);
  history.pushState = function () {
    _origPush.apply(history, arguments);
    setTimeout(injectAll, 300);
    setTimeout(updateVisibilityForRoute, 100);
  };
  window.addEventListener('popstate', function () {
    setTimeout(injectAll, 300);
    setTimeout(updateVisibilityForRoute, 100);
  });

  new MutationObserver(function () {
    injectAll();
  }).observe(document.documentElement, { childList: true, subtree: true });

  /* ── Message rendering ──────────────────────── */
  var AI_AVATAR = '🏠'; // reuse the welcome-screen house icon so the assistant reads as one coherent identity

  function scrollToBottom() {
    /* rAF so layout (e.g. images, chip rows) settles before measuring scrollHeight */
    requestAnimationFrame(function () {
      msgsEl.scrollTo({ top: msgsEl.scrollHeight, behavior: 'smooth' });
    });
  }

  function formatTime(d) {
    try {
      return d.toLocaleTimeString(lang === 'am' ? 'am-ET' : 'en-US', { hour: 'numeric', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  }

  function addMessage(role, html, isTyping) {
    if (isTyping) {
      var existing = document.getElementById('pa-typing-row');
      if (existing) return existing;
      var row = document.createElement('div');
      row.className = 'pa-msg-row';
      row.id = 'pa-typing-row';
      row.innerHTML = '<div class="pa-msg-avatar">' + AI_AVATAR + '</div><div class="pa-msg ai"><div class="pa-typing-dots"><span></span><span></span><span></span></div></div>';
      msgsEl.appendChild(row);
      scrollToBottom();
      return row;
    }
    var group = document.createElement('div');
    group.className = 'pa-msg-group';
    var row = document.createElement('div');
    row.className = 'pa-msg-row ' + role;
    var avatarHtml = role === 'ai'
      ? '<div class="pa-msg-avatar">' + AI_AVATAR + '</div>'
      : '<div class="pa-msg-avatar" style="background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;font-size:13px;">👤</div>';
    var msgDiv = document.createElement('div');
    msgDiv.className = 'pa-msg ' + role;
    msgDiv.textContent = html;
    if (role === 'ai') {
      row.innerHTML = avatarHtml;
      row.appendChild(msgDiv);
    } else {
      row.appendChild(msgDiv);
      row.innerHTML += avatarHtml;
    }
    var timeEl = document.createElement('div');
    timeEl.className = 'pa-msg-time';
    timeEl.textContent = formatTime(new Date());
    group.appendChild(row);
    group.appendChild(timeEl);
    msgsEl.appendChild(group);
    scrollToBottom();
    return row;
  }

  function removeTyping() {
    var el = document.getElementById('pa-typing-row');
    if (el) el.remove();
  }

  function setStatus(text) { statusEl.textContent = text || ''; }

  /* ── Post-reply quick-reply suggestions ── */
  var QUICK_REPLIES = {
    en: ['Show me apartments', "What's the price range?", 'Schedule a viewing'],
    am: ['አፓርታማ አሳየኝ', 'የዋጋ ክልል ምንድን ነው?', 'ለመጎብኘት ቀጠሮ ያዙ']
  };

  /* ── AI contact capture state ── */
  var aiReplyCount = 0;
  var contactCardShown = !!localStorage.getItem('pa_contact_captured_v1');
  var CONTACT_CARD_AFTER = 3;

  function removeQuickReplies() {
    var el = document.getElementById('pa-quick-replies');
    if (el) el.remove();
  }

  function showQuickReplies() {
    removeQuickReplies();
    var suggestions = QUICK_REPLIES[lang] || QUICK_REPLIES.en;
    var wrap = document.createElement('div');
    wrap.className = 'pa-quick-replies';
    wrap.id = 'pa-quick-replies';
    suggestions.forEach(function (s) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'pa-qr-chip';
      chip.textContent = s;
      chip.addEventListener('click', function () {
        removeQuickReplies();
        inputEl.value = s;
        sendMessage();
      });
      wrap.appendChild(chip);
    });
    msgsEl.appendChild(wrap);
    scrollToBottom();

    // Count AI replies and show contact card after threshold
    aiReplyCount++;
    if (aiReplyCount >= CONTACT_CARD_AFTER && !contactCardShown && !document.getElementById('pa-contact-card')) {
      setTimeout(showContactCapture, 400);
    }
  }

  function showContactCapture() {
    if (contactCardShown || document.getElementById('pa-contact-card')) return;
    contactCardShown = true;
    var isAm = lang === 'am';
    var card = document.createElement('div');
    card.className = 'pa-contact-card';
    card.id = 'pa-contact-card';

    var titleEl = document.createElement('div');
    titleEl.className = 'pa-contact-card-title';
    titleEl.textContent = isAm ? '📩 ዝርዝሮች ለማግኘት ይፈልጋሉ?' : '📩 Want us to send you matching listings?';

    var subEl = document.createElement('div');
    subEl.className = 'pa-contact-card-sub';
    subEl.textContent = isAm
      ? 'ስምዎን እና ስልክ ቁጥርዎን ያስቀምጡ — ተስማሚ ቤቶችን እናሳውቅዎ።'
      : "Drop your name & phone — we'll reach out with properties that fit.";

    var nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = isAm ? 'ሙሉ ስም' : 'Your name';
    nameInput.maxLength = 80;

    var phoneInput = document.createElement('input');
    phoneInput.type = 'tel';
    phoneInput.placeholder = isAm ? 'ስልክ ቁጥር (+251...)' : 'Phone number (+251...)';
    phoneInput.maxLength = 20;

    var submitBtn = document.createElement('button');
    submitBtn.type = 'button';
    submitBtn.className = 'pa-contact-card-submit';
    submitBtn.textContent = isAm ? 'ላኩ ✓' : 'Send ✓';

    var skipBtn = document.createElement('button');
    skipBtn.type = 'button';
    skipBtn.className = 'pa-contact-card-skip';
    skipBtn.textContent = isAm ? 'አሁን ላይ ይቅር' : 'Maybe later';

    card.appendChild(titleEl);
    card.appendChild(subEl);
    card.appendChild(nameInput);
    card.appendChild(phoneInput);
    card.appendChild(submitBtn);
    card.appendChild(skipBtn);

    skipBtn.addEventListener('click', function () { card.remove(); });

    submitBtn.addEventListener('click', function () {
      var name = nameInput.value.trim();
      var phone = phoneInput.value.trim();
      if (!name && !phone) { nameInput.focus(); return; }

      localStorage.setItem('pa_contact_captured_v1', '1');

      card.innerHTML = '<div class="pa-contact-card-success">' +
        (isAm ? '✅ አመሰግናለን! በቅርቡ እናነጋግርዎ።' : '✅ Thank you! We\'ll be in touch soon.') +
        '</div>';
      setTimeout(function () { if (card.parentNode) card.remove(); }, 2500);

      // Fire-and-forget — never blocks the chat
      fetch('/api/sheets-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || 'AI Chat Visitor',
          phone: phone || '',
          email: '',
          source: 'Ask AI Chat'
        })
      }).catch(function (e) { console.warn('[AI Contact] Sheets sync failed:', e.message); });
    });

    msgsEl.appendChild(card);
    scrollToBottom();
  }

  /* ── Quick suggestion chips ─────────────────── */
  function showWelcomeCard() {
    var card = document.createElement('div');
    card.id = 'pa-welcome-card';
    card.className = 'pa-welcome-card';
    card.innerHTML = `
      <div class="pa-wc-icon">🏙️</div>
      <div class="pa-wc-title">Welcome to Ethio Property AI</div>
      <div class="pa-wc-desc">I can help you find properties, answer questions about listings in Addis Ababa, and guide your real estate journey.</div>
      <div class="pa-chips">
        <button class="pa-chip">🏠 For Sale</button>
        <button class="pa-chip">🔑 For Rent</button>
        <button class="pa-chip">📍 Bole area</button>
        <button class="pa-chip">💰 Budget options</button>
      </div>
    `;
    card.querySelectorAll('.pa-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        inputEl.value = chip.textContent.replace(/^[^\w\u1200-\u137F]+/, '').trim();
        card.remove();
        sendMessage();
      });
    });
    msgsEl.appendChild(card);
    scrollToBottom();
  }

  /* ── Speech Synthesis ───────────────────────── */
  /* Preferred female voice names for consistency */
  var PREF_FEMALE_VOICES = [
    'Google US English', 'Samantha', 'Karen', 'Moira', 'Tessa',
    'Victoria', 'Fiona', 'Ava', 'Allison', 'Susan',
    'Microsoft Aria Online (Natural)', 'Microsoft Jenny Online (Natural)',
    'Google UK English Female'
  ];

  function getVoiceForLang(targetLang) {
    var voices = synthesis ? synthesis.getVoices() : [];
    var langVoices = voices.filter(function (v) {
      return v.lang === targetLang || v.lang.toLowerCase().startsWith(targetLang.split('-')[0]);
    });
    if (!langVoices.length) return null;
    /* Prefer a known good female voice */
    for (var i = 0; i < PREF_FEMALE_VOICES.length; i++) {
      var found = langVoices.find(function (v) { return v.name === PREF_FEMALE_VOICES[i]; });
      if (found) return found;
    }
    /* Fall back to any voice whose name suggests female */
    var femaleHint = langVoices.find(function (v) {
      return /female|woman|girl|f\b/i.test(v.name);
    });
    if (femaleHint) return femaleHint;
    return langVoices[0] || null;
  }

  function speakWithGoogleTranslate(text, langCode) {
    if (currentAudio) { try { currentAudio.pause(); } catch (e) {} currentAudio = null; }
    isSpeaking = true;
    var url = '/api/ai/tts-google?lang=' + encodeURIComponent(langCode) +
              '&text=' + encodeURIComponent(String(text).slice(0, 1500));
    var audio = new Audio(url);
    currentAudio = audio;
    audio.onended = function () { isSpeaking = false; setStatus(''); currentAudio = null; };
    audio.onerror = function () {
      isSpeaking = false; setStatus(''); currentAudio = null;
      /* Always attempt browser TTS as last resort even without a matching voice */
      speakWithBrowser(text, langCode, 0.9);
    };
    audio.play().catch(function () { isSpeaking = false; setStatus(''); });
  }

  function speakWithBrowser(text, langCode, rate) {
    if (!synthesis) return;
    synthesis.cancel();
    var trySpeak = function () {
      var voice = getVoiceForLang(langCode);
      var utter = new SpeechSynthesisUtterance(text);
      if (voice) utter.voice = voice;
      utter.lang = langCode; utter.rate = rate || 1; utter.pitch = 1;
      currentUtterance = utter; isSpeaking = true;
      utter.onend = function () { isSpeaking = false; setStatus(''); };
      utter.onerror = function () { isSpeaking = false; setStatus(''); };
      synthesis.speak(utter);
    };
    if (synthesis.getVoices().length === 0) {
      synthesis.addEventListener('voiceschanged', function once() {
        synthesis.removeEventListener('voiceschanged', once);
        trySpeak();
      });
    } else { trySpeak(); }
  }

  function speakWithGemini(text) {
    if (currentAudio) { try { currentAudio.pause(); } catch (e) {} currentAudio = null; }
    var isAm = hasAmharic(text);
    isSpeaking = true;
    /* 2-second timeout — fail fast and fall back to Google TTS. */
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 2000) : null;
    fetch('/api/ai/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text, voice: 'Aoede' }),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) {
      if (timer) clearTimeout(timer);
      if (!r.ok) throw new Error('tts ' + r.status);
      return r.blob();
    }).then(function (blob) {
      sessionVoice = 'gemini';
      localStorage.setItem('pa_tts_voice', 'gemini'); // persist for next session
      var url = URL.createObjectURL(blob);
      var audio = new Audio(url);
      currentAudio = audio;
      audio.onended = function () { isSpeaking = false; setStatus(''); URL.revokeObjectURL(url); currentAudio = null; };
      audio.onerror = function () { isSpeaking = false; setStatus(''); URL.revokeObjectURL(url); currentAudio = null; };
      audio.play().catch(function () { isSpeaking = false; setStatus(''); });
    }).catch(function (err) {
      if (timer) clearTimeout(timer);
      console.warn('[AI voice] Gemini TTS failed, locking to Google TTS:', err);
      isSpeaking = false;
      sessionVoice = 'google';
      localStorage.setItem('pa_tts_voice', 'google'); // persist — skip Gemini next time
      speakWithGoogleTranslate(text, isAm ? 'am' : 'en');
    });
  }

  function speak(text) {
    if (!text) return;
    var isAm = lang === 'am' || hasAmharic(text);
    /* For Amharic: always use Google TTS — it handles Ethiopic natively and
       responds in ~100 ms. Gemini TTS consistently fails/times out on Amharic
       so there's no point trying it. */
    if (isAm) {
      speakWithGoogleTranslate(text, 'am');
    } else if (sessionVoice === 'google') {
      speakWithGoogleTranslate(text, 'en');
    } else {
      speakWithGemini(text); // handles both null (first call) and 'gemini' (locked)
    }
  }

  function stopSpeaking() {
    if (synthesis) synthesis.cancel();
    if (currentAudio) { try { currentAudio.pause(); } catch (e) {} currentAudio = null; }
    isSpeaking = false;
  }

  /* ── Language toggle ─────────────────────────── */
  function updateUIText() {
    langEl.textContent = t('langToggle');
    var hdrTitle = '<span class="pa-online-dot"></span>' + t('header');
    titleEl.innerHTML = hdrTitle;
    subEl.textContent = t('subtitle');
    inputEl.placeholder = t('placeholder');
    var hb = document.getElementById('pa-ai-header-btn');
    if (hb) hb.title = t('btnTitle');
    var footer = panel.querySelector('.pa-footer span');
    if (footer) footer.textContent = '✦ ' + t('poweredBy');
    if (voiceEl && !liveActive) voiceEl.title = t('voiceTitle');
  }

  function toggleLang() {
    lang = lang === 'en' ? 'am' : 'en';
    updateUIText();
    fetch('/api/ai/greeting/' + lang, { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : { greeting: '' }; })
      .then(function (data) {
        var g = (data && data.greeting) ? String(data.greeting).trim() : '';
        if (!g) return;
        addMessage('ai', g);
        messages.push({ role: 'assistant', content: g });
        setTimeout(function () { speak(g); }, 200);
      }).catch(function () {});
  }

  /* ── Property filter intent extraction ──────────────────────
     Parses user voice input for property search criteria and
     updates the property listing page filters automatically.
  ─────────────────────────────────────────────────────────── */
  var SUBCITIES = [
    // Official subcities
    'bole','kirkos','yeka','nifas silk lafto','kolfe keranio','gulele','lideta','akaki kality','arada','addis ketema','lemi kura',
    // Actual neighbourhood addresses stored in DB
    'cmc','cmc figa','gofa','jemo','ayat','ayat zone 2',
    'summit','summit 72','semit','semit 72','semit figa','semit giorgis',
    'bole bulbula','bole dembel','bole gazebo','bole peacock','bole edna','bole sheger','bole millennium',
    'megenagna','megenanya','kazanchis','sarbet','bisrate gebriel','bisrate',
    'bulgaria','alemgena','piassa','piyassa','hayahulet','old airport','kera','mexico'
  ];
  var PROP_TYPES = { apartment:'Apartment', villa:'Villa', house:'House', commercial:'Commercial', office:'Office', land:'Land', studio:'Studio' };

  function extractFilters(text) {
    var t = (text || '').toLowerCase();
    var filters = {};

    /* Bedrooms */
    var bedMatch = t.match(/(\d+)\s*(?:bed(?:room)?s?|br\b|ክፍ)/);
    if (bedMatch) filters.bedrooms = bedMatch[1];

    /* Status */
    if (/\bfor\s+rent\b|ለኪራይ/.test(t)) filters.status = 'For Rent';
    else if (/\bfor\s+sale\b|ለሽያጭ/.test(t)) filters.status = 'For Sale';

    /* Property type */
    for (var key in PROP_TYPES) {
      if (t.indexOf(key) !== -1) { filters.propertyType = PROP_TYPES[key]; break; }
    }

    /* Subcity / location */
    for (var i = 0; i < SUBCITIES.length; i++) {
      if (t.indexOf(SUBCITIES[i]) !== -1) { filters.subcity = SUBCITIES[i].replace(/\b\w/g, function(c){return c.toUpperCase();}); break; }
    }

    /* Price */
    var maxMatch = t.match(/(?:under|below|max(?:imum)?|budget|up\s+to)\s*(?:etb\s*)?(\d[\d,]*)\s*(?:million|m\b)?/);
    if (maxMatch) {
      var val = parseInt(maxMatch[1].replace(/,/g,''));
      if (/million|m\b/.test(t)) val *= 1000000;
      filters.maxPrice = String(val);
    }

    return filters;
  }

  function applyPropertyFilters(userText) {
    var onHome = window.location.pathname === '/' || window.location.pathname === '';
    var onProps = window.location.pathname.startsWith('/properties') && !/\/\d+/.test(window.location.pathname);
    if (!onHome && !onProps) return;

    var filters = extractFilters(userText);
    if (!Object.keys(filters).length) return;

    var params = new URLSearchParams(window.location.search);
    for (var key in filters) params.set(key, filters[key]);

    /* Try to update the page's React search state first */
    var applied = false;

    /* Look for search input and set value */
    if (filters.subcity) {
      var searchInputs = document.querySelectorAll('input[placeholder*="Search"],input[placeholder*="search"],input[type="search"]');
      searchInputs.forEach(function(inp) {
        var nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(inp, filters.subcity);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        applied = true;
      });
    }

    /* Try to click/update select dropdowns for bedrooms, status, type */
    ['bedrooms','status','propertyType'].forEach(function(k) {
      if (!filters[k]) return;
      var selects = document.querySelectorAll('select');
      selects.forEach(function(sel) {
        for (var i = 0; i < sel.options.length; i++) {
          if (sel.options[i].value == filters[k] || sel.options[i].text.toLowerCase().indexOf(String(filters[k]).toLowerCase()) !== -1) {
            sel.value = sel.options[i].value;
            sel.dispatchEvent(new Event('change', { bubbles: true }));
            applied = true;
            break;
          }
        }
      });
    });

    /* If on properties page or nothing clicked, navigate with query params */
    if (!applied || onProps) {
      var target = '/properties?' + params.toString();
      if (window.location.pathname !== '/properties' || window.location.search !== '?' + params.toString()) {
        history.pushState({}, '', target);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
  }

  /* ── Chat API ────────────────────────────────── */
  function getCurrentPropertyId() {
    var m = (window.location.pathname || '').match(/^\/properties\/(\d+)(?:\/|$)/);
    return m ? Number(m[1]) : null;
  }

  function sendMessage() {
    var text = inputEl.value.trim();
    if (!text) return;
    // Auto-detect Amharic
    if (hasAmharic(text) && lang !== 'am') {
      lang = 'am';
      updateUIText();
    }
    inputEl.value = '';
    resetInputHeight();
    // Remove welcome card / stale quick-replies if present
    var wc = document.getElementById('pa-welcome-card');
    if (wc) wc.remove();
    removeQuickReplies();

    addMessage('user', text);
    messages.push({ role: 'user', content: text });
    addMessage('ai', '', true); // typing indicator
    setStatus(t('thinking'));

    /* Apply property filters from voice/text intent */
    applyPropertyFilters(text);

    var body = { messages: messages, language: lang };
    var pid = getCurrentPropertyId();
    if (pid) body.propertyId = pid;

    streamReply(body).catch(function () {
      removeTyping(); setStatus('');
      var errMsg = lang === 'am' ? 'ይቅርታ፣ ወደ አገልጋዩ መድረስ አልቻልኩም።' : 'Sorry, could not reach the server. Please try again.';
      addMessage('ai', errMsg);
    });
  }

  function streamReply(body) {
    return fetch('/api/ai/chat-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
      body: JSON.stringify(body)
    }).then(function (r) {
      if (!r.ok || !r.body || !window.ReadableStream) {
        return fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        }).then(function (rr) { return rr.json(); }).then(function (data) {
          removeTyping(); setStatus('');
          var reply = data.text || (lang === 'am' ? 'ይቅርታ፣ ችግር ተፈጥሯል።' : 'Sorry, something went wrong.');
          messages.push({ role: 'assistant', content: reply });
          addMessage('ai', reply);
          speak(reply);
          showQuickReplies();
        });
      }

      var reader = r.body.getReader();
      var decoder = new TextDecoder();
      var buf = '';
      var fullText = '';
      var msgEl = null;

      var streamGroup = null;

      function ensureMsgEl() {
        if (msgEl) return;
        removeTyping(); setStatus('');
        streamGroup = document.createElement('div');
        streamGroup.className = 'pa-msg-group';
        var row = document.createElement('div');
        row.className = 'pa-msg-row';
        row.innerHTML = '<div class="pa-msg-avatar">' + AI_AVATAR + '</div>';
        msgEl = document.createElement('div');
        msgEl.className = 'pa-msg ai';
        row.appendChild(msgEl);
        streamGroup.appendChild(row);
        msgsEl.appendChild(streamGroup);
      }

      function appendDelta(d) {
        ensureMsgEl();
        fullText += d;
        msgEl.textContent = fullText;
        scrollToBottom();
      }

      function processBuffer() {
        var idx;
        while ((idx = buf.indexOf('\n\n')) !== -1) {
          var event = buf.slice(0, idx);
          buf = buf.slice(idx + 2);
          var lines = event.split('\n');
          for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (line.indexOf('data:') !== 0) continue;
            var payload = line.slice(5).trim();
            if (!payload || payload === '[DONE]') continue;
            try {
              var obj = JSON.parse(payload);
              if (typeof obj.delta === 'string') appendDelta(obj.delta);
            } catch (e) {}
          }
        }
      }

      function pump() {
        return reader.read().then(function (res) {
          if (res.done) {
            buf += decoder.decode();
            processBuffer();
            if (fullText) {
              messages.push({ role: 'assistant', content: fullText });
              if (streamGroup) {
                var timeEl = document.createElement('div');
                timeEl.className = 'pa-msg-time';
                timeEl.textContent = formatTime(new Date());
                streamGroup.appendChild(timeEl);
              }
              speak(fullText);
              showQuickReplies();
            } else {
              var fallback = lang === 'am' ? 'ይቅርታ፣ ምላሽ አልተገኘም።' : 'Sorry, no response was generated.';
              ensureMsgEl();
              msgEl.textContent = fallback;
              if (streamGroup) {
                var fbTimeEl = document.createElement('div');
                fbTimeEl.className = 'pa-msg-time';
                fbTimeEl.textContent = formatTime(new Date());
                streamGroup.appendChild(fbTimeEl);
              }
            }
            return;
          }
          buf += decoder.decode(res.value, { stream: true });
          processBuffer();
          return pump();
        });
      }
      return pump();
    });
  }

  /* ── Language Picker ────────────────────────── */
  function showLangPicker() {
    msgsEl.innerHTML = '';
    var inputWrap = panel.querySelector('.pa-input-wrap');
    if (inputWrap) inputWrap.style.display = 'none';

    var picker = document.createElement('div');
    picker.id = 'pa-lang-picker';
    picker.innerHTML =
      '<div class="pa-lp-icon"><img src="/assets/ethioproperty.png" alt="Ethio Property" /></div>' +
      '<div class="pa-lp-title">Welcome to Ethio Property AI</div>' +
      '<div class="pa-lp-sub">Choose your language to begin · ቋንቋዎን ይምረጡ</div>' +
      '<div class="pa-lp-toggle">' +
        '<button class="pa-lp-btn" data-lang="en">' +
          '<span class="pa-lp-flag">🇬🇧</span> English' +
        '</button>' +
        '<button class="pa-lp-btn" data-lang="am">' +
          '<span class="pa-lp-flag">🇪🇹</span> አማርኛ' +
        '</button>' +
      '</div>';

    picker.querySelectorAll('.pa-lp-btn').forEach(function (btn) {
      btn.type = 'button';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var chosen = btn.dataset.lang;
        lang = chosen;
        updateUIText();
        picker.remove();
        var inputWrap2 = panel.querySelector('.pa-input-wrap');
        if (inputWrap2) inputWrap2.style.display = '';
        startConversation();
      });
    });

    msgsEl.appendChild(picker);
  }

  function startConversation() {
    greetingShown = true;
    fetch('/api/ai/greeting/' + lang + '?_=' + Date.now(), { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : { greeting: '' }; })
      .then(function (d) {
        var g = (d && d.greeting) ? String(d.greeting).trim() : '';
        if (!g) {
          g = lang === 'am'
            ? 'እንኳን ወደ Ethio Property በደህና መጡ! ቤት ለመግዛት ወይም ለኪራይ እያሰቡ ነው?'
            : 'Welcome to Ethio Property! I\'m your personal property assistant. Are you looking to buy or rent?';
        }
        addMessage('ai', g);
        messages.push({ role: 'assistant', content: g });
        speak(g);
        setTimeout(function () { inputEl.focus(); }, 200);
      })
      .catch(function () {
        var g = lang === 'am' ? 'እንኳን ወደ Ethio Property በደህና መጡ!' : 'Welcome to Ethio Property! How can I help you?';
        addMessage('ai', g);
        messages.push({ role: 'assistant', content: g });
        setTimeout(function () { inputEl.focus(); }, 200);
      });
  }

  /* ── Open / Close ───────────────────────────── */
  window.__paAskAI = function () { isOpen ? closePanel() : openPanel(); };

  function openPanel() {
    isOpen = true;
    panel.classList.add('open');
    document.body.classList.add('pa-ai-open');
    var hb = document.getElementById('pa-ai-header-btn');
    if (hb) hb.classList.add('active');
    var mhb = document.getElementById('pa-ai-mobile-header-btn');
    if (mhb) mhb.classList.add('active');

    resetInputHeight();

    /* Pre-connect the WebSocket now so the TCP+TLS+WS handshake is
       already done by the time the visitor picks a language. */
    prewarmForVoice();

    if (messages.length === 0 && !langPickerShown) {
      langPickerShown = true;
      showLangPicker();
    } else {
      setTimeout(function () { inputEl.focus(); }, 300);
    }
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove('open');
    document.body.classList.remove('pa-ai-open');
    var hb = document.getElementById('pa-ai-header-btn');
    if (hb) hb.classList.remove('active');
    var mhb = document.getElementById('pa-ai-mobile-header-btn');
    if (mhb) mhb.classList.remove('active');
    stopSpeaking();
    stopLiveVoice();
  }

  document.addEventListener('click', function (e) {
    if (!isOpen) return;
    /* Use composedPath() instead of panel.contains(e.target): quick-reply
       chips, welcome-card chips, and the contact-card "skip" button all
       remove themselves from the DOM inside their own click handler
       (which fires before this document-level listener, since it's
       bubbling from the same click). By the time we get here, e.target
       is already detached, so panel.contains(e.target) incorrectly
       returns false and used to auto-close the whole chat. composedPath()
       captures the path at dispatch time, before any removal, so it
       still reports the panel as an ancestor. */
    var path = typeof e.composedPath === 'function' ? e.composedPath() : [];
    if (path.indexOf(panel) !== -1) return;
    var fab = document.getElementById('pa-ai-fab-btn');
    if (fab && path.indexOf(fab) !== -1) return;
    closePanel();
  });

  /* ── Gemini Live Voice-to-Voice (real-time WebSocket streaming) ────────
     Single voice button drives a genuine audio-in/audio-out conversation
     with the Gemini Live API, proxied through our own /api/ai/live
     WebSocket route (see extensions/features.js). No browser speech-to-
     text is involved: raw mic PCM goes out, raw model PCM audio comes
     back and is played immediately, with live transcripts logged into
     the chat log for reference.
  ──────────────────────────────────────────────────────────────────── */
  var liveWs = null;
  var liveStream = null;
  var liveAudioCtx = null;
  var liveProcessor = null;
  var liveSource = null;
  var liveActive = false;      // true once mic capture is live
  var liveConnecting = false;  // true while waiting on ws + 'ready'
  var playCtx = null;
  var nextPlayAt = 0;
  var liveUserMsgEl = null;    // in-progress user transcript bubble
  var liveAiMsgEl = null;      // in-progress assistant transcript bubble
  var pendingMicChunks = [];   // audio captured before the server said 'ready'
  var micRequestToken = 0;     // bumped on stop so a late getUserMedia resolve is ignored
  var wsPrewarmed = false;     // WS opened silently when panel opened, awaiting init

  function ab2b64(buffer) {
    var bytes = new Uint8Array(buffer), bin = '';
    for (var i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  function playPcmChunk(b64, mimeType) {
    try {
      var rate = 24000, rm = (mimeType || '').match(/rate=(\d+)/);
      if (rm) rate = parseInt(rm[1]);
      if (!playCtx) playCtx = new (window.AudioContext || window.webkitAudioContext)();
      var binary = atob(b64), bytes = new Uint8Array(binary.length);
      for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      var pcm16 = new Int16Array(bytes.buffer);
      var f32 = new Float32Array(pcm16.length);
      for (var i = 0; i < pcm16.length; i++) f32[i] = pcm16[i] / 32768.0;
      var buf = playCtx.createBuffer(1, f32.length, rate);
      buf.copyToChannel(f32, 0);
      var src = playCtx.createBufferSource();
      src.buffer = buf;
      src.connect(playCtx.destination);
      var now = playCtx.currentTime;
      var startAt = Math.max(now, nextPlayAt);
      src.start(startAt);
      nextPlayAt = startAt + buf.duration;
    } catch(e) { console.warn('[Live] playPcmChunk:', e); }
  }

  function stopMicStream() {
    if (liveProcessor) { try { liveProcessor.disconnect(); } catch(e){} liveProcessor = null; }
    if (liveSource)    { try { liveSource.disconnect(); }    catch(e){} liveSource = null; }
    if (liveAudioCtx)  { try { liveAudioCtx.close(); }      catch(e){} liveAudioCtx = null; }
    if (liveStream)    { liveStream.getTracks().forEach(function(t){t.stop();}); liveStream = null; }
  }

  function liveTranscriptBubble(role) {
    /* Reuses the normal message-row markup so live transcripts read like
       any other chat message once the turn is done. */
    var group = document.createElement('div');
    group.className = 'pa-msg-group';
    var row = document.createElement('div');
    row.className = 'pa-msg-row' + (role === 'user' ? ' user' : '');
    if (role !== 'user') row.innerHTML = '<div class="pa-msg-avatar">' + AI_AVATAR + '</div>';
    var msgEl = document.createElement('div');
    msgEl.className = 'pa-msg ' + (role === 'user' ? 'user' : 'ai');
    row.appendChild(msgEl);
    group.appendChild(row);
    msgsEl.appendChild(group);
    scrollToBottom();
    return msgEl;
  }

  function handleLiveServerMsg(raw) {
    var msg; try { msg = JSON.parse(raw); } catch(e) { return; }

    if (msg.type === 'ready') {
      liveConnecting = false;
      liveActive = true;
      updateVoiceButtonUI();
      setStatus(t('liveActive'));
      showLiveIndicator(true);
      /* Mic capture was already kicked off in parallel back in
         startLiveVoice() so no speech is lost while we waited on the
         Google Live API setup round-trip. Flush anything captured
         during that wait now that the socket will actually accept it. */
      if (pendingMicChunks.length) {
        for (var i = 0; i < pendingMicChunks.length; i++) {
          try { liveWs.send(pendingMicChunks[i]); } catch (e) {}
        }
        pendingMicChunks.length = 0;
      }
      return;
    }

    if (msg.type === 'error') {
      console.warn('[Live] server error:', msg.message);
      setStatus('⚠️ ' + (msg.message || t('liveFailed')));
      stopLiveVoice();
      setTimeout(function () { setStatus(''); }, 4000);
      return;
    }

    if (msg.type === 'interrupted') {
      /* Barge-in: drop any queued playback immediately so the model's
         voice stops as soon as the visitor starts talking. */
      nextPlayAt = 0;
      liveAiMsgEl = null;
      return;
    }

    if (msg.type === 'audio') {
      playPcmChunk(msg.data, msg.mimeType);
      return;
    }

    if (msg.type === 'transcript') {
      if (msg.role === 'user') {
        if (!liveUserMsgEl) liveUserMsgEl = liveTranscriptBubble('user');
        liveUserMsgEl.textContent = (liveUserMsgEl.textContent || '') + msg.text;
      } else {
        if (!liveAiMsgEl) liveAiMsgEl = liveTranscriptBubble('ai');
        liveAiMsgEl.textContent = (liveAiMsgEl.textContent || '') + msg.text;
      }
      scrollToBottom();
      return;
    }

    if (msg.type === 'turnComplete') {
      if (liveUserMsgEl && liveUserMsgEl.textContent) messages.push({ role: 'user', content: liveUserMsgEl.textContent });
      if (liveAiMsgEl && liveAiMsgEl.textContent) messages.push({ role: 'assistant', content: liveAiMsgEl.textContent });
      liveUserMsgEl = null;
      liveAiMsgEl = null;
      return;
    }
  }

  function startMicCaptureLive() {
    /* Fired the moment the user hits the voice button — in parallel with
       the WebSocket handshake to our server and Google's Live API setup
       round-trip, not after it. This is what used to gate mic capture
       behind the 'ready' message, adding the full network round-trip
       (our server -> Gemini Live API -> setupComplete -> back to us)
       before the mic was even opened, on top of however long the
       getUserMedia() permission prompt itself takes. Now capture starts
       immediately: chunks recorded before 'ready' arrives are queued in
       pendingMicChunks and flushed as soon as the socket can accept them,
       so no speech spoken right after tapping the button is lost. */
    var myToken = ++micRequestToken;
    navigator.mediaDevices.getUserMedia({
      audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    }).then(function(stream) {
      /* The session may have been stopped (panel closed, button toggled
         off) while the permission prompt was pending — bail out and
         release the stream immediately rather than leaving it open. */
      if (myToken !== micRequestToken || !liveWs || liveWs.readyState === 3 /* CLOSED */) {
        stream.getTracks().forEach(function(t){t.stop();});
        return;
      }
      liveStream = stream;
      liveAudioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      liveSource = liveAudioCtx.createMediaStreamSource(stream);
      liveProcessor = liveAudioCtx.createScriptProcessor(2048, 1, 1);
      liveProcessor.onaudioprocess = function(e) {
        if (myToken !== micRequestToken || !liveWs) return;
        var f32 = e.inputBuffer.getChannelData(0);
        var pcm16 = new Int16Array(f32.length);
        for (var i = 0; i < f32.length; i++) {
          var s = Math.max(-1, Math.min(1, f32[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        var frame = JSON.stringify({
          realtimeInput: { mediaChunks: [{ mimeType: 'audio/pcm;rate=16000', data: ab2b64(pcm16.buffer) }] }
        });
        if (liveActive && liveWs.readyState === 1) {
          liveWs.send(frame);
        } else if (liveConnecting) {
          /* Still waiting on 'ready' — queue instead of dropping so the
             first words spoken aren't lost. Cap the queue so a very slow
             handshake can't build up an unbounded backlog. */
          pendingMicChunks.push(frame);
          if (pendingMicChunks.length > 200) pendingMicChunks.shift();
        }
      };
      liveSource.connect(liveProcessor);
      liveProcessor.connect(liveAudioCtx.destination);
    }).catch(function(err) {
      console.error('[Live] Mic error:', err);
      if (myToken !== micRequestToken) return;
      setStatus('⚠️ ' + t('micDenied'));
      stopLiveVoice();
      setTimeout(function() { setStatus(''); }, 4000);
    });
  }

  function updateVoiceButtonUI() {
    if (!voiceEl) return;
    voiceEl.classList.remove('connecting', 'live-active');
    if (liveActive) {
      voiceEl.classList.add('live-active');
      voiceEl.innerHTML = '⏹';
      voiceEl.title = t('stopVoiceTitle');
    } else if (liveConnecting) {
      voiceEl.classList.add('connecting');
      voiceEl.innerHTML = '⏳';
      voiceEl.title = t('stopVoiceTitle');
    } else {
      voiceEl.innerHTML = '🎙️';
      voiceEl.title = t('voiceTitle');
    }
  }

  /* ── Shared WS handler attachment ─────────────────────────────────────
     Called once we have a liveWs we intend to use for a real session.
     Attaches onmessage / onerror / onclose; caller sets onopen separately. */
  function _attachLiveWsHandlers() {
    liveWs.onmessage = function(e) { handleLiveServerMsg(e.data); };
    liveWs.onerror   = function()  { console.warn('[Live] socket error'); };
    liveWs.onclose   = function()  {
      if (liveActive || liveConnecting) {
        setStatus('⚠️ ' + t('liveFailed'));
        setTimeout(function() { setStatus(''); }, 4000);
      }
      stopLiveVoice();
    };
  }

  /* Send the session-init message and kick off mic capture.
     Called as soon as we know liveWs.readyState === OPEN. */
  function _beginLiveSession() {
    liveWs.send(JSON.stringify({ type: 'init', lang: lang, propertyId: getCurrentPropertyId() }));
    startMicCaptureLive();
  }

  /* Open the WebSocket silently the moment the panel is shown so that
     by the time the visitor picks a language the round-trip is already
     done (or nearly so).  No mic permission is requested here — only
     the TCP+TLS+WS handshake is started.  init is sent later in
     autoStartLiveVoice() once lang is known. */
  function prewarmForVoice() {
    if (liveWs || !('WebSocket' in window)) return;
    var proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    try { liveWs = new WebSocket(proto + '//' + location.host + '/api/ai/live'); }
    catch(e) { return; }
    wsPrewarmed = true;
    /* Attach permanent handlers now; onopen is a silent no-op —
       autoStartLiveVoice() will send init and start the mic later. */
    _attachLiveWsHandlers();
    liveWs.onopen = function() { /* waiting for lang selection */ };
  }

  /* Called automatically after language is chosen.  Uses the pre-warmed
     socket if available so there is zero extra delay before speaking. */
  function autoStartLiveVoice() {
    if (liveActive || liveConnecting) return;
    if (!navigator.mediaDevices) return;

    stopSpeaking();
    liveConnecting = true;
    wsPrewarmed = false;
    pendingMicChunks.length = 0;
    updateVoiceButtonUI();
    setStatus(t('liveConnecting'));
    showLiveIndicator(true);

    if (liveWs && liveWs.readyState === 1 /* OPEN — pre-warm finished */) {
      _attachLiveWsHandlers();
      _beginLiveSession();
    } else if (liveWs && liveWs.readyState === 0 /* CONNECTING — still in flight */) {
      _attachLiveWsHandlers();
      liveWs.onopen = function() { _beginLiveSession(); };
      /* Start mic now in parallel with the remaining WS setup time */
      startMicCaptureLive();
    } else {
      /* Pre-warm failed or socket closed — create a fresh one */
      if (liveWs) { try { liveWs.close(); } catch(e){} liveWs = null; }
      var proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
      try { liveWs = new WebSocket(proto + '//' + location.host + '/api/ai/live'); }
      catch(e) {
        setStatus('⚠️ ' + t('liveFailed'));
        liveConnecting = false;
        updateVoiceButtonUI();
        setTimeout(function() { setStatus(''); }, 4000);
        return;
      }
      _attachLiveWsHandlers();
      liveWs.onopen = function() { _beginLiveSession(); };
      startMicCaptureLive();
    }
  }

  function startLiveVoice() {
    if (liveActive || liveConnecting) { stopLiveVoice(); return; }
    if (!('WebSocket' in window) || !navigator.mediaDevices || (!window.MediaRecorder && !window.AudioContext)) {
      setStatus('⚠️ ' + t('micUnsupported'));
      setTimeout(function () { setStatus(''); }, 4000);
      return;
    }
    stopSpeaking();
    liveConnecting = true;
    wsPrewarmed = false;
    pendingMicChunks.length = 0;
    updateVoiceButtonUI();
    setStatus(t('liveConnecting'));
    showLiveIndicator(true);

    /* Re-use the pre-warmed socket if it is still alive */
    if (liveWs && (liveWs.readyState === 0 || liveWs.readyState === 1)) {
      _attachLiveWsHandlers();
      if (liveWs.readyState === 1) {
        _beginLiveSession();
      } else {
        liveWs.onopen = function() { _beginLiveSession(); };
        startMicCaptureLive();
      }
      return;
    }

    /* Fresh start */
    if (liveWs) { try { liveWs.close(); } catch(e){} liveWs = null; }
    var proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    try {
      liveWs = new WebSocket(proto + '//' + location.host + '/api/ai/live');
    } catch (e) {
      console.error('[Live] WebSocket create failed:', e);
      setStatus('⚠️ ' + t('liveFailed'));
      liveConnecting = false;
      updateVoiceButtonUI();
      setTimeout(function () { setStatus(''); }, 4000);
      return;
    }
    _attachLiveWsHandlers();
    liveWs.onopen = function() { _beginLiveSession(); };
    startMicCaptureLive();
  }

  function stopLiveVoice() {
    var wasActive = liveActive || liveConnecting;
    micRequestToken++; // invalidate any in-flight getUserMedia() promise
    liveActive = false;
    liveConnecting = false;
    wsPrewarmed = false;
    liveUserMsgEl = null;
    liveAiMsgEl = null;
    pendingMicChunks.length = 0;
    stopMicStream();
    if (liveWs) { try { liveWs.close(); } catch(e){} liveWs = null; }
    if (playCtx) { try { playCtx.close(); } catch(e){} playCtx = null; }
    nextPlayAt = 0;
    updateVoiceButtonUI();
    showLiveIndicator(false);
    if (wasActive) {
      var st = statusEl.textContent || '';
      if (st === t('liveActive') || st === t('liveConnecting')) setStatus('');
    }
  }

  /* ── Auto-grow input ────────────────────────── */
  function resetInputHeight() {
    inputEl.style.height = 'auto';
    inputEl.classList.remove('pa-multiline');
  }

  function autoGrowInput() {
    inputEl.style.height = 'auto';
    var newHeight = Math.min(inputEl.scrollHeight, 108);
    inputEl.style.height = newHeight + 'px';
    inputEl.classList.toggle('pa-multiline', inputEl.value.indexOf('\n') !== -1 || newHeight > 44);
  }

  /* ── Events ──────────────────────────────────── */
  closeEl.addEventListener('click', closePanel);
  sendEl.addEventListener('click', sendMessage);
  inputEl.addEventListener('input', autoGrowInput);
  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  langEl.addEventListener('click', toggleLang);
  voiceEl.addEventListener('click', function() { startLiveVoice(); });

  /* ── Safety net: never leave the mic/socket open behind a torn-down
     page (reload, tab close, back/forward cache) ───────────────────── */
  window.addEventListener('pagehide', stopLiveVoice);
  window.addEventListener('beforeunload', stopLiveVoice);

  /* ── Hide on admin pages ─────────────────────── */
  function updateVisibilityForRoute() {
    var onAdmin = window.location.pathname.startsWith('/admin');
    var hb = document.getElementById('pa-ai-header-btn');
    if (hb) hb.style.display = onAdmin ? 'none' : '';
    if (onAdmin && isOpen) closePanel();
    panel.style.display = onAdmin ? 'none' : '';
  }
  updateVisibilityForRoute();

  } // end init()

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
