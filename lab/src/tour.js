// Guided tour: a small panel that walks a visitor through a page one card at a time. Each step
// scrolls its target into view, outlines it and explains it in one or two sentences. Opened with
// ?tour=1 or by calling startTour(). Keyboard: right arrow or Enter for next, left arrow for back,
// Escape to close. Steps whose target is missing or hidden are skipped.
//
// startTour(steps, { labels }) where steps: [{ target: CSS selector, title, text, before?: () => void }]

const STYLE = `
.tour-panel{position:fixed;right:20px;bottom:20px;z-index:60;width:min(380px,calc(100vw - 32px));background:var(--surface-2);
  border:1px solid var(--action,#ffa630);border-radius:12px;padding:16px 18px;box-shadow:0 18px 50px rgba(0,0,0,.55);color:var(--text)}
.tour-panel h3{margin:0 0 6px;font:600 16px/1.3 var(--sans);text-transform:none;letter-spacing:0;color:var(--text)}
.tour-panel p{margin:0;color:var(--text-dim);font-size:14px;line-height:1.5}
.tour-panel .tour-foot{display:flex;align-items:center;gap:8px;margin-top:14px}
.tour-panel .tour-count{font:500 12px var(--mono);color:var(--muted);margin-right:auto}
.tour-on{outline:2px solid var(--action,#ffa630);outline-offset:6px;border-radius:12px;transition:outline-color .2s}
@media (max-width:640px){.tour-panel{right:16px;left:16px;bottom:16px;width:auto}}
@media (prefers-reduced-motion:reduce){.tour-on{transition:none}}`;

let active = null;

export function startTour(steps, { labels = {} } = {}) {
  stopTour();
  const L = { next: 'Next', back: 'Back', done: 'Done', close: 'Close tour', of: 'of', ...labels };
  if (!document.getElementById('tour-style')) document.head.insertAdjacentHTML('beforeend', `<style id="tour-style">${STYLE}</style>`);
  const panel = document.createElement('div');
  panel.className = 'tour-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-live', 'polite');
  document.body.append(panel);
  const visible = s => { const e = document.querySelector(s.target); return e && !e.closest('[hidden]') && e.offsetParent !== null; };
  let i = 0, lit = null;

  const show = () => {
    steps[i].before?.();
    const list = steps.filter(s => visible(s) || s.before);
    const step = steps[i];
    lit?.classList.remove('tour-on');
    lit = document.querySelector(step.target);
    lit.classList.add('tour-on');
    lit.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    const n = list.indexOf(step) + 1, last = nextIndex(1) === -1;
    panel.innerHTML = `<h3></h3><p></p><div class="tour-foot"><span class="tour-count">${n} ${L.of} ${list.length}</span>`
      + `${prevIndex() === -1 ? '' : '<button type="button" class="dugme ikincil" data-back></button>'}`
      + '<button type="button" class="dugme" data-next></button><button type="button" class="kucuk" data-close aria-label="">×</button></div>';
    panel.querySelector('h3').textContent = step.title;
    panel.querySelector('p').textContent = step.text;
    panel.querySelector('[data-next]').textContent = last ? L.done : L.next;
    panel.querySelector('[data-close]').setAttribute('aria-label', L.close);
    const back = panel.querySelector('[data-back]');
    if (back) { back.textContent = L.back; back.onclick = () => go(-1); }
    panel.querySelector('[data-next]').onclick = () => (last ? stopTour() : go(1));
    panel.querySelector('[data-close]').onclick = stopTour;
    panel.querySelector('[data-next]').focus({ preventScroll: true });
  };
  const nextIndex = d => { for (let k = i + d; k >= 0 && k < steps.length; k += d) if (visible(steps[k]) || steps[k].before) return k; return -1; };
  const prevIndex = () => nextIndex(-1);
  const go = d => { const k = nextIndex(d); if (k !== -1) { i = k; show(); } };
  const keys = e => {
    if (e.key === 'Escape') stopTour();
    else if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
  };
  document.addEventListener('keydown', keys);
  active = { panel, keys, unlight: () => lit?.classList.remove('tour-on') };
  if (!visible(steps[0]) && !steps[0].before) i = nextIndex(1);
  if (i !== -1) show();
}

export function stopTour() {
  if (!active) return;
  active.unlight();
  active.panel.remove();
  document.removeEventListener('keydown', active.keys);
  active = null;
}
