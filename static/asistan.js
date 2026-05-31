/* Kalibre Asistan — siteyi tanıtan yüzen sohbet baloncuğu.
   Bağımsız, tek dosya. Her sayfaya <script src="/static/asistan.js" defer> ile eklenir.
   Yatırım tavsiyesi vermez; /api/asistan (Gemini 2.0 Flash) ile konuşur. */
(function () {
  'use strict';
  if (window.__kchatLoaded) return;
  window.__kchatLoaded = true;

  var LS_KEY = 'km-asistan-v1';
  var MAX_STORE = 20;
  var ENDPOINT = '/api/asistan';

  // ── Stil (scoped: kchat-*) ──
  var css =
    '.kchat-fab{position:fixed;right:18px;bottom:18px;z-index:99998;width:54px;height:54px;border-radius:50%;' +
    'background:#ffa630;color:#1a1208;border:none;cursor:pointer;box-shadow:0 6px 22px rgba(0,0,0,.4);' +
    'font-size:24px;display:flex;align-items:center;justify-content:center;transition:transform .15s,box-shadow .15s}' +
    '.kchat-fab:hover{transform:translateY(-2px);box-shadow:0 8px 26px rgba(0,0,0,.5)}' +
    '.kchat-fab.kchat-hidden{display:none}' +
    '.kchat-panel{position:fixed;right:18px;bottom:18px;z-index:99999;width:370px;max-width:calc(100vw - 24px);' +
    'height:560px;max-height:calc(100vh - 36px);background:#14110e;border:1px solid #36302a;border-radius:14px;' +
    'box-shadow:0 18px 50px rgba(0,0,0,.55);display:none;flex-direction:column;overflow:hidden;' +
    "font-family:'Inter Tight',ui-sans-serif,system-ui,-apple-system,sans-serif;color:#ebe3d3}" +
    '.kchat-panel.kchat-open{display:flex}' +
    '.kchat-head{display:flex;align-items:center;gap:10px;padding:13px 14px;background:#1a1612;border-bottom:1px solid #26221d}' +
    '.kchat-mark{width:26px;height:26px;border-radius:7px;background:#ffa630;color:#1a1208;font-weight:800;font-size:13px;' +
    'display:flex;align-items:center;justify-content:center;flex:none}' +
    '.kchat-title{font-size:14px;font-weight:600;line-height:1.1}' +
    '.kchat-sub{font-size:10.5px;color:#6f6553;margin-top:1px}' +
    '.kchat-x{margin-left:auto;background:none;border:0;color:#6f6553;font-size:20px;cursor:pointer;line-height:1;padding:2px 4px}' +
    '.kchat-x:hover{color:#ebe3d3}' +
    '.kchat-body{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin}' +
    '.kchat-msg{max-width:85%;padding:9px 12px;border-radius:12px;font-size:13px;line-height:1.5;white-space:pre-wrap;word-wrap:break-word}' +
    '.kchat-msg.user{align-self:flex-end;background:#2a2118;border:1px solid #3a2e1e;border-bottom-right-radius:4px}' +
    '.kchat-msg.bot{align-self:flex-start;background:#1f1b16;border:1px solid #2b261f;border-bottom-left-radius:4px}' +
    '.kchat-msg.bot a{color:#ffa630;text-decoration:underline}' +
    '.kchat-typing{align-self:flex-start;color:#6f6553;font-size:12px;padding:4px 12px}' +
    '.kchat-typing span{display:inline-block;animation:kchatBlink 1.2s infinite}' +
    '.kchat-typing span:nth-child(2){animation-delay:.2s}.kchat-typing span:nth-child(3){animation-delay:.4s}' +
    '@keyframes kchatBlink{0%,80%,100%{opacity:.25}40%{opacity:1}}' +
    '.kchat-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 8px}' +
    '.kchat-chip{font-size:11.5px;padding:6px 10px;border-radius:999px;border:1px solid #36302a;background:#1a1612;' +
    'color:#a89c83;cursor:pointer;line-height:1.2}.kchat-chip:hover{border-color:#ffa630;color:#ebe3d3}' +
    '.kchat-foot{padding:9px 12px;border-top:1px solid #26221d;background:#14110e}' +
    '.kchat-inrow{display:flex;gap:8px;align-items:flex-end}' +
    '.kchat-input{flex:1;resize:none;background:#1a1612;border:1px solid #36302a;border-radius:9px;color:#ebe3d3;' +
    "font-family:inherit;font-size:13px;padding:9px 11px;max-height:90px;line-height:1.4}" +
    '.kchat-input:focus{outline:none;border-color:#ffa630}' +
    '.kchat-send{flex:none;width:38px;height:38px;border-radius:9px;background:#ffa630;color:#1a1208;border:0;cursor:pointer;font-size:17px}' +
    '.kchat-send:disabled{opacity:.4;cursor:default}' +
    '.kchat-disc{font-size:9.5px;color:#6f6553;text-align:center;margin-top:7px;line-height:1.3}' +
    '@media(max-width:480px){.kchat-panel{right:8px;bottom:8px;height:calc(100vh - 16px)}.kchat-fab{right:12px;bottom:12px}}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ── DOM ──
  var fab = document.createElement('button');
  fab.className = 'kchat-fab';
  fab.setAttribute('aria-label', 'Kalibre Asistan sohbetini aç');
  fab.innerHTML = '💬';

  var panel = document.createElement('div');
  panel.className = 'kchat-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Kalibre Asistan');
  panel.innerHTML =
    '<div class="kchat-head">' +
    '<div class="kchat-mark">K</div>' +
    '<div><div class="kchat-title">Kalibre Asistan</div><div class="kchat-sub">siteyi tanıtan rehber · yatırım tavsiyesi vermez</div></div>' +
    '<button class="kchat-x" aria-label="Kapat">×</button>' +
    '</div>' +
    '<div class="kchat-body" id="kchat-body"></div>' +
    '<div class="kchat-chips" id="kchat-chips"></div>' +
    '<div class="kchat-foot">' +
    '<div class="kchat-inrow">' +
    '<textarea class="kchat-input" id="kchat-input" rows="1" placeholder="Bir şey sor… (örn. nereden başlamalıyım?)"></textarea>' +
    '<button class="kchat-send" id="kchat-send" aria-label="Gönder">➤</button>' +
    '</div>' +
    '<div class="kchat-disc">Eğitim ve bilgilendirme amaçlıdır, yatırım tavsiyesi değildir.</div>' +
    '</div>';

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  var bodyEl = panel.querySelector('#kchat-body');
  var chipsEl = panel.querySelector('#kchat-chips');
  var inputEl = panel.querySelector('#kchat-input');
  var sendEl = panel.querySelector('#kchat-send');

  var SUGGESTIONS = [
    'Bu site ne işime yarar?',
    'Nereden başlamalıyım?',
    'Terminali nasıl kullanırım?',
    'Önyargı testi nedir?',
  ];

  var messages = []; // {role:'user'|'assistant', content}
  var busy = false;

  function load() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) messages = JSON.parse(raw).slice(-MAX_STORE);
    } catch (e) { messages = []; }
  }
  function save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(messages.slice(-MAX_STORE))); } catch (e) {}
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // Güvenli render: kaçır, sonra site-içi yolları ve http linkleri tıklanır yap, **kalın** sadeleştir.
  function fmt(s) {
    var h = esc(s);
    h = h.replace(/\*\*([^*]+)\*\*/g, '$1');
    h = h.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    h = h.replace(/(^|[\s(])(\/[a-z0-9][a-z0-9/\-]*\/?)/g, function (m, pre, path) {
      return pre + '<a href="' + path + '">' + path + '</a>';
    });
    return h;
  }

  function addBubble(role, text) {
    var d = document.createElement('div');
    d.className = 'kchat-msg ' + (role === 'user' ? 'user' : 'bot');
    if (role === 'user') d.textContent = text; else d.innerHTML = fmt(text);
    bodyEl.appendChild(d);
    bodyEl.scrollTop = bodyEl.scrollHeight;
    return d;
  }

  function renderChips() {
    chipsEl.innerHTML = '';
    if (messages.length > 0) return; // ilk ekranda göster, sonra gizle
    SUGGESTIONS.forEach(function (s) {
      var c = document.createElement('button');
      c.className = 'kchat-chip';
      c.textContent = s;
      c.addEventListener('click', function () { inputEl.value = s; submit(); });
      chipsEl.appendChild(c);
    });
  }

  function renderHistory() {
    bodyEl.innerHTML = '';
    if (messages.length === 0) {
      addBubble('assistant',
        'Merhaba! Ben Kalibre Asistan. Bu sitenin bölümlerini ve sana nasıl yarayacağını anlatırım. ' +
        'Aşağıdaki sorulardan birine dokunabilir ya da kendi sorunu yazabilirsin.');
    } else {
      messages.forEach(function (m) { addBubble(m.role, m.content); });
    }
    renderChips();
  }

  function setBusy(b) {
    busy = b;
    sendEl.disabled = b;
    var t = bodyEl.querySelector('.kchat-typing');
    if (b && !t) {
      var d = document.createElement('div');
      d.className = 'kchat-typing';
      d.innerHTML = 'yazıyor<span>.</span><span>.</span><span>.</span>';
      bodyEl.appendChild(d);
      bodyEl.scrollTop = bodyEl.scrollHeight;
    } else if (!b && t) {
      t.remove();
    }
  }

  function submit() {
    var text = (inputEl.value || '').trim();
    if (!text || busy) return;
    inputEl.value = '';
    inputEl.style.height = 'auto';
    messages.push({ role: 'user', content: text });
    addBubble('user', text);
    save();
    renderChips();
    setBusy(true);

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messages.slice(-12), context: { path: location.pathname } }),
    })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (d) {
        setBusy(false);
        var reply = (d && d.reply) || 'Şu an yanıt veremiyorum, birazdan tekrar dener misin?';
        messages.push({ role: 'assistant', content: reply });
        addBubble('assistant', reply);
        save();
      })
      .catch(function () {
        setBusy(false);
        addBubble('assistant', 'Bağlantı kurulamadı. İnternetini kontrol edip tekrar dener misin?');
      });
  }

  // ── Etkileşim ──
  function open() {
    panel.classList.add('kchat-open');
    fab.classList.add('kchat-hidden');
    setTimeout(function () { inputEl.focus(); }, 60);
  }
  function close() {
    panel.classList.remove('kchat-open');
    fab.classList.remove('kchat-hidden');
  }
  fab.addEventListener('click', open);
  panel.querySelector('.kchat-x').addEventListener('click', close);
  sendEl.addEventListener('click', submit);
  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  });
  inputEl.addEventListener('input', function () {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 90) + 'px';
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('kchat-open')) close();
  });

  load();
  renderHistory();
})();
