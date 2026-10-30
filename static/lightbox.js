// Click-to-enlarge for product screenshots. Any <img> inside figure.p-cerceve, .d-gorsel or
// .urun-hero opens full size in an overlay (the largest source of its <picture> when there is one).
// Keyboard: Enter or Space opens, Escape closes; focus returns to the image.
(() => {
  const SELECTOR = 'figure.p-cerceve img, .d-gorsel img, .urun-hero img';
  let overlay = null, lastTrigger = null;

  const style = document.createElement('style');
  style.textContent = `
    .lb-zoomable { cursor: zoom-in; }
    .lb-overlay { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center;
      padding: 24px; background: rgba(6, 10, 16, .88); cursor: zoom-out; }
    .lb-overlay img { max-width: min(1600px, 100%); max-height: 100%; width: auto; height: auto; border-radius: 6px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, .5); background: #0f1722; }
    .lb-close { position: fixed; top: 14px; right: 16px; width: 40px; height: 40px; border-radius: 50%; border: 1px solid rgba(255,255,255,.25);
      background: rgba(15, 23, 34, .8); color: #fff; font: 22px/1 system-ui, sans-serif; cursor: pointer; }
    .lb-caption { position: fixed; left: 50%; bottom: 14px; transform: translateX(-50%); max-width: calc(100% - 32px);
      color: #cbd5e1; font: 13px/1.4 system-ui, sans-serif; text-align: center; }
    @media (prefers-reduced-motion: no-preference) { .lb-overlay { animation: lb-in .15s ease-out; } @keyframes lb-in { from { opacity: 0; } } }`;
  document.head.appendChild(style);

  // Largest candidate: the widest entry of a WebP srcset, else the image's own src.
  function largestSource(img) {
    const source = img.closest('picture')?.querySelector('source[srcset]');
    const list = (source?.getAttribute('srcset') ?? img.getAttribute('srcset') ?? '').split(',').map(s => s.trim().split(/\s+/)).filter(p => p[0]);
    const best = list.sort((a, b) => parseInt(b[1] ?? '0', 10) - parseInt(a[1] ?? '0', 10))[0];
    return best ? best[0] : img.currentSrc || img.src;
  }

  function close() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    document.removeEventListener('keydown', onKey);
    lastTrigger?.focus();
  }
  function onKey(e) { if (e.key === 'Escape') close(); }

  function open(img) {
    lastTrigger = img;
    overlay = document.createElement('div');
    overlay.className = 'lb-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', img.alt || 'Image');
    const big = document.createElement('img');
    big.src = largestSource(img);
    big.alt = img.alt;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lb-close';
    btn.setAttribute('aria-label', document.documentElement.lang === 'tr' ? 'Kapat' : 'Close');
    btn.textContent = '×';
    overlay.append(big, btn);
    if (img.alt) { const cap = document.createElement('p'); cap.className = 'lb-caption'; cap.textContent = img.alt; overlay.append(cap); }
    overlay.addEventListener('click', close);
    document.body.appendChild(overlay);
    document.addEventListener('keydown', onKey);
    btn.focus();
  }

  for (const img of document.querySelectorAll(SELECTOR)) {
    img.classList.add('lb-zoomable');
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', `${img.alt ? img.alt + '. ' : ''}${document.documentElement.lang === 'tr' ? 'Büyütmek için tıkla' : 'Click to enlarge'}`);
    img.addEventListener('click', () => open(img));
    img.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(img); } });
  }
})();
