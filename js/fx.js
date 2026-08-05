/* Signup Churn — animations & micro-interactions
   Reveal au scroll, parallax léger, count-up, accordéon FAQ.
   Tout est coupé si prefers-reduced-motion. */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Reveal au scroll ---------- */
/* Éléments .rv : cachés puis révélés en cascade quand ils entrent dans le viewport.
   data-rv-delay="120" pour décaler manuellement (ms). Les enfants directs d'un
   conteneur .rv-stagger se révèlent les uns après les autres. */

function initReveal() {
  const els = document.querySelectorAll('.rv');
  if (REDUCED || !('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('on'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const d = parseInt(el.dataset.rvDelay || '0', 10);
      setTimeout(() => el.classList.add('on'), d);
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  document.querySelectorAll('.rv-stagger').forEach(wrap => {
    [...wrap.children].forEach((child, i) => {
      child.classList.add('rv');
      if (!child.dataset.rvDelay) child.dataset.rvDelay = String(i * 110);
    });
  });
  document.querySelectorAll('.rv').forEach(el => io.observe(el));
}

/* ---------- Parallax léger ---------- */
/* .plx : le fond se déplace plus lentement que le scroll (transform, rAF).
   data-plx="0.18" règle l'amplitude. Appliqué à un enfant .plx-layer. */

function initParallax() {
  if (REDUCED) return;
  const els = [...document.querySelectorAll('.plx')];
  if (!els.length) return;
  let ticking = false;
  function frame() {
    ticking = false;
    const vh = window.innerHeight;
    els.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -80 || r.top > vh + 80) return;
      const speed = parseFloat(el.dataset.plx || '0.16');
      const center = r.top + r.height / 2 - vh / 2;
      const layer = el.querySelector('.plx-layer');
      if (layer) layer.style.transform = `translate3d(0, ${(-center * speed).toFixed(1)}px, 0)`;
    });
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  frame();
}

/* ---------- Count-up ---------- */
/* countUp(el, opts) anime un nombre. data-count sur un élément + .rv déclenche
   automatiquement au reveal (formats gérés : "26 %", "45 120 €", "+9 M€"). */

function countUp(el, { from = 0, to, dur = 900, format = v => String(Math.round(v)) }) {
  if (REDUCED) { el.textContent = format(to); return; }
  const t0 = performance.now();
  const ease = t => 1 - Math.pow(1 - t, 3);
  function tick(now) {
    const p = Math.min(1, (now - t0) / dur);
    el.textContent = format(from + (to - from) * ease(p));
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  // rAF est suspendu si l'onglet est en arrière-plan : on garantit la valeur finale
  setTimeout(() => { el.textContent = format(to); }, dur + 200);
}

function initAutoCounts() {
  const els = document.querySelectorAll('[data-count]');
  if (!els.length) return;
  const run = el => {
    if (el.dataset.counted) return;
    el.dataset.counted = '1';
    const raw = el.dataset.count;                     // valeur cible ex "26" / "45120"
    const tpl = el.dataset.countTpl || '{v}';          // gabarit ex "{v} %" / "{v} €"
    const dec = raw.includes('.') ? 1 : 0;
    const to = parseFloat(raw);
    countUp(el, {
      to,
      dur: parseInt(el.dataset.countDur || '950', 10),
      format: v => tpl.replace('{v}', (dec ? (Math.round(v * 10) / 10).toLocaleString('fr-FR')
                                           : Math.round(v).toLocaleString('fr-FR')))
    });
  };
  if (REDUCED || !('IntersectionObserver' in window)) { els.forEach(run); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.4 });
  els.forEach(el => io.observe(el));
}

/* ---------- Accordéon FAQ ---------- */

function initFaq() {
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    if (!q) return;
    q.addEventListener('click', () => {
      const open = item.classList.contains('open');
      item.closest('.faq-list').querySelectorAll('.faq-item.open').forEach(o => o.classList.remove('open'));
      if (!open) item.classList.add('open');
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  initParallax();
  initAutoCounts();
  initFaq();
});

/* ---------- Moyennes du marché : glow qui glisse entre les cartes ---------- */

function initMcardGlow() {
  const wrap = document.querySelector('.mmodels');
  if (!wrap || REDUCED || window.matchMedia('(hover: none)').matches) return;
  const glow = document.createElement('div');
  glow.className = 'mglow';
  wrap.prepend(glow);
  wrap.querySelectorAll('.mmodel').forEach(card => {
    card.addEventListener('mouseenter', () => {
      glow.style.width = card.offsetWidth + 'px';
      glow.style.height = card.offsetHeight + 'px';
      glow.style.transform = `translate(${card.offsetLeft}px, ${card.offsetTop}px)`;
      glow.classList.add('on');
    });
  });
  wrap.addEventListener('mouseleave', () => glow.classList.remove('on'));
}
document.addEventListener('DOMContentLoaded', initMcardGlow);
