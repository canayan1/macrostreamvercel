/* Kalibre: hesap katmanı (Supabase Auth) ve başlıktaki hesap menüsü.
 *
 * Tek bir Kalibre Markets hesabı tüm ürünleri kapsar (şimdilik Kalibre Lab).
 * Her kullanıcının kalıcı bir hesabı vardır (e-postayla tek kullanımlık bağlantı/kod ya da Google).
 * Abonelik satın almak için hesap gerekir; laboratuvar hesapsız da tam çalışır (önce yerel).
 *
 * Supabase'de tutulanlar: profil (ad, dil, izinler), kaydedilen stratejiler ve izleme listeleri
 * (user_items), lisans görüntüsü. Piyasa verisi, pozisyon ve işlem geçmişi tutulmaz; MT5 eşleştirme
 * kodu ve aracı kurum anahtarları yalnız bu cihazda kalır.
 *
 * Kullanım: <script src="/static/kalibre-auth.js" defer></script>
 * (kalibre-config.js sayfada yoksa bu betik onu kendisi yükler.)
 *
 * API (window.KalibreAuth):
 *   ready() → Promise            user() → {id,email,name} | null      enabled
 *   signInWithEmail(email, {next}) → Promise<{error}>     verifyCode(email, code) → Promise<{error}>
 *   signInWithGoogle({next})       signOut()               onChange(fn)
 *   token() → erişim belirteci | null                     api(yol, {method, body}) → Promise<{ok,status,data}>
 *   profile() → Promise<profil>    updateProfile(alanlar) → Promise<{error}>
 *   client() → Supabase istemcisi  paths → {signIn, account, pricing, connect, lab, home}  lang
 *
 * Dil <html lang>'den (yoksa ?dil=, kayıtlı seçim; hiçbiri yoksa İngilizce) okunur. Yollar dile göre varsayılandır;
 * sayfa <meta name="kalibre:yol:signIn" content="/..."> gibi etiketlerle değiştirebilir (site köküne
 * İngilizce taşındığında betik değişmez, yalnız üretilen etiketler değişir).
 * window.KalibreStore: list(kind), save(kind, name, payload, id?), remove(kind, id)
 *   Buluta yalnız 'strateji', 'izleme', 'ayar', 'not' türleri gider; diğerleri (ör. defter) yalnız yereldir.
 */
(function () {
  'use strict';
  if (window.KalibreAuth) return;

  var SDK = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/+esm';
  var BULUT_TURLERI = ['strateji', 'izleme', 'ayar', 'not'];
  var LS = 'kalibre-store-';

  // ── dil ─────────────────────────────────────────────────────────────────
  function dilBul() {
    try {
      var q = new URLSearchParams(location.search).get('dil');
      if (q === 'en' || q === 'tr') return q;
    } catch (e) {}
    var h = (document.documentElement.getAttribute('lang') || '').slice(0, 2).toLowerCase();
    if (h === 'en' || h === 'tr') return h;
    try { var k = localStorage.getItem('kalibre-dil'); if (k === 'en' || k === 'tr') return k; } catch (e) {}
    return 'en'; // site İngilizce; Türkçe yalnız açıkça seçilince
  }
  var DIL = dilBul();
  // Kayıtta "ürün güncellemesi e-postası istemiyorum" seçimi (giriş sayfası yazar).
  function pazarlamaRet() { try { return localStorage.getItem('kalibre-pazarlama-ret') === '1'; } catch (e) { return false; } }
  var EN = DIL === 'en';
  var M = EN ? {
    signIn: 'Sign in', account: 'Account', license: 'License', strategies: 'Saved strategies', signOut: 'Sign out',
    notConfigured: 'Sign-in not configured', menu: 'Account menu'
  } : {
    signIn: 'Giriş yap', account: 'Hesabım', license: 'Lisans', strategies: 'Kayıtlı stratejiler', signOut: 'Çıkış yap',
    notConfigured: 'Giriş yapılandırılmadı', menu: 'Hesap menüsü'
  };
  var PATHS = EN
    ? { signIn: '/sign-in', account: '/account', pricing: '/pricing', connect: '/connect', lab: '/lab', home: '/' }
    : { signIn: '/tr/sign-in', account: '/tr/account', pricing: '/tr/pricing', connect: '/tr/connect', lab: '/lab?dil=tr', home: '/tr' };
  Object.keys(PATHS).forEach(function (k) {
    var m = document.querySelector('meta[name="kalibre:yol:' + k + '"]');
    if (m && /^\/(?!\/)/.test(m.content)) PATHS[k] = m.content;
  });

  // ── durum ───────────────────────────────────────────────────────────────
  var CFG = {}, ENABLED = false, sb = null, session = null, dinleyiciler = [], hazirCoz;
  var hazir = new Promise(function (r) { hazirCoz = r; });
  var GELISTIRME = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || /\.vercel\.app$/.test(location.hostname);

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function user() {
    var u = session && session.user;
    if (!u) return null;
    var m = u.user_metadata || {};
    return { id: u.id, email: u.email || '', name: m.full_name || m.name || '' };
  }
  function yay() { var u = user(); dinleyiciler.forEach(function (f) { try { f(u); } catch (e) {} }); }

  // Yalnız bu sitenin içindeki bir yola dönülür (açık yönlendirme olmasın).
  function guvenliYol(y) {
    y = String(y || '');
    return /^\/(?!\/)[A-Za-z0-9\-._~\/?=&%#]*$/.test(y) && y.indexOf('\\') < 0 ? y : PATHS.account;
  }
  function donusAdresi(next) {
    return location.origin + PATHS.signIn + '?sonra=' + encodeURIComponent(guvenliYol(next || PATHS.account));
  }

  // ── başlık menüsü ───────────────────────────────────────────────────────
  var CSS =
    '.kh{position:relative;display:inline-flex;flex-shrink:0}' +
    '.kh-d{display:inline-flex;align-items:center;gap:8px;min-height:36px;padding:0 12px;border-radius:6px;border:1px solid #33465f;' +
    'background:transparent;color:#e7ecf2;font:500 14px/1 "IBM Plex Sans",system-ui,sans-serif;cursor:pointer;text-decoration:none;white-space:nowrap}' +
    '.kh-d:hover{border-color:#a3b0c2;color:#fff}' +
    '.kh-d.pasif{color:#73839a;border-style:dashed;cursor:default}' +
    '.kh-a{width:24px;height:24px;border-radius:50%;background:#5fb89a;color:#08130f;display:inline-grid;place-items:center;font:600 12px/1 "IBM Plex Sans",sans-serif;text-transform:uppercase}' +
    '.kh-d.yuvarlak{padding:0 6px 0 6px;border-color:transparent}.kh-d.yuvarlak:hover{border-color:#33465f}' +
    '.kh-m{position:absolute;right:0;top:calc(100% + 8px);min-width:220px;background:#132033;border:1px solid #33465f;border-radius:8px;padding:6px;' +
    'box-shadow:0 14px 40px rgba(0,0,0,.45);z-index:100;display:none;font:400 14px/1.45 "IBM Plex Sans",system-ui,sans-serif}' +
    '.kh-m.acik{display:block}' +
    '.kh-m .e{padding:8px 10px 10px;color:#73839a;font-size:13px;border-bottom:1px solid #24344c;margin-bottom:4px;word-break:break-all}' +
    '.kh-m a,.kh-m button{display:block;width:100%;text-align:left;padding:8px 10px;border-radius:6px;border:0;background:none;color:#a3b0c2;text-decoration:none;font:inherit;cursor:pointer}' +
    '.kh-m a:hover,.kh-m button:hover{background:#17263b;color:#e7ecf2}' +
    '@media(max-width:560px){.kh-d .kh-ad{display:none}}';

  function stilEkle() {
    if (document.getElementById('kh-stil')) return;
    var s = document.createElement('style'); s.id = 'kh-stil'; s.textContent = CSS;
    document.head.appendChild(s);
  }

  // Başlıktaki yer: açık yuva > site üst barı > eski sayfaların kabuğu > laboratuvar başlığı.
  function yuvalar() {
    var l = [].slice.call(document.querySelectorAll('[data-kalibre-auth]'));
    if (l.length) return l;
    var hedef = null, once = null;
    var site = document.querySelector('header.ust > .kap');
    var kabuk = document.querySelector('#km-ust > .k');
    var lab = document.querySelector('header.ust > .ust-eylem');
    if (site) { hedef = site; once = site.querySelector(':scope > .dugme:not(.ikincil)'); }
    else if (kabuk) { hedef = kabuk; once = kabuk.querySelector(':scope > .d:not(.ikincil)'); }
    else if (lab) { hedef = lab; }
    if (!hedef) return [];
    var y = document.createElement('span');
    y.setAttribute('data-kalibre-auth', '');
    hedef.insertBefore(y, once);
    return [y];
  }

  var acikMenu = null;
  document.addEventListener('click', function () { if (acikMenu) { acikMenu.classList.remove('acik'); acikMenu = null; } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && acikMenu) { acikMenu.classList.remove('acik'); acikMenu = null; } });

  function menuCiz() {
    stilEkle();
    var u = user();
    yuvalar().forEach(function (y) {
      y.className = 'kh';
      if (!ENABLED) {
        y.innerHTML = GELISTIRME ? '<span class="kh-d pasif" title="static/kalibre-config.js">' + esc(M.notConfigured) + '</span>' : '';
        return;
      }
      if (!u) {
        if (location.pathname.replace(/\/$/, '') === PATHS.signIn) { y.innerHTML = ''; return; } // giriş sayfasının kendisi
        var sonra = location.pathname + location.search;
        y.innerHTML = '<a class="kh-d" href="' + PATHS.signIn + '?sonra=' + encodeURIComponent(sonra) + '">' + esc(M.signIn) + '</a>';
        return;
      }
      var bas = (u.name || u.email || '?').trim().charAt(0) || '?';
      var hesap = PATHS.account;
      y.innerHTML =
        '<button type="button" class="kh-d yuvarlak" aria-haspopup="true" aria-expanded="false" aria-label="' + esc(M.menu) + '">' +
        '<span class="kh-a" aria-hidden="true">' + esc(bas) + '</span></button>' +
        '<div class="kh-m" role="menu">' +
        '<div class="e">' + esc(u.email) + '</div>' +
        '<a role="menuitem" href="' + hesap + '">' + esc(M.account) + '</a>' +
        '<a role="menuitem" href="' + hesap + '#lisanslar">' + esc(M.license) + '</a>' +
        '<a role="menuitem" href="' + hesap + '#stratejiler">' + esc(M.strategies) + '</a>' +
        '<button type="button" role="menuitem" data-cikis>' + esc(M.signOut) + '</button></div>';
      var d = y.querySelector('button.kh-d'), m = y.querySelector('.kh-m');
      d.onclick = function (e) {
        e.stopPropagation();
        var ac = !m.classList.contains('acik');
        if (acikMenu && acikMenu !== m) acikMenu.classList.remove('acik');
        m.classList.toggle('acik', ac); d.setAttribute('aria-expanded', String(ac)); acikMenu = ac ? m : null;
      };
      m.onclick = function (e) { e.stopPropagation(); };
      y.querySelector('[data-cikis]').onclick = function () { signOut(); };
    });
  }

  // ── oturum işlemleri ────────────────────────────────────────────────────
  function kapali() { return Promise.resolve({ error: { message: M.notConfigured } }); }

  function signInWithEmail(email, o) {
    if (!sb) return kapali();
    return sb.auth.signInWithOtp({
      email: String(email || '').trim(),
      options: { emailRedirectTo: donusAdresi(o && o.next), shouldCreateUser: true, data: { locale: DIL, marketing_opt_out: pazarlamaRet() ? 'true' : 'false' } }
    });
  }
  function verifyCode(email, code) {
    if (!sb) return kapali();
    return sb.auth.verifyOtp({ email: String(email || '').trim(), token: String(code || '').replace(/\s/g, ''), type: 'email' });
  }
  function signInWithGoogle(o) {
    if (!sb) return kapali();
    return sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: donusAdresi(o && o.next) } });
  }
  function signOut() {
    if (!sb) return Promise.resolve();
    return sb.auth.signOut().then(function () {
      session = null; menuCiz(); yay();
      if (location.pathname === PATHS.account || location.pathname === PATHS.account + '/') location.href = PATHS.home;
    });
  }
  function token() { return session && session.access_token || null; }

  // Kalibre uçlarına belirteçli istek. Yanıt her zaman {ok, status, data} döner.
  function api(yol, o) {
    o = o || {};
    var bas = { 'Content-Type': 'application/json' };
    var t = token();
    if (t) bas.Authorization = 'Bearer ' + t;
    var govde = o.body ? Object.assign({ dil: DIL }, o.body) : undefined;
    var url = yol + (yol.indexOf('?') < 0 ? '?' : '&') + 'dil=' + DIL;
    return fetch(url, { method: o.method || (govde ? 'POST' : 'GET'), headers: bas, body: govde ? JSON.stringify(govde) : undefined })
      .then(function (r) {
        var tur = r.headers.get('content-type') || '';
        return (tur.indexOf('json') >= 0 ? r.json() : r.blob()).catch(function () { return null; })
          .then(function (d) { return { ok: r.ok, status: r.status, data: d, headers: r.headers }; });
      })
      .catch(function () { return { ok: false, status: 0, data: null }; });
  }

  function profile() {
    if (!sb || !user()) return Promise.resolve(null);
    return sb.from('profiles').select('id,email,display_name,locale,marketing_consent,marketing_consent_at,terms_accepted_at,terms_version,created_at')
      .eq('id', user().id).maybeSingle().then(function (r) { return r.error ? null : r.data; });
  }
  function updateProfile(alanlar) {
    if (!sb || !user()) return kapali();
    return sb.from('profiles').update(alanlar).eq('id', user().id).then(function (r) { return { error: r.error }; });
  }

  // ── kayıt katmanı: önce yerel, giriş yapılmışsa bulut ───────────────────
  function lsAl(k) { try { return JSON.parse(localStorage.getItem(LS + k) || '[]'); } catch (e) { return []; } }
  function lsKoy(k, v) { try { localStorage.setItem(LS + k, JSON.stringify(v)); } catch (e) {} }
  function yerelKimlik() { return 'loc-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8); }
  function buluta(kind) { return !!(sb && user() && BULUT_TURLERI.indexOf(kind) >= 0); }

  var Store = {
    list: function (kind) {
      var yerel = lsAl(kind);
      if (!buluta(kind)) return Promise.resolve(yerel);
      return sb.from('user_items').select('id,kind,name,payload,updated_at').eq('kind', kind)
        .order('updated_at', { ascending: false }).limit(200)
        .then(function (r) {
          if (r.error) return yerel;
          var bekleyen = yerel.filter(function (x) { return String(x.id).indexOf('loc-') === 0; });
          var l = bekleyen.concat(r.data || []);
          lsKoy(kind, l);
          return l;
        });
    },
    save: function (kind, name, payload, id) {
      var satir = { id: id || yerelKimlik(), kind: kind, name: String(name || '').slice(0, 120), payload: payload, updated_at: new Date().toISOString() };
      var l = lsAl(kind).filter(function (x) { return x.id !== satir.id; });
      l.unshift(satir); lsKoy(kind, l);
      if (!buluta(kind)) return Promise.resolve(satir);
      var bulut = { kind: kind, name: satir.name, payload: payload, user_id: user().id };
      if (id && String(id).indexOf('loc-') !== 0) bulut.id = id;
      return sb.from('user_items').upsert(bulut).select('id,kind,name,payload,updated_at').then(function (r) {
        if (r.error || !r.data || !r.data[0]) return satir;
        var k = r.data[0];
        var yeni = lsAl(kind).filter(function (x) { return x.id !== satir.id && x.id !== k.id; });
        yeni.unshift(k); lsKoy(kind, yeni);
        return k;
      });
    },
    remove: function (kind, id) {
      lsKoy(kind, lsAl(kind).filter(function (x) { return x.id !== id; }));
      if (!buluta(kind) || String(id).indexOf('loc-') === 0) return Promise.resolve();
      return sb.from('user_items').delete().eq('id', id).then(function () {});
    }
  };

  // ── başlatma ────────────────────────────────────────────────────────────
  function ayarYukle() {
    if (window.KALIBRE_CONFIG) return Promise.resolve(window.KALIBRE_CONFIG);
    return new Promise(function (coz) {
      var s = document.createElement('script');
      s.src = '/static/kalibre-config.js';
      s.onload = function () { coz(window.KALIBRE_CONFIG || {}); };
      s.onerror = function () { coz({}); };
      document.head.appendChild(s);
    });
  }

  function basla() {
    ayarYukle().then(function (c) {
      CFG = c || {};
      ENABLED = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);
      window.KalibreAuth.enabled = ENABLED;
      if (!ENABLED) { menuCiz(); hazirCoz(); return; }
      return import(SDK).then(function (mod) {
        sb = mod.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {
          auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'kalibre-oturum' }
        });
        return sb.auth.getSession().then(function (r) {
          session = (r.data && r.data.session) || null;
          sb.auth.onAuthStateChange(function (olay, s) { session = s; menuCiz(); yay(); });
          menuCiz();
          hazirCoz();
        });
      });
    }).catch(function (e) {
      if (window.console) console.warn('[kalibre-auth]', e && e.message);
      sb = null; ENABLED = false; window.KalibreAuth.enabled = false; menuCiz(); hazirCoz();
    });
  }

  window.KalibreAuth = {
    enabled: false,
    lang: DIL,
    paths: PATHS,
    ready: function () { return hazir; },
    user: user,
    token: token,
    api: api,
    client: function () { return sb; },
    signInWithEmail: signInWithEmail,
    verifyCode: verifyCode,
    signInWithGoogle: signInWithGoogle,
    signOut: signOut,
    profile: profile,
    updateProfile: updateProfile,
    openLogin: function () { location.href = PATHS.signIn + '?sonra=' + encodeURIComponent(location.pathname + location.search); },
    onChange: function (f) { dinleyiciler.push(f); },
    refreshButtons: menuCiz,
    safePath: guvenliYol
  };
  window.KalibreStore = Store;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', basla);
  else basla();
})();
