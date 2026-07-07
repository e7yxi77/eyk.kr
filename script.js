/*
  EYK Portfolio — interaction layer
  Adapted from TemplateMo 621 Luminary, guarded so every block is optional per page.
*/

// ── Smooth scroll for in-page anchors ──
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    if (link.id === 'downloadBtn' || link.hasAttribute('download')) return;
    const href = link.getAttribute('href');
    if (href === '#') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (href.length > 1) {
      const target = document.querySelector(href);
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
    }
  });
});

// ── Reveal on scroll ──
const reveals = document.querySelectorAll('.reveal');
if (reveals.length) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
  reveals.forEach(el => io.observe(el));
}

// ── Animated counters ──
document.querySelectorAll('.counter').forEach(el => {
  new IntersectionObserver(([e], obs) => {
    if (!e.isIntersecting) return;
    const t = parseFloat(el.dataset.target), d = parseInt(el.dataset.decimals), dur = 1800, s = performance.now();
    const ease = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    (function u(n) { const p = Math.min((n - s) / dur, 1); el.textContent = (t * ease(p)).toFixed(d); if (p < 1) requestAnimationFrame(u); })(s);
    obs.unobserve(el);
  }, { threshold: 0.5 }).observe(el);
});

// ── Nav background on scroll ──
const topNav = document.getElementById('topNav');
if (topNav) {
  window.addEventListener('scroll', () => topNav.classList.toggle('scrolled', scrollY > 60), { passive: true });
}

// ── Hero grid spotlight ──
const heroGrid = document.querySelector('.hero-grid');
const heroEl = document.getElementById('hero');
if (heroGrid && heroEl) {
  let gx = 0, gy = 0, tx = 0, ty = 0;
  document.addEventListener('mousemove', e => {
    const heroRect = heroEl.getBoundingClientRect();
    const gridRect = heroGrid.getBoundingClientRect();
    const activeTop = heroRect.top + heroRect.height * 0.3;
    if (e.clientY >= activeTop && e.clientY <= heroRect.bottom) {
      tx = e.clientX - gridRect.left;
      ty = e.clientY - gridRect.top;
    } else {
      tx = gridRect.width / 2;
      ty = gridRect.height * 0.3;
    }
  });
  (function lerpGrid() {
    gx += (tx - gx) * 0.08;
    gy += (ty - gy) * 0.08;
    heroGrid.style.setProperty('--mx', gx + 'px');
    heroGrid.style.setProperty('--my', gy + 'px');
    requestAnimationFrame(lerpGrid);
  })();
}

// ── Active nav + side panels ──
const navAnchors = document.querySelectorAll('.nav-links a');
const sectionEls = document.querySelectorAll('section[id]');
const leftDots = document.querySelectorAll('.side-panel.left .side-dot');
const rightDots = document.querySelectorAll('.side-panel.right .side-dot');
const leftTrack = document.getElementById('leftTrack');
const rightTrack = document.getElementById('rightTrack');
const scrollPctEl = document.getElementById('scrollPct');

if (sectionEls.length && (navAnchors.length || leftDots.length)) {
  function updateNavAndPanels() {
    const y = scrollY + innerHeight * 0.4;
    const maxScroll = document.documentElement.scrollHeight - innerHeight;
    const pct = maxScroll > 0 ? Math.min(scrollY / maxScroll, 1) : 0;

    let id = '', activeIndex = 0;
    sectionEls.forEach((s, i) => { if (y >= s.offsetTop) { id = s.id; activeIndex = i; } });
    navAnchors.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));

    const trackPct = (pct * 100).toFixed(0);
    if (leftTrack) leftTrack.style.height = trackPct + '%';
    if (rightTrack) rightTrack.style.height = trackPct + '%';
    if (scrollPctEl) scrollPctEl.textContent = String(trackPct).padStart(2, '0');

    if (leftDots.length) {
      const leftIdx = Math.min(activeIndex, leftDots.length - 1);
      leftDots.forEach((d, i) => d.classList.toggle('active', i === leftIdx));
    }
    if (rightDots.length) {
      const rightIdx = Math.min(activeIndex, rightDots.length - 1);
      rightDots.forEach((d, i) => d.classList.toggle('active', i === rightIdx));
    }
  }
  window.addEventListener('scroll', updateNavAndPanels, { passive: true });
  updateNavAndPanels();
}

// ── Mobile menu ──
const toggle = document.getElementById('navToggle');
const menu = document.getElementById('mobileMenu');
if (toggle && menu) {
  const menuLinks = menu.querySelectorAll('.mobile-menu-link');
  let menuOpen = false;
  function openMenu() { menuOpen = true; toggle.classList.add('active'); toggle.setAttribute('aria-expanded', 'true'); menu.classList.add('open'); document.body.classList.add('menu-open'); }
  function closeMenu() { if (!menuOpen) return; menuOpen = false; toggle.classList.remove('active'); toggle.setAttribute('aria-expanded', 'false'); menu.classList.remove('open'); document.body.classList.remove('menu-open'); }
  toggle.addEventListener('click', () => menuOpen ? closeMenu() : openMenu());
  menuLinks.forEach(l => l.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  window.addEventListener('resize', () => { if (innerWidth > 1024) closeMenu(); });
}

// ── FAQ accordion (optional) ──
const faqItems = document.querySelectorAll('.faq-item');
if (faqItems.length) {
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => btn.parentElement.classList.toggle('open'));
  });
}

// ── Terms agreement → download gate (tools detail page) ──
const agreeCheck = document.getElementById('agreeCheck');
const downloadBtn = document.getElementById('downloadBtn');
if (agreeCheck && downloadBtn) {
  agreeCheck.addEventListener('change', () => {
    downloadBtn.classList.toggle('enabled', agreeCheck.checked);
    downloadBtn.setAttribute('aria-disabled', agreeCheck.checked ? 'false' : 'true');
  });
  downloadBtn.addEventListener('click', e => {
    if (!agreeCheck.checked) { e.preventDefault(); return; }
    // Placeholder guard: until a real release URL is set (href !== '#'), don't jump — just inform.
    if (downloadBtn.getAttribute('href') === '#') {
      e.preventDefault();
      const note = document.querySelector('.download-note');
      if (note) note.textContent = document.documentElement.getAttribute('data-lang') === 'en'
        ? 'Download link coming soon. Contact: contact@eyk.kr'
        : '다운로드 링크가 곧 제공됩니다. 문의: contact@eyk.kr';
    }
  });
}

// ── Language switch (KO / EN) ──
(function () {
  const root = document.documentElement;
  const opts = document.querySelectorAll('.lang-opt');
  if (!opts.length) return;
  function setLang(l) {
    root.setAttribute('data-lang', l);
    root.setAttribute('lang', l);
    try { localStorage.setItem('eyk-lang', l); } catch (e) {}
    opts.forEach(o => o.setAttribute('aria-pressed', String(o.dataset.l === l)));
  }
  opts.forEach(o => o.addEventListener('click', () => setLang(o.dataset.l)));
  const cur = root.getAttribute('data-lang') || 'ko';
  opts.forEach(o => o.setAttribute('aria-pressed', String(o.dataset.l === cur)));
})();
