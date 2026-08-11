/* Language switch. Shares the `eyk-lang` key with the rest of eyk.kr,
   so a visitor who picked a language on the portfolio keeps it here. */
(function () {
  'use strict';

  var KEY = 'eyk-lang';
  var root = document.documentElement;

  function apply(lang) {
    if (lang !== 'ko' && lang !== 'en') return;
    root.setAttribute('data-lang', lang);
    root.setAttribute('lang', lang);
    try { localStorage.setItem(KEY, lang); } catch (e) {}

    var opts = document.querySelectorAll('.lang-opt');
    for (var i = 0; i < opts.length; i++) {
      opts[i].setAttribute('aria-pressed', String(opts[i].dataset.l === lang));
    }

    // The <title> carries the document name, so it has to follow the language.
    var t = document.body && document.body.getAttribute('data-title-' + lang);
    if (t) document.title = t;
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.lang-opt') : null;
    if (btn) apply(btn.dataset.l);
  });

  // Honour ?lang=ko / ?lang=en so the Web Store listing can link either one.
  var q = null;
  try { q = new URLSearchParams(location.search).get('lang'); } catch (e) {}
  apply(q || root.getAttribute('data-lang') || 'en');
})();
