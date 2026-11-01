/*
  EYK — interface layer, shared by index.html and tools.html.
  Every block is guarded so a page only runs what it has.
*/
(function () {
  'use strict';

  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad3 = v => String(Math.max(0, Math.round(v))).padStart(3, '0');

  // ── Language (KO / EN) ──
  const opts = document.querySelectorAll('.lang-opt');
  function setLang(l) {
    root.setAttribute('data-lang', l);
    root.setAttribute('lang', l);
    try { localStorage.setItem('eyk-lang', l); } catch (e) {}
    opts.forEach(o => o.setAttribute('aria-pressed', String(o.dataset.l === l)));
  }
  opts.forEach(o => o.addEventListener('click', () => setLang(o.dataset.l)));
  const curLang = root.getAttribute('data-lang') || 'ko';
  opts.forEach(o => o.setAttribute('aria-pressed', String(o.dataset.l === curLang)));

  // ── Loader ──
  const loader = document.getElementById('loader');
  if (loader) {
    const pct = loader.querySelector('.loader__pct');
    const bar = loader.querySelector('.loader__bar i');
    let target = 12, shown = 0, finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      target = 100;
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { target = Math.max(target, 55); });
    addEventListener('eyk:scene-ready', done);
    setTimeout(done, reduced ? 200 : 3500);
    (function tick() {
      shown += (target - shown) * (reduced ? 1 : .14);
      if (pct) pct.textContent = pad3(shown);
      if (bar) bar.style.transform = 'scaleX(' + shown / 100 + ')';
      if (finished && shown > 99) {
        loader.classList.add('off');
        root.classList.remove('is-loading');
        setTimeout(() => loader.remove(), 700);
        return;
      }
      requestAnimationFrame(tick);
    })();
  }

  // ── Seoul clock ──
  const clocks = document.querySelectorAll('[data-clock]');
  if (clocks.length) {
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const tick = () => { const s = fmt.format(new Date()); clocks.forEach(c => { c.textContent = s; }); };
    tick();
    setInterval(tick, 1000);
  }

  // ── Pointer readouts + crosshair ──
  const xEl = document.getElementById('readX');
  const yEl = document.getElementById('readY');
  const cross = document.getElementById('cross');
  const fine = matchMedia('(pointer: fine)').matches;
  if (fine && cross) cross.hidden = false;
  addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    if (xEl) xEl.textContent = pad3(e.clientX);
    if (yEl) yEl.textContent = pad3(e.clientY);
    if (cross) {
      cross.classList.add('live');
      cross.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
      cross.classList.toggle('hot', !!e.target.closest('a,button,label,input'));
    }
  }, { passive: true });

  // ── Scroll progress + parallax ──
  const pctEl = document.getElementById('scrollPct');
  const fill = document.getElementById('scrollFill');
  const drift = [...document.querySelectorAll('[data-drift]')];
  let ticking = false;
  function onScroll() {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, scrollY / max) : 0;
    if (pctEl) pctEl.textContent = pad3(p * 100);
    if (fill) fill.style.transform = 'scaleX(' + p + ')';
    if (reduced) return;
    drift.forEach(el => {
      const box = el.parentElement.getBoundingClientRect();
      const local = (innerHeight - box.top) / (innerHeight + box.height);
      const v = parseFloat(el.dataset.drift);
      el.style.transform = 'translate3d(' + (local - .5) * v * innerWidth * .01 + 'px,0,0)';
    });
  }
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  onScroll();

  // ── Reveal ──
  const reveals = document.querySelectorAll('.rv');
  if (reveals.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      reveals.forEach(el => el.classList.add('in'));
    } else {
      const io = new IntersectionObserver(es => {
        es.forEach(e => {
          if (!e.isIntersecting) return;
          e.target.classList.add('in');
          io.unobserve(e.target);
        });
      }, { threshold: .08, rootMargin: '0px 0px -6% 0px' });
      reveals.forEach(el => io.observe(el));
    }
  }

  // ── Latin display words decode into place ──
  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#+';
  function decode(el) {
    const text = el.dataset.text;
    const start = performance.now(), dur = 620;
    (function step(now) {
      const p = Math.min(1, (now - start) / dur);
      const keep = Math.floor(p * text.length);
      let out = '';
      for (let i = 0; i < text.length; i++) {
        out += i < keep || text[i] === ' ' ? text[i] : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }
  if (!reduced && 'IntersectionObserver' in window) {
    const words = document.querySelectorAll('[data-decode]');
    const dio = new IntersectionObserver(es => {
      es.forEach(e => {
        if (!e.isIntersecting) return;
        decode(e.target);
        dio.unobserve(e.target);
      });
    }, { threshold: .4 });
    words.forEach(el => { el.dataset.text = el.textContent; dio.observe(el); });
  }

  // ── The disc in the footer panel tilts with the pointer ──
  const disc = document.getElementById('disc');
  if (disc && fine && !reduced) {
    let dx = 0, cur = 0;
    addEventListener('pointermove', e => { dx = (e.clientX / innerWidth - .5) * 7; }, { passive: true });
    (function spin() {
      cur += (dx - cur) * .06;
      disc.style.transform = 'rotate(' + (-3 + cur) + 'deg)';
      requestAnimationFrame(spin);
    })();
  }

  // ── iPhone Duo: float the bar beside the page on the unfolded inner screen ──
  // Safari reports a plain iPhone with no fold signal, so the short side tells them apart:
  // other iPhones stop at 440, the Duo's folded screen and Split View stay under 400.
  if (/iPhone/.test(navigator.userAgent)) {
    let settle;
    const fitRail = () => {
      const on = Math.min(innerWidth, innerHeight) >= 480;
      if (on === root.classList.contains('duo-rail')) return;
      root.classList.toggle('duo-rail', on);
      dispatchEvent(new Event('resize'));
    };
    fitRail();
    addEventListener('resize', () => { clearTimeout(settle); settle = setTimeout(fitRail, 150); }, { passive: true });
  }

  // ── Mobile menu ──
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('mobileMenu');
  if (toggle && menu) {
    const setMenu = open => {
      toggle.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('open', open);
      document.body.classList.toggle('menu-open', open);
    };
    toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
    addEventListener('resize', () => { if (innerWidth > 900 || root.classList.contains('duo-rail')) setMenu(false); });
  }

  // ── Terms agreement → download gate (tools page) ──
  const agreeCheck = document.getElementById('agreeCheck');
  const downloadBtn = document.getElementById('downloadBtn');
  if (agreeCheck && downloadBtn) {
    agreeCheck.addEventListener('change', () => {
      downloadBtn.classList.toggle('enabled', agreeCheck.checked);
      downloadBtn.setAttribute('aria-disabled', agreeCheck.checked ? 'false' : 'true');
    });
    downloadBtn.addEventListener('click', e => {
      if (!agreeCheck.checked) { e.preventDefault(); return; }
      if (downloadBtn.getAttribute('href') === '#') {
        e.preventDefault();
        const note = document.querySelector('.download-note');
        if (note) note.textContent = root.getAttribute('data-lang') === 'en'
          ? 'The download link will be provided soon. Contact: contact@eyk.kr'
          : '다운로드 링크는 추후 제공될 예정입니다. 문의: contact@eyk.kr';
      }
    });
  }
})();
