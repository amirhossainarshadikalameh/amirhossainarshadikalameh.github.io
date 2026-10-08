/* Theme switch for the project pages (the main page has its own, in site.js). */
(function () {
  var root = document.documentElement;
  var btn = document.getElementById('themeBtn');
  function apply(t, save) {
    root.setAttribute('data-theme', t);
    if (save) { try { localStorage.setItem('theme', t); } catch (e) {} }
    if (btn) {
      var label = t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#070b16' : '#f5f7fb');
  }
  if (btn) {
    btn.addEventListener('click', function () {
      apply(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true);
    });
  }
  apply(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light', false);
  try {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function (e) {
      var saved = null;
      try { saved = localStorage.getItem('theme'); } catch (err) {}
      if (!saved) apply(e.matches ? 'light' : 'dark', false);
    });
  } catch (e) {}
})();
