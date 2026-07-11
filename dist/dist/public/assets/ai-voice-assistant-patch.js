(function () {
  var PATCH_KEY = '__paAIVoiceAssistant_v3__';
  if (window[PATCH_KEY]) return;
  window[PATCH_KEY] = true;

  function init() {

  var lang = 'en';
  var micLang = 'en'; // Default to English — browsers widely support en-US recognition
  var messages = [];
  var isOpen = false;
  var greetingShown = false; // prevent double-greeting on rapid open
  var isListening = false;
  var isSpeaking = false;
  var synthesis = window.speechSynthesis;
  var recognition = null;
  var currentUtterance = null;
  var currentAudio = null;
  var sessionVoice = null; // locked TTS for session: 'gemini' | 'google' | null
  var langPickerShown = false;

  var T = {
    en: {
      btnTitle: 'AI Property Assistant',
      header: 'Ethio Property AI',
      subtitle: 'Your smart property guide',
      placeholder: 'Ask about properties...',
      send: 'Send',
      mic: 'Speak',
      stop: 'Stop',
      langToggle: 'አማርኛ',
      greeting: '',
      listening: '🎤 Listening... speak now',
      thinking: 'Thinking...',
      micUnsupported: 'Voice input is not supported in this browser. Please try Chrome.',
      micDenied: 'Microphone access was denied. Please allow microphone in your browser settings.',
      close: 'Close',
      poweredBy: 'Powered by Gemini AI',
    },
    am: {
      btnTitle: 'AI ረዳት',
      header: 'Ethio Property AI',
      subtitle: 'የርስዎ የንብረት ረዳት',
      placeholder: 'ስለ ቤቶች ይጠይቁ...',
      send: 'ላክ',
      mic: 'ተናገሩ',
      stop: 'አቁም',
      langToggle: 'English',
      greeting: '',
      listening: '🎤 እያዳምጥኩ...',
      thinking: 'እያስብኩ...',
      micUnsupported: 'ድምጽ ግብዓት በዚህ አሳሽ አይሰራም። Chrome ይጠቀሙ።',
      micDenied: 'ማይክሮፎን ፈቃድ ተከልክሏል። እባክዎ ፈቃዱን ፍቀዱ።',
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
      top: 72px; right: 18px;
      width: 390px;
      bottom: 24px;
      max-height: calc(100vh - 96px);
      background: #ffffff;
      border-radius: 24px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(99,102,241,0.12);
      display: flex; flex-direction: column;
      z-index: 10001; overflow: hidden;
      transform: scale(0.92) translateY(-16px);
      opacity: 0; pointer-events: none;
      transition: all 0.28s cubic-bezier(0.34,1.56,0.64,1);
      transform-origin: top right;
      border: 1px solid rgba(99,102,241,0.12);
    }
    body.pa-ai-open #pa-fab-wrap { display: none !important; }
    #pa-ai-panel.open {
      transform: scale(1) translateY(0);
      opacity: 1; pointer-events: all;
    }

    /* ── Header ── */
    .pa-header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #a855f7 100%);
      padding: 16px 18px 14px;
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
      width: 42px; height: 42px; border-radius: 14px;
      background: rgba(255,255,255,0.2);
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      position: relative; z-index: 1;
    }
    .pa-hdr-text { flex: 1; position: relative; z-index: 1; }
    .pa-hdr-title { font-size: 15px; font-weight: 800; color: #fff; line-height: 1.2; }
    .pa-hdr-sub { font-size: 11px; color: rgba(255,255,255,0.75); margin-top: 1px; }
    .pa-hdr-actions { display: flex; gap: 6px; align-items: center; position: relative; z-index: 1; }
    .pa-lang-btn {
      background: rgba(255,255,255,0.18);
      border: 1px solid rgba(255,255,255,0.35);
      color: #fff; border-radius: 12px;
      padding: 4px 10px; font-size: 11px;
      cursor: pointer; font-weight: 700;
      transition: background 0.15s;
    }
    .pa-lang-btn:hover { background: rgba(255,255,255,0.32); }
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

    .pa-mic-btn {
      background: #f1f5f9; color: #64748b;
      border: 1.5px solid #e2e8f0;
    }
    .pa-mic-btn:hover { background: #e8edff; color: #6366f1; border-color: #c7d2fe; }
    .pa-mic-btn.listening {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: #fff; border-color: transparent;
      box-shadow: 0 0 0 4px rgba(239,68,68,0.2);
      animation: pa-mic-pulse 1.2s infinite;
    }
    @keyframes pa-mic-pulse {
      0%,100% { box-shadow: 0 0 0 4px rgba(239,68,68,0.2); }
      50% { box-shadow: 0 0 0 8px rgba(239,68,68,0.08); }
    }

    .pa-live-btn {
      background: #f1f5f9; color: #ef4444;
      border: 1.5px solid #fecaca;
    }
    .pa-live-btn:hover { background: #fef2f2; color: #dc2626; border-color: #fca5a5; }
    .pa-live-btn.live-active {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: #fff; border-color: transparent;
      animation: pa-live-pulse 1.5s infinite;
    }
    @keyframes pa-live-pulse {
      0%,100% { box-shadow: 0 0 0 4px rgba(239,68,68,0.25); }
      50% { box-shadow: 0 0 0 9px rgba(239,68,68,0.07); }
    }

    /* ── Mic language pill ── */
    .pa-mic-lang {
      height: 32px; min-width: 44px;
      padding: 0 10px; border-radius: 16px;
      border: 1.5px solid #c7d2fe;
      background: #eef2ff; color: #4338ca;
      font-size: 11px; font-weight: 800;
      font-family: inherit; cursor: pointer; flex-shrink: 0;
      transition: all 0.18s;
      display: flex; align-items: center; justify-content: center;
    }
    .pa-mic-lang:hover { background: #e0e7ff; border-color: #a5b4fc; }
    .pa-mic-lang.am { background: #fef9c3; border-color: #fde047; color: #854d0e; }
    .pa-mic-lang.am:hover { background: #fef08a; }

    /* ── Footer credit ── */
    .pa-footer {
      text-align: center; font-size: 10px; color: #94a3b8;
      padding: 6px 14px 8px; background: #fff;
    }
    .pa-footer span { display: inline-flex; align-items: center; gap: 4px; }

    /* ── Mobile ── */
    @media (max-width: 480px) {
      #pa-ai-panel { width: calc(100vw - 20px); right: 10px; top: 62px; border-radius: 20px; }
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

    /* ── Language Picker ── */
    #pa-lang-picker {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      flex: 1; padding: 28px 20px; gap: 0;
      background: linear-gradient(160deg, #f0f4ff 0%, #f5f0ff 100%);
    }
    .pa-lp-icon { font-size: 44px; margin-bottom: 14px; }
    .pa-lp-title {
      font-size: 17px; font-weight: 800; color: #312e81;
      margin-bottom: 6px; text-align: center;
    }
    .pa-lp-sub {
      font-size: 13px; color: #6366f1; text-align: center;
      margin-bottom: 28px; line-height: 1.5;
    }
    .pa-lp-btns { display: flex; gap: 14px; }
    .pa-lp-btn {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 18px 28px; border-radius: 18px;
      border: 2px solid rgba(99,102,241,0.25);
      background: #fff;
      cursor: pointer; font-family: inherit;
      transition: all 0.2s ease;
      box-shadow: 0 4px 16px rgba(99,102,241,0.1);
    }
    .pa-lp-btn:hover {
      border-color: #6366f1;
      background: linear-gradient(135deg, #eef2ff, #f5f0ff);
      transform: translateY(-3px);
      box-shadow: 0 8px 24px rgba(99,102,241,0.2);
    }
    .pa-lp-flag { font-size: 32px; }
    .pa-lp-name { font-size: 15px; font-weight: 700; color: #312e81; }
    .pa-lp-hint { font-size: 11px; color: #818cf8; margin-top: 2px; }
  `;
  document.head.appendChild(style);

  /* ── Build panel DOM ─────────────────────────── */
  var panel = document.createElement('div');
  panel.id = 'pa-ai-panel';
  panel.innerHTML = `
    <div class="pa-header">
      <div class="pa-hdr-avatar">🏠</div>
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
    <div class="pa-msgs" id="pa-msgs"></div>
    <div class="pa-status" id="pa-status"></div>
    <div class="pa-input-wrap">
      <div class="pa-input-row">
        <textarea class="pa-input" id="pa-input" placeholder="${t('placeholder')}" rows="1" autocomplete="off"></textarea>
        <button class="pa-icon-btn pa-mic-lang am" id="pa-mic-lang" title="Mic language">አማ</button>
        <button class="pa-icon-btn pa-mic-btn" id="pa-mic" title="${t('mic')}">🎤</button>
        <button class="pa-icon-btn pa-live-btn" id="pa-live" title="Live voice conversation">🎙️</button>
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
  var micEl   = document.getElementById('pa-mic');
  var closeEl = document.getElementById('pa-close');
  var langEl  = document.getElementById('pa-lang');
  var micLangEl = document.getElementById('pa-mic-lang');
  var statusEl  = document.getElementById('pa-status');
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
    fetch('/api/ai/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text, voice: 'Aoede' })
    }).then(function (r) {
      if (!r.ok) throw new Error('tts ' + r.status);
      return r.blob();
    }).then(function (blob) {
      sessionVoice = 'gemini'; // confirmed working — lock for this session
      var url = URL.createObjectURL(blob);
      var audio = new Audio(url);
      currentAudio = audio;
      audio.onended = function () { isSpeaking = false; setStatus(''); URL.revokeObjectURL(url); currentAudio = null; };
      audio.onerror = function () { isSpeaking = false; setStatus(''); URL.revokeObjectURL(url); currentAudio = null; };
      audio.play().catch(function () { isSpeaking = false; setStatus(''); });
    }).catch(function (err) {
      console.warn('[AI voice] Gemini TTS failed, locking to Google TTS:', err);
      isSpeaking = false;
      sessionVoice = 'google'; // lock to Google for rest of session
      speakWithGoogleTranslate(text, isAm ? 'am' : 'en');
    });
  }

  function speak(text) {
    if (!text) return;
    var isAm = hasAmharic(text);
    if (sessionVoice === 'google') {
      speakWithGoogleTranslate(text, isAm ? 'am' : 'en');
    } else {
      speakWithGemini(text); // handles both null (first call) and 'gemini' (locked)
    }
  }

  function stopSpeaking() {
    if (synthesis) synthesis.cancel();
    if (currentAudio) { try { currentAudio.pause(); } catch (e) {} currentAudio = null; }
    isSpeaking = false;
  }

  /* ── Speech Recognition ─────────────────────────────────────
     Two paths depending on the chosen mic language:
       • English  → browser Web Speech API (en-US, widely supported)
       • Amharic  → MediaRecorder captures audio → POST /api/ai/transcribe
                    (Gemini transcribes the audio to Amharic text)
  ─────────────────────────────────────────────────────────── */

  var mediaRecorder = null;
  var recordedChunks = [];
  var recordingTimer = null;
  var MAX_RECORD_MS = 12000; // auto-stop after 12 s

  /* ── English path: Web Speech API ── */
  function setupWebSpeechRecognition() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    var r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.lang = 'en-US';
    r.onresult = function (e) {
      var transcript = e.results[0][0].transcript;
      inputEl.value = transcript;
      stopListening();
      sendMessage();
    };
    r.onerror = function (e) {
      console.warn('[AI Mic EN] error:', e.error);
      if (e.error === 'not-allowed' || e.error === 'permission-denied') {
        setStatus('⚠️ ' + t('micDenied'));
        setTimeout(function () { setStatus(''); }, 4000);
      } else if (e.error === 'no-speech') {
        setStatus('No speech detected — try again');
        setTimeout(function () { setStatus(''); }, 2500);
      }
      stopListening();
    };
    r.onend = function () { if (isListening) stopListening(); };
    return r;
  }

  /* ── Amharic path: Web Speech API first, Gemini MediaRecorder fallback ── */
  function startAmharicWebSpeech(SR) {
    var rec = new SR();
    rec.lang = 'am-ET';
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    var resultReceived = false; // track whether onresult fired

    isListening = true;
    micEl.classList.add('listening');
    micEl.innerHTML = '⏹';
    setStatus('🎤 እያዳምጥኩ... ለማቆም ⏹ ይጫኑ');

    rec.onresult = function (e) {
      resultReceived = true;
      var transcript = (e.results[0][0].transcript || '').trim();
      stopListening();
      if (transcript) {
        inputEl.value = transcript;
        sendMessage();
      } else {
        setStatus('ምንም ድምጽ አልተያዘም — እንደገና ይሞክሩ');
        setTimeout(function () { setStatus(''); }, 2500);
      }
    };

    rec.onerror = function (err) {
      resultReceived = true; // treat error as handled so onend doesn't double-act
      console.warn('[AI Mic AM Web] error:', err.error);
      stopListening();
      if (err.error === 'language-not-supported' || err.error === 'service-not-allowed') {
        /* Browser doesn't support am-ET — fall back to Gemini MediaRecorder */
        if (navigator.mediaDevices && window.MediaRecorder) {
          startAmharicRecording();
        } else {
          setStatus('⚠️ ' + t('micUnsupported'));
          setTimeout(function () { setStatus(''); }, 4000);
        }
      } else if (err.error === 'not-allowed' || err.error === 'permission-denied') {
        setStatus('⚠️ ' + t('micDenied'));
        setTimeout(function () { setStatus(''); }, 4000);
      } else if (err.error === 'no-speech') {
        setStatus('ምንም ድምጽ አልተያዘም — እንደገና ይሞክሩ');
        setTimeout(function () { setStatus(''); }, 2500);
      } else {
        setStatus('ምንም ድምጽ አልተያዘም — እንደገና ይሞክሩ');
        setTimeout(function () { setStatus(''); }, 2500);
      }
    };

    rec.onend = function () {
      if (!resultReceived) {
        /* Recognition ended silently (network timeout / no mic data) */
        stopListening();
        setStatus('ምንም ድምጽ አልተያዘም — እንደገና ይሞክሩ');
        setTimeout(function () { setStatus(''); }, 2500);
      } else if (isListening) {
        stopListening();
      }
    };

    /* Store so stopListening() can abort it */
    recognition = rec;
    try { rec.start(); } catch (e) {
      console.warn('[AI Mic AM Web] start error:', e);
      stopListening();
      if (navigator.mediaDevices && window.MediaRecorder) startAmharicRecording();
    }
  }

  /* ── Amharic path: MediaRecorder → Gemini transcription ── */
  function startAmharicRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      recordedChunks = [];

      // Pick a supported MIME type
      var mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) mimeType = 'audio/webm;codecs=opus';
      else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) mimeType = 'audio/ogg;codecs=opus';

      mediaRecorder = new MediaRecorder(stream, { mimeType: mimeType });
      mediaRecorder.ondataavailable = function (e) {
        if (e.data && e.data.size > 0) recordedChunks.push(e.data);
      };
      mediaRecorder.onstop = function () {
        // Stop mic stream tracks
        stream.getTracks().forEach(function (t) { t.stop(); });
        submitAmharicAudio(mimeType);
      };
      mediaRecorder.start(200); // collect chunks every 200 ms
      isListening = true;
      micEl.classList.add('listening');
      micEl.innerHTML = '⏹';
      setStatus('🎤 እያዳምጥኩ... ለማቆም ⏹ ይጫኑ');

      // Auto-stop after MAX_RECORD_MS
      recordingTimer = setTimeout(function () { stopListening(); }, MAX_RECORD_MS);
    }).catch(function (err) {
      console.warn('[AI Mic AM] getUserMedia error:', err);
      var msg = (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')
        ? t('micDenied') : t('micUnsupported');
      setStatus('⚠️ ' + msg);
      setTimeout(function () { setStatus(''); }, 4000);
      stopListening();
    });
  }

  function stopAmharicRecording() {
    if (recordingTimer) { clearTimeout(recordingTimer); recordingTimer = null; }
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop(); // triggers onstop → submitAmharicAudio
    }
    mediaRecorder = null;
    isListening = false;
    micEl.classList.remove('listening');
    micEl.innerHTML = '🎤';
    setStatus('⏳ ' + (lang === 'am' ? 'ትርጉም እየጠበቅኩ...' : 'Transcribing...'));
  }

  function submitAmharicAudio(mimeType) {
    if (recordedChunks.length === 0) { setStatus(''); return; }
    var blob = new Blob(recordedChunks, { type: mimeType });
    recordedChunks = [];
    var fd = new FormData();
    fd.append('audio', blob, 'recording.' + (mimeType.includes('ogg') ? 'ogg' : 'webm'));
    fd.append('lang', 'am');
    fetch('/api/ai/transcribe', { method: 'POST', body: fd })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        setStatus('');
        var transcript = (data.transcript || '').trim();
        if (!transcript) {
          setStatus('ምንም ድምጽ አልተያዘም — እንደገና ይሞክሩ');
          setTimeout(function () { setStatus(''); }, 2500);
          return;
        }
        inputEl.value = transcript;
        sendMessage();
      }).catch(function (err) {
        console.warn('[AI Mic AM] transcribe error:', err);
        setStatus('⚠️ Transcription failed — try again');
        setTimeout(function () { setStatus(''); }, 3000);
      });
  }

  /* ── Unified startListening / stopListening ── */
  function startListening() {
    stopSpeaking();
    /* Smart sync: if the panel language is Amharic but the mic pill is still
       on English (e.g. the greeting auto-switched lang but micLang lagged),
       silently correct it before starting recording. */
    if (lang === 'am' && micLang !== 'am') {
      micLang = 'am';
      applyMicLangUI();
    }
    if (micLang === 'am') {
      // Amharic: try browser Web Speech API first (free), fallback to Gemini MediaRecorder
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SR) {
        startAmharicWebSpeech(SR);
      } else if (navigator.mediaDevices && window.MediaRecorder) {
        startAmharicRecording();
      } else {
        setStatus('⚠️ ' + t('micUnsupported'));
        setTimeout(function () { setStatus(''); }, 4000);
      }
      return;
    } else {
      // English: use browser Web Speech API
      if (navigator.permissions) {
        navigator.permissions.query({ name: 'microphone' }).then(function (perm) {
          if (perm.state === 'denied') {
            setStatus('⚠️ ' + t('micDenied'));
            setTimeout(function () { setStatus(''); }, 4000);
            return;
          }
          doStartEnglishListening();
        }).catch(function () { doStartEnglishListening(); });
      } else {
        doStartEnglishListening();
      }
    }
  }

  function doStartEnglishListening() {
    recognition = setupWebSpeechRecognition();
    if (!recognition) {
      setStatus('⚠️ ' + t('micUnsupported'));
      setTimeout(function () { setStatus(''); }, 4000);
      return;
    }
    isListening = true;
    micEl.classList.add('listening');
    micEl.innerHTML = '⏹';
    setStatus(t('listening'));
    try { recognition.start(); } catch (e) {
      console.warn('[AI Mic EN] start error:', e);
      stopListening();
    }
  }

  function stopListening() {
    if (recordingTimer) { clearTimeout(recordingTimer); recordingTimer = null; }
    // Stop Amharic MediaRecorder path
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      stopAmharicRecording();
      return; // onstop callback finishes cleanup
    }
    mediaRecorder = null;
    // Stop Web Speech path (both English and Amharic)
    isListening = false;
    micEl.classList.remove('listening');
    micEl.innerHTML = '🎤';
    /* Clear ANY listening-related status — covers both English and Amharic strings */
    var st = statusEl.textContent || '';
    if (st === t('listening') || st.indexOf('🎤') !== -1 || st.indexOf('እያዳምጥኩ') !== -1) {
      setStatus('');
    }
    if (recognition) { try { recognition.stop(); } catch (e) {} recognition = null; }
  }

  /* ── Mic language toggle ─────────────────────── */
  function applyMicLangUI() {
    if (!micLangEl) return;
    if (micLang === 'am') {
      micLangEl.textContent = 'አማ';
      micLangEl.classList.add('am');
      micLangEl.title = 'Mic: Amharic — click for English';
    } else {
      micLangEl.textContent = 'EN';
      micLangEl.classList.remove('am');
      micLangEl.title = 'Mic: English — click for Amharic';
    }
  }

  function toggleMicLang() {
    micLang = micLang === 'am' ? 'en' : 'am';
    applyMicLangUI();
    if (isListening) { stopListening(); setTimeout(startListening, 200); }
  }

  applyMicLangUI();

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
  }

  function toggleLang() {
    lang = lang === 'en' ? 'am' : 'en';
    micLang = lang;
    applyMicLangUI();
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
  var SUBCITIES = ['bole','kirkos','yeka','nifas silk lafto','kolfe keranio','gulele','lideta','akaki kality','arada','addis ketema'];
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
      lang = 'am'; micLang = 'am';
      applyMicLangUI(); updateUIText();
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
      '<div class="pa-lp-icon">🏠</div>' +
      '<div class="pa-lp-title">Welcome to Ethio Property AI</div>' +
      '<div class="pa-lp-sub">Choose your language to begin<br>ቋንቋዎን ይምረጡ</div>' +
      '<div class="pa-lp-btns">' +
        '<button class="pa-lp-btn" data-lang="en">' +
          '<span class="pa-lp-flag">🇬🇧</span>' +
          '<span class="pa-lp-name">English</span>' +
          '<span class="pa-lp-hint">Continue in English</span>' +
        '</button>' +
        '<button class="pa-lp-btn" data-lang="am">' +
          '<span class="pa-lp-flag">🇪🇹</span>' +
          '<span class="pa-lp-name">አማርኛ</span>' +
          '<span class="pa-lp-hint">በአማርኛ ይቀጥሉ</span>' +
        '</button>' +
      '</div>';

    picker.querySelectorAll('.pa-lp-btn').forEach(function (btn) {
      btn.type = 'button';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var chosen = btn.dataset.lang;
        lang = chosen;
        micLang = chosen;
        applyMicLangUI();
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
    stopListening();
    stopSpeaking();
    stopLiveVoice();
  }

  document.addEventListener('click', function (e) {
    if (!isOpen) return;
    if (panel.contains(e.target)) return;
    if (e.target.closest('#pa-ai-fab-btn')) return;
    closePanel();
  });

  /* ── Gemini Live Voice (real-time WebSocket streaming) ──── */
  var liveWs = null;
  var liveStream = null;
  var liveAudioCtx = null;
  var liveProcessor = null;
  var liveSource = null;
  var liveActive = false;
  var playCtx = null;
  var nextPlayAt = 0;

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

  function handleGeminiLiveMsg(raw) {
    var msg; try { msg = JSON.parse(raw); } catch(e) { return; }
    if (msg.type === 'connected') return;
    var sc = msg.serverContent;
    if (!sc) return;
    if (sc.interrupted) { nextPlayAt = 0; return; }
    var parts = (sc.modelTurn && sc.modelTurn.parts) || [];
    var textParts = [];
    parts.forEach(function(part) {
      if (part.inlineData && part.inlineData.data) {
        playPcmChunk(part.inlineData.data, part.inlineData.mimeType || 'audio/pcm;rate=24000');
      }
      if (part.text) textParts.push(part.text);
    });
    if (textParts.length) {
      var txt = textParts.join('').trim();
      if (txt) { addMessage('ai', txt); messages.push({ role: 'assistant', content: txt }); }
    }
  }

  function startMicCaptureLive() {
    navigator.mediaDevices.getUserMedia({
      audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    }).then(function(stream) {
      liveStream = stream;
      liveAudioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      liveSource = liveAudioCtx.createMediaStreamSource(stream);
      liveProcessor = liveAudioCtx.createScriptProcessor(2048, 1, 1);
      liveProcessor.onaudioprocess = function(e) {
        if (!liveWs || liveWs.readyState !== 1 || !liveActive) return;
        var f32 = e.inputBuffer.getChannelData(0);
        var pcm16 = new Int16Array(f32.length);
        for (var i = 0; i < f32.length; i++) {
          var s = Math.max(-1, Math.min(1, f32[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        liveWs.send(JSON.stringify({
          realtimeInput: { mediaChunks: [{ mimeType: 'audio/pcm;rate=16000', data: ab2b64(pcm16.buffer) }] }
        }));
      };
      liveSource.connect(liveProcessor);
      liveProcessor.connect(liveAudioCtx.destination);
    }).catch(function(err) {
      console.error('[Live] Mic error:', err);
      setStatus('⚠️ ' + t('micDenied'));
      setTimeout(function() { setStatus(''); }, 3000);
      stopLiveVoice();
    });
  }

  function startLiveVoice() {
    if (liveActive) { stopLiveVoice(); return; }
    var proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    liveWs = new WebSocket(proto + '//' + location.host + '/api/ai/live');
    liveWs.onopen = function() {
      liveWs.send(JSON.stringify({
        setup: {
          model: 'models/gemini-2.0-flash-live-001',
          generationConfig: {
            responseModalities: ['AUDIO', 'TEXT'],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } } }
          },
          systemInstruction: {
            parts: [{ text: 'You are Addis, a warm and professional real estate agent for Ethio Property, a property platform in Addis Ababa, Ethiopia. Help users find properties for sale or rent. Be concise and conversational. Always respond in the same language the user speaks — support both English and Amharic.' }]
          }
        }
      }));
      setTimeout(startMicCaptureLive, 600);
    };
    liveWs.onmessage = function(e) { handleGeminiLiveMsg(e.data); };
    liveWs.onerror = function() {
      setStatus('⚠️ Live connection failed');
      setTimeout(function() { setStatus(''); }, 3000);
      stopLiveVoice();
    };
    liveWs.onclose = function(e) {
      console.log('[Live] closed:', e.code, e.reason);
      if (liveActive) stopLiveVoice();
    };
    liveActive = true;
    stopListening(); stopSpeaking();
    var liveEl = document.getElementById('pa-live');
    if (liveEl) { liveEl.classList.add('live-active'); liveEl.innerHTML = '⏹'; liveEl.title = 'Stop live conversation'; }
    setStatus('🔴 Live — speak naturally...');
  }

  function stopLiveVoice() {
    liveActive = false;
    stopMicStream();
    if (liveWs) { try { liveWs.close(); } catch(e){} liveWs = null; }
    if (playCtx) { try { playCtx.close(); } catch(e){} playCtx = null; }
    nextPlayAt = 0;
    var liveEl = document.getElementById('pa-live');
    if (liveEl) { liveEl.classList.remove('live-active'); liveEl.innerHTML = '🎙️'; liveEl.title = 'Live voice conversation'; }
    setStatus('');
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
  micEl.addEventListener('click', function () { isListening ? stopListening() : startListening(); });
  langEl.addEventListener('click', toggleLang);
  if (micLangEl) micLangEl.addEventListener('click', toggleMicLang);
  var liveEl = document.getElementById('pa-live');
  if (liveEl) liveEl.addEventListener('click', function() { startLiveVoice(); });

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
