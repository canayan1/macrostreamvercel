// Global nav on small screens: the menu button opens a full-screen list; Escape or a link closes it.
(() => {
  const nav = document.querySelector('.gnav');
  const button = nav?.querySelector('.gnav-toggle');
  if (!nav || !button) return;
  const set = open => {
    nav.classList.toggle('open', open);
    button.setAttribute('aria-expanded', String(open));
    document.documentElement.style.overflow = open ? 'hidden' : '';
  };
  button.addEventListener('click', () => set(!nav.classList.contains('open')));
  nav.querySelectorAll('.gnav-links a').forEach(a => a.addEventListener('click', () => set(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) { set(false); button.focus(); } });
  matchMedia('(min-width: 901px)').addEventListener('change', e => { if (e.matches) set(false); });
})();
