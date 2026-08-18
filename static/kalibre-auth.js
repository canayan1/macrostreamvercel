/* Kalibre — hesap ve kayıt katmanı.
 *
 * Tasarım ilkesi: ÖNCE YEREL. Site hesapsız da tam çalışır; kayıtlar her zaman
 * localStorage'a yazılır. Kullanıcı giriş yaparsa aynı kayıtlar buluta da
 * senkronlanır ve cihazlar arası taşınır. Yapılandırma yoksa (kalibre-config.js
 * boşsa) giriş arayüzü hiç görünmez ve her şey yerelde çalışmaya devam eder.
 *
 * Kullanım:
 *   <script src="/static/kalibre-config.js"></script>
 *   <script src="/static/kalibre-auth.js" defer></script>
 *
 * API:
 *   KalibreAuth.ready()                  → Promise, katman hazır olunca çözülür
 *   KalibreAuth.user()                   → {id,email} veya null
 *   KalibreAuth.openLogin()              → giriş kutusunu aç
 *   KalibreAuth.signOut()
 *   KalibreAuth.onChange(fn)             → oturum değişince çağrılır
 *   KalibreStore.list(kind)              → Promise<[{id,name,payload,updated_at}]>
 *   KalibreStore.save(kind,name,payload,id?) → Promise<kayıt>
 *   KalibreStore.remove(kind,id)         → Promise
 */
(function () {
  'use strict';
  if (window.KalibreAuth) return;

  var CFG = window.KALIBRE_CONFIG || {};
  var ENABLED = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);
  var SDK = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
  var LS_PREFIX = 'kalibre-store-';
  var sb = null, session = null, listeners = [], readyResolve, readyPromise;

  readyPromise = new Promise(function (res) { readyResolve = res; });

  // ── yardımcılar ─────────────────────────────────────────────────────────
  function uid() {
    return 'loc-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }
  function lsGet(kind) {
    try { return JSON.parse(localStorage.getItem(LS_PREFIX + kind) || '[]'); }
    catch (e) { return []; }
  }
  function lsSet(kind, rows) {
    try { localStorage.setItem(LS_PREFIX + kind, JSON.stringify(rows)); } catch (e) {}
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function emit() { listeners.forEach(function (fn) { try { fn(user()); } catch (e) {} }); }
  function user() {
    return session && session.user ? { id: session.user.id, email: session.user.email } : null;
  }

  // ── stil ────────────────────────────────────────────────────────────────
  var css =
    '.kauth-btn{display:inline-flex;align-items:center;gap:7px;font-family:inherit;font-size:12.5px;' +
    'color:#b8ae9e;background:transparent;border:1px solid #2a241d;border-radius:999px;padding:6px 13px;' +
    'cursor:pointer;transition:border-color .12s,color .12s;white-space:nowrap}' +
    '.kauth-btn:hover{border-color:#ffa630;color:#ffa630}' +
    '.kauth-btn .kauth-dot{width:6px;height:6px;border-radius:50%;background:#4ade80;flex:none}' +
    '.kauth-ov{position:fixed;inset:0;z-index:100000;background:rgba(6,5,4,.82);backdrop-filter:blur(6px);' +
    'display:none;align-items:center;justify-content:center;padding:20px}' +
    '.kauth-ov.on{display:flex}' +
    '.kauth-box{width:100%;max-width:410px;background:#14110e;border:1px solid #2a241d;border-radius:16px;' +
    'padding:26px 24px;box-shadow:0 24px 60px rgba(0,0,0,.6);' +
    "font-family:'Inter Tight',Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;color:#e8e2d8}" +
    '.kauth-box h3{margin:0 0 6px;font-size:20px;font-weight:600;letter-spacing:-.01em}' +
    '.kauth-box p.sub{margin:0 0 20px;font-size:13.5px;color:#b8ae9e;line-height:1.55}' +
    '.kauth-box label{display:block;font-size:11px;letter-spacing:.14em;text-transform:uppercase;' +
    "color:#6f6553;margin-bottom:7px;font-family:'JetBrains Mono',ui-monospace,monospace}" +
    '.kauth-box input{width:100%;background:#0e0c09;border:1px solid #2a241d;border-radius:10px;' +
    'padding:12px 14px;color:#e8e2d8;font-size:15px;font-family:inherit;outline:none}' +
    '.kauth-box input:focus{border-color:#ffa630}' +
    '.kauth-primary{width:100%;margin-top:12px;background:#ffa630;color:#1a1a1a;border:0;border-radius:10px;' +
    'padding:12px 18px;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit}' +
    '.kauth-primary:hover{background:#ff7a00}' +
    '.kauth-primary:disabled{opacity:.55;cursor:default}' +
    '.kauth-google{width:100%;margin-bottom:16px;background:#fff;color:#1f1f1f;border:0;border-radius:10px;' +
    'padding:12px 18px;font-weight:600;font-size:14px;cursor:pointer;font-family:inherit;' +
    'display:flex;align-items:center;justify-content:center;gap:10px}' +
    '.kauth-google:hover{background:#f1f1f1}' +
    '.kauth-or{display:flex;align-items:center;gap:12px;color:#6f6553;font-size:11.5px;margin:0 0 16px}' +
    '.kauth-or::before,.kauth-or::after{content:"";flex:1;height:1px;background:#2a241d}' +
    '.kauth-msg{margin-top:14px;font-size:13px;line-height:1.55;display:none}' +
    '.kauth-msg.ok{display:block;color:#4ade80}' +
    '.kauth-msg.err{display:block;color:#ef5350}' +
    '.kauth-fine{margin-top:18px;font-size:11.5px;color:#6f6553;line-height:1.6}' +
    '.kauth-fine a{color:#ffa630;text-decoration:none}' +
    '.kauth-x{position:absolute;top:14px;right:16px;background:none;border:0;color:#6f6553;font-size:22px;' +
    'cursor:pointer;line-height:1;padding:4px}' +
    '.kauth-x:hover{color:#e8e2d8}' +
    '.kauth-menu{position:absolute;right:0;top:calc(100% + 8px);background:#14110e;border:1px solid #2a241d;' +
    'border-radius:12px;padding:6px;min-width:206px;box-shadow:0 14px 40px rgba(0,0,0,.55);display:none;z-index:99999}' +
    '.kauth-menu.on{display:block}' +
    '.kauth-menu .em{padding:9px 12px 10px;font-size:12px;color:#6f6553;border-bottom:1px solid #2a241d;' +
    'margin-bottom:5px;word-break:break-all;line-height:1.45}' +
    '.kauth-menu a,.kauth-menu button{display:block;width:100%;text-align:left;background:none;border:0;' +
    'color:#b8ae9e;font-size:13.5px;padding:9px 12px;border-radius:8px;cursor:pointer;font-family:inherit;' +
    'text-decoration:none}' +
    '.kauth-menu a:hover,.kauth-menu button:hover{background:#1a1612;color:#ffa630}';

  function injectCss() {
    if (document.getElementById('kauth-css')) return;
    var s = document.createElement('style');
    s.id = 'kauth-css'; s.textContent = css;
    document.head.appendChild(s);
  }

  // ── giriş kutusu ────────────────────────────────────────────────────────
  var ov = null;
  function buildOverlay() {
    if (ov) return ov;
    ov = document.createElement('div');
    ov.className = 'kauth-ov';
    ov.innerHTML =
      '<div class="kauth-box" style="position:relative" role="dialog" aria-modal="true" aria-label="Kalibre hesabı">' +
        '<button class="kauth-x" aria-label="Kapat">&times;</button>' +
        '<h3>Kalibre hesabı</h3>' +
        '<p class="sub">Portföylerin, izleme listen ve serilerinin cihazlar arası taşınması için. ' +
        'Hesap zorunlu değil: girmezsen her şey yine çalışır, kayıtlar bu tarayıcıda kalır.</p>' +
        '<button class="kauth-google">' +
          '<svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">' +
          '<path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.5 30.400 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.2C12.4 13.6 17.7 9.5 24 9.5z"/>' +
          '<path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.4c-.5 2.9-2.2 5.3-4.7 6.9l7.3 5.7c4.3-3.9 6.8-9.7 6.8-16.6z"/>' +
          '<path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-2.9-.8-4.6s.3-3.2.8-4.6l-7.9-6.2C1 16.4 0 20.1 0 24s1 7.6 2.6 10.8l7.9-6.2z"/>' +
          '<path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.3-5.7c-2.1 1.4-4.8 2.2-8.6 2.2-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.2C6.5 42.6 14.6 48 24 48z"/>' +
          '</svg>Google ile devam et</button>' +
        '<div class="kauth-or">veya e-posta ile</div>' +
        '<form class="kauth-form">' +
          '<label for="kauth-email">E-posta adresin</label>' +
          '<input id="kauth-email" type="email" required autocomplete="email" placeholder="ornek@eposta.com">' +
          '<button type="submit" class="kauth-primary">Giriş bağlantısı gönder</button>' +
        '</form>' +
        '<div class="kauth-msg"></div>' +
        '<p class="kauth-fine">Şifre yok: e-postana tek kullanımlık bir giriş bağlantısı gelir. ' +
        'Adresini yalnızca hesabını tanımak için saklarız, üçüncü tarafla paylaşmayız. ' +
        '<a href="/gizlilik/">Gizlilik politikası</a></p>' +
      '</div>';
    document.body.appendChild(ov);

    var msg = ov.querySelector('.kauth-msg');
    function say(text, kind) { msg.textContent = text; msg.className = 'kauth-msg ' + kind; }

    ov.querySelector('.kauth-x').onclick = closeLogin;
    ov.addEventListener('click', function (e) { if (e.target === ov) closeLogin(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && ov.classList.contains('on')) closeLogin();
    });

    ov.querySelector('.kauth-google').onclick = function () {
      say('Google\'a yönlendiriliyorsun…', 'ok');
      sb.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: location.origin + '/hesap/' }
      }).then(function (r) {
        if (r.error) say('Google girişi şu an açılamadı: ' + r.error.message, 'err');
      });
    };

    ov.querySelector('.kauth-form').onsubmit = function (e) {
      e.preventDefault();
      var btn = this.querySelector('.kauth-primary');
      var email = this.querySelector('#kauth-email').value.trim();
      if (!email) return;
      btn.disabled = true; btn.textContent = 'Gönderiliyor…';
      sb.auth.signInWithOtp({
        email: email,
        options: { emailRedirectTo: location.origin + '/hesap/' }
      }).then(function (r) {
        btn.disabled = false; btn.textContent = 'Giriş bağlantısı gönder';
        if (r.error) say('Gönderilemedi: ' + r.error.message, 'err');
        else say('Bağlantı ' + email + ' adresine gönderildi. Gelen kutunu kontrol et (spam klasörüne de bak).', 'ok');
      });
    };
    return ov;
  }
  function openLogin() {
    if (!ENABLED) return;
    buildOverlay().classList.add('on');
    var i = ov.querySelector('#kauth-email');
    setTimeout(function () { try { i.focus(); } catch (e) {} }, 60);
  }
  function closeLogin() { if (ov) ov.classList.remove('on'); }

  // ── başlıktaki düğme ────────────────────────────────────────────────────
  function mountButtons() {
    if (!ENABLED) return;
    var slots = document.querySelectorAll('[data-kalibre-auth]');
    for (var i = 0; i < slots.length; i++) renderSlot(slots[i]);
  }
  function renderSlot(slot) {
    var u = user();
    slot.style.position = 'relative';
    slot.innerHTML = '';
    var btn = document.createElement('button');
    btn.className = 'kauth-btn';
    btn.type = 'button';
    if (u) {
      btn.innerHTML = '<span class="kauth-dot"></span>' + esc(u.email.split('@')[0]);
      var menu = document.createElement('div');
      menu.className = 'kauth-menu';
      menu.innerHTML =
        '<div class="em">' + esc(u.email) + '</div>' +
        '<a href="/hesap/">Panom</a>' +
        '<a href="/portfoy-lab/">Portföy Lab</a>' +
        '<button type="button" data-signout>Çıkış yap</button>';
      menu.querySelector('[data-signout]').onclick = function () { signOut(); };
      btn.onclick = function (e) { e.stopPropagation(); menu.classList.toggle('on'); };
      document.addEventListener('click', function () { menu.classList.remove('on'); });
      slot.appendChild(btn); slot.appendChild(menu);
    } else {
      btn.textContent = 'Giriş yap';
      btn.onclick = openLogin;
      slot.appendChild(btn);
    }
  }

  function signOut() {
    if (!sb) return Promise.resolve();
    return sb.auth.signOut().then(function () {
      session = null; mountButtons(); emit();
      if (location.pathname.indexOf('/hesap') === 0) location.href = '/';
    });
  }

  // ── kayıt katmanı: önce yerel, giriş varsa bulut ─────────────────────────
  var Store = {
    list: function (kind) {
      var local = lsGet(kind);
      if (!sb || !user()) return Promise.resolve(local);
      return sb.from('kalibre_items')
        .select('id,kind,name,payload,updated_at')
        .eq('kind', kind)
        .order('updated_at', { ascending: false })
        .then(function (r) {
          if (r.error) return local;                 // ağ/izin hatasında yerelden devam
          lsSet(kind, r.data || []);
          return r.data || [];
        });
    },
    save: function (kind, name, payload, id) {
      var row = {
        id: id || uid(), kind: kind, name: name, payload: payload,
        updated_at: new Date().toISOString()
      };
      var rows = lsGet(kind).filter(function (r) { return r.id !== row.id; });
      rows.unshift(row); lsSet(kind, rows);
      if (!sb || !user()) return Promise.resolve(row);
      var cloud = {
        kind: kind, name: name, payload: payload,
        user_id: user().id, updated_at: row.updated_at
      };
      // Yerelde üretilmiş 'loc-' kimlikleri buluta gönderilmez; bulut kendi uuid'ini verir.
      if (id && String(id).indexOf('loc-') !== 0) cloud.id = id;
      return sb.from('kalibre_items').upsert(cloud).select().then(function (r) {
        if (r.error || !r.data || !r.data[0]) return row;
        var saved = r.data[0];
        var fixed = lsGet(kind).filter(function (x) { return x.id !== row.id && x.id !== saved.id; });
        fixed.unshift(saved); lsSet(kind, fixed);
        return saved;
      });
    },
    remove: function (kind, id) {
      lsSet(kind, lsGet(kind).filter(function (r) { return r.id !== id; }));
      if (!sb || !user() || String(id).indexOf('loc-') === 0) return Promise.resolve();
      return sb.from('kalibre_items').delete().eq('id', id).then(function () {});
    },
    // Giriş anında bu tarayıcıdaki yerel kayıtları buluta taşır (bir kez).
    pushLocal: function (kinds) {
      if (!sb || !user()) return Promise.resolve();
      var jobs = [];
      kinds.forEach(function (kind) {
        lsGet(kind).forEach(function (r) {
          if (String(r.id).indexOf('loc-') !== 0) return;
          jobs.push(sb.from('kalibre_items').insert({
            kind: kind, name: r.name, payload: r.payload, user_id: user().id
          }));
        });
      });
      if (!jobs.length) return Promise.resolve();
      return Promise.all(jobs).then(function () {
        kinds.forEach(function (kind) {
          lsSet(kind, lsGet(kind).filter(function (r) { return String(r.id).indexOf('loc-') !== 0; }));
        });
      }).catch(function () {});
    }
  };

  // ── başlatma ────────────────────────────────────────────────────────────
  function boot() {
    injectCss();
    if (!ENABLED) { readyResolve(); return; }
    import(SDK).then(function (mod) {
      sb = mod.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      return sb.auth.getSession().then(function (r) {
        session = (r.data && r.data.session) || null;
        sb.auth.onAuthStateChange(function (evt, s) {
          var was = !!user();
          session = s;
          mountButtons();
          if (!was && user()) Store.pushLocal(['portfoy', 'izleme']);
          emit();
        });
        mountButtons();
        if (user()) Store.pushLocal(['portfoy', 'izleme']);
        readyResolve();
      });
    }).catch(function (e) {
      // SDK yüklenemedi: site yerel modda tam çalışmaya devam eder.
      if (window.console) console.warn('[kalibre-auth] bulut katmanı kapalı:', e && e.message);
      sb = null; readyResolve();
    });
  }

  window.KalibreAuth = {
    enabled: ENABLED,
    ready: function () { return readyPromise; },
    user: user,
    openLogin: openLogin,
    signOut: signOut,
    onChange: function (fn) { listeners.push(fn); },
    refreshButtons: mountButtons
  };
  window.KalibreStore = Store;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
