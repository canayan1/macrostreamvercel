// Click-to-enlarge for product screenshots. Any <img> inside figure.shot, .page-hero-media or
// .panel-media (and the older figure.p-cerceve, .d-gorsel, .urun-hero) opens full size in an overlay,
// using the largest source of its <picture>. Images inside a link keep the link.
// Keyboard: Enter or Space opens, Escape closes; focus returns to the image. On a phone the enlarged
// screen is shown wider than the viewport and scrolls, so its text can be read.
(() => {
  const SELECTOR = 'figure.shot img, .page-hero-media img, .panel-media img, figure.p-cerceve img, .d-gorsel img, .urun-hero img';
  let overlay = null, lastTrigger = null;

  const style = document.createElement('style');
  style.textContent = `
    .lb-zoomable { cursor: zoom-in; }
    .lb-zoomable:focus-visible { outline: 2px solid #ffa630; outline-offset: 4px; }
    .lb-overlay { position: fixed; inset: 0; z-index: 100001; display: flex; align-items: center; justify-content: center;
      padding: 56px 24px 48px; background: rgba(16, 14, 12, .94); cursor: zoom-out; overscroll-behavior: contain; }
    .lb-overlay img { max-width: min(1800px, 100%); max-height: 100%; width: auto; height: auto; border-radius: 8px;
      box-shadow: 0 0 0 1px #3a332a, 0 24px 70px rgba(0, 0, 0, .6); background: #1a1612; }
    .lb-close { position: fixed; z-index: 1; top: 12px; right: 14px; width: 40px; height: 40px; border-radius: 50%; border: 1px solid #3a332a;
      background: #221d18; color: #ebe3d3; font: 22px/1 system-ui, sans-serif; cursor: pointer; }
    .lb-close:hover, .lb-close:focus-visible { border-color: #ffa630; outline: none; }
    .lb-caption { position: fixed; left: 50%; bottom: 14px; transform: translateX(-50%); width: max-content; max-width: calc(100% - 32px);
      margin: 0; color: #a89c83; font: 13px/1.4 system-ui, sans-serif; text-align: center; }
    @media (max-width: 899px) {
      .lb-overlay { display: block; overflow: auto; padding: 60px 16px 56px; }
      .lb-overlay img { max-width: none; max-height: none; width: 1200px; }
    }
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
    document.documentElement.style.overflow = '';
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
    const caption = img.closest('figure')?.nextElementSibling?.matches('figcaption, .caption') ? img.closest('figure').nextElementSibling.textContent : img.alt;
    if (caption) { const cap = document.createElement('p'); cap.className = 'lb-caption'; cap.textContent = caption; overlay.append(cap); }
    overlay.addEventListener('click', close);
    document.body.appendChild(overlay);
    document.documentElement.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    btn.focus();
  }

  for (const img of document.querySelectorAll(SELECTOR)) {
    if (img.closest('a, button')) continue;
    img.classList.add('lb-zoomable');
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', `${img.alt ? img.alt + '. ' : ''}${document.documentElement.lang === 'tr' ? 'Büyütmek için tıkla' : 'Click to enlarge'}`);
    img.addEventListener('click', () => open(img));
    img.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(img); } });
  }
})();
