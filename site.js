(function () {
  'use strict';
  var root = document.documentElement;
  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* helpers for the research timeline (defined early: the chart can be drawn as soon as a
     deep link such as #research opens that tab) */
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var SVGNS = 'http://www.w3.org/2000/svg';
  function ym(s) { var p = String(s).split('-'); return (+p[0]) * 12 + (+p[1] - 1); }
  function fmt(m) { return MONTHS[((m % 12) + 12) % 12] + ' ' + Math.floor(m / 12); }
  function el(name, attrs, parent) {
    var n = document.createElementNS(SVGNS, name);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  /* ---------- 1. Hide links that still contain a "YOUR-..." placeholder ---------- */
  $all('a[href*="YOUR-"]').forEach(function (a) { (a.closest('[data-optional]') || a).remove(); });

  /* ---------- 2. Colour theme ---------- */
  var themeBtn = document.getElementById('themeBtn');
  function applyTheme(t, save) {
    root.setAttribute('data-theme', t);
    if (save) { try { localStorage.setItem('theme', t); } catch (e) {} }
    var label = t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
    themeBtn.setAttribute('aria-label', label);
    themeBtn.setAttribute('title', label);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#070b16' : '#f5f7fb');
    document.dispatchEvent(new CustomEvent('themechange'));
  }
  themeBtn.addEventListener('click', function () {
    applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true);
  });
  applyTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light', false);
  try {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function (e) {
      var saved = null;
      try { saved = localStorage.getItem('theme'); } catch (err) {}
      if (!saved) applyTheme(e.matches ? 'light' : 'dark', false);
    });
  } catch (e) {}

  /* ---------- 3. Gallery (tab hidden while empty) + photo viewer ---------- */
  var shots = $all('#galleryGrid .shot a');
  if (!shots.length) {
    var gPanel = document.getElementById('gallery');
    var gTab = document.querySelector('.tabs [data-tab="gallery"]');
    if (gPanel) gPanel.remove();
    if (gTab) gTab.remove();
  } else {
    var lb = document.getElementById('lightbox');
    var lbImg = lb.querySelector('img');
    var lbCap = lb.querySelector('.lb-cap');
    var current = 0;
    var openAt = function (i) {
      current = (i + shots.length) % shots.length;
      var a = shots[current];
      var thumb = a.querySelector('img');
      var cap = a.parentNode.querySelector('figcaption');
      lbImg.src = a.getAttribute('href');
      lbImg.alt = thumb ? thumb.alt : '';
      lbCap.textContent = cap ? cap.textContent : (thumb ? thumb.alt : '');
      if (!lb.open) lb.showModal();
    };
    if (typeof lb.showModal === 'function') {
      shots.forEach(function (a, i) { a.addEventListener('click', function (e) { e.preventDefault(); openAt(i); }); });
      lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
      lb.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') openAt(current - 1);
        if (e.key === 'ArrowRight') openAt(current + 1);
      });
      lb.querySelector('[data-lb="close"]').addEventListener('click', function () { lb.close(); });
      lb.querySelector('[data-lb="prev"]').addEventListener('click', function () { openAt(current - 1); });
      lb.querySelector('[data-lb="next"]').addEventListener('click', function () { openAt(current + 1); });
      if (shots.length < 2) $all('[data-lb="prev"], [data-lb="next"]', lb).forEach(function (b) { b.hidden = true; });
    }
  }

  /* ---------- 4. Tabs, driven by the address (#about, #research, ...) ---------- */
  var nav = document.querySelector('.tabs');
  var panels = $all('[data-panel]');
  var tabLinks = $all('.tabs a[data-tab]');
  var baseTitle = document.title;
  var header = document.querySelector('.topbar');
  function stickyOffset() { return header.getBoundingClientRect().height + 16; }
  function setStickyVar() { root.style.setProperty('--sticky', stickyOffset() + 'px'); }
  setStickyVar();
  window.addEventListener('resize', setStickyVar);
  function docTop(el) { var y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; }

  function resolve(hash) {
    var id = '';
    try { id = decodeURIComponent((hash || '').replace(/^#/, '')); } catch (e) {}
    if (!id || id === 'top') return { panel: panels[0] };
    var el = document.getElementById(id);
    if (!el) return null;
    if (el.hasAttribute('data-panel')) return { panel: el };
    var p = el.closest('[data-panel]');
    return p ? { panel: p, target: el } : null;
  }
  function markOverflow() { nav.classList.toggle('more', nav.scrollLeft + nav.clientWidth < nav.scrollWidth - 4); }
  nav.addEventListener('scroll', markOverflow, { passive: true });
  window.addEventListener('resize', markOverflow);
  function centerTab(a) {
    if (nav.scrollWidth <= nav.clientWidth) return;
    var left = a.offsetLeft - (nav.clientWidth - a.offsetWidth) / 2;
    nav.scrollTo({ left: Math.max(0, left), behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  function show(hash, opts) {
    opts = opts || {};
    var r = resolve(hash) || { panel: panels[0] };
    panels.forEach(function (p) { p.classList.toggle('active', p === r.panel); });
    tabLinks.forEach(function (a) {
      var on = a.getAttribute('data-tab') === r.panel.id;
      a.classList.toggle('active', on);
      if (on) { a.setAttribute('aria-current', 'page'); centerTab(a); }
      else a.removeAttribute('aria-current');
    });
    var label = r.panel.getAttribute('data-title');
    document.title = (r.panel !== panels[0] && label) ? label + ' · Amirhossain Arshadi' : baseTitle;
    redraw();
    var behavior = (opts.instant || reduceMotion) ? 'auto' : 'smooth';
    if (r.target) {
      var t = r.target;
      requestAnimationFrame(function () {
        window.scrollTo({ top: Math.max(0, docTop(t) - stickyOffset()), behavior: behavior });
        t.classList.remove('flash');
        void t.offsetWidth;
        t.classList.add('flash');
      });
    } else if (!opts.keepScroll) {
      window.scrollTo({ top: 0, behavior: behavior });
    }
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var hash = a.getAttribute('href');
    if (hash.length > 1 && !resolve(hash)) return;   /* e.g. "Skip to content" */
    e.preventDefault();
    if (hash === '#') hash = '#' + panels[0].id;
    if (location.hash !== hash) { try { history.pushState(null, '', hash); } catch (err) {} }
    show(hash);
  });
  window.addEventListener('popstate', function () { show(location.hash, { keepScroll: true }); });
  show(location.hash, { instant: true, keepScroll: true });
  markOverflow();
  window.addEventListener('load', function () {
    var r = resolve(location.hash);
    if (location.hash && r && !r.target) window.scrollTo(0, 0);
  });

  /* ---------- 5. Show the CV buttons only if CV.pdf exists ---------- */
  function cvMissing() {
    $all('[data-cv]').forEach(function (el) { el.remove(); });
    $all('[data-cv-missing]').forEach(function (el) { el.hidden = false; });
  }
  if (/^https?:$/.test(location.protocol) && window.fetch) {
    fetch('CV.pdf', { method: 'HEAD', cache: 'no-store' })
      .then(function (r) { if (!r.ok) cvMissing(); })
      .catch(cvMissing);
  }

  /* ---------- 6. Research timeline, drawn from the table #tl-data ---------- */
  function drawTimeline() {
    var table = document.getElementById('tl-data');
    var host = document.getElementById('tl-chart');
    var tip = document.getElementById('tl-tip');
    if (!table || !host) return;
    var asOf = ym(table.getAttribute('data-asof'));
    var nowPos = asOf + 0.5;
    var rows = $all('tbody tr', table).map(function (tr) {
      var endRaw = tr.getAttribute('data-end');
      return {
        name: tr.cells[0].textContent.trim(),
        cat: tr.getAttribute('data-cat') || 'oth',
        kind: tr.getAttribute('data-kind') || 'project',
        start: ym(tr.getAttribute('data-start')),
        end: endRaw === 'now' ? null : ym(endRaw || tr.getAttribute('data-start')),
        detail: tr.getAttribute('data-detail') || ''
      };
    });
    var projects = rows.filter(function (r) { return r.kind === 'project'; });
    var events = rows.filter(function (r) { return r.kind === 'event'; });

    var hostW = host.parentNode.clientWidth || 700;
    var stacked = hostW < 560;
    var W, labelRight, x0, x1, top, rowH;
    if (stacked) { W = Math.max(260, Math.round(hostW)); x0 = 6; x1 = W - 8; top = 4; rowH = 34; }
    else { W = 760; labelRight = 212; x0 = 222; x1 = 744; top = 12; rowH = 22; }
    host.setAttribute('data-mode', stacked ? 'stacked' : 'wide');

    var d0 = ym(table.getAttribute('data-start'));
    var d1 = asOf + 1;
    var n = projects.length + (events.length ? 1 : 0);
    var plotBottom = top + n * rowH + 4;
    var H = plotBottom + 22;
    function x(m) { return x0 + (m - d0) / (d1 - d0) * (x1 - x0); }

    host.textContent = '';
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H });

    var nx = Math.round(x(nowPos)) + 0.5;
    var nowLabelLeft = nx - (stacked ? 58 : 50);
    var firstYear = Math.ceil(d0 / 12);
    for (var yv = firstYear; yv * 12 <= d1; yv++) {
      var gx = Math.round(x(yv * 12)) + 0.5;
      el('line', { 'class': 'tl-grid', x1: gx, x2: gx, y1: Math.max(0, top - 6), y2: plotBottom }, svg);
      if (gx + 16 > nowLabelLeft) continue;
      var t = el('text', { 'class': 'tl-axis', x: gx, y: plotBottom + 15, 'text-anchor': 'middle' }, svg);
      t.textContent = stacked ? "'" + String(yv).slice(2) : String(yv);
    }
    el('line', { 'class': 'tl-now', x1: nx, x2: nx, y1: Math.max(0, top - 10), y2: plotBottom }, svg);
    var nt = el('text', { 'class': 'tl-axis', x: nx, y: plotBottom + 15, 'text-anchor': 'end' }, svg);
    nt.textContent = fmt(asOf);

    function tipFor(g, r, anchorX, anchorY) {
      function showTip() {
        var endTxt = r.end === null ? 'present' : fmt(r.end);
        var months = (r.end === null ? asOf : r.end) - r.start + 1;
        var value = r.kind === 'event'
          ? (r.end !== null && r.end !== r.start ? fmt(r.start) + ' – ' + fmt(r.end) : fmt(r.start))
          : fmt(r.start) + ' – ' + endTxt + ' · ' + months + (months === 1 ? ' month' : ' months');
        tip.textContent = '';
        var v = document.createElement('span'); v.className = 'v'; v.textContent = value; tip.appendChild(v);
        var nm = document.createElement('span'); nm.className = 'n'; nm.textContent = r.name;
        nm.style.setProperty('--key', 'var(--cat-' + r.cat + ')'); tip.appendChild(nm);
        if (r.detail) { var d = document.createElement('span'); d.className = 'd'; d.textContent = r.detail; tip.appendChild(d); }
        var wrap = host.parentNode;
        var scale = host.getBoundingClientRect().width / W;
        var left = anchorX * scale + 12, topPx = anchorY * scale - 10;
        var maxLeft = wrap.clientWidth - tip.offsetWidth - 4;
        if (left > maxLeft) left = Math.max(4, anchorX * scale - tip.offsetWidth - 12);
        tip.style.left = left + 'px';
        tip.style.top = Math.max(0, topPx) + 'px';
        tip.classList.add('show');
      }
      function hideTip() { tip.classList.remove('show'); }
      g.addEventListener('pointerenter', showTip);
      g.addEventListener('pointerleave', hideTip);
      g.addEventListener('focus', showTip);
      g.addEventListener('blur', hideTip);
    }

    function rowLabel(text, rowTop, cy, extraClass) {
      var attrs = stacked
        ? { 'class': 'tl-label' + (extraClass || ''), x: x0, y: rowTop + 12, 'text-anchor': 'start' }
        : { 'class': 'tl-label' + (extraClass || ''), x: labelRight, y: cy + 4, 'text-anchor': 'end' };
      el('text', attrs, svg).textContent = text;
    }

    projects.forEach(function (r, i) {
      var rowTop = top + i * rowH;
      var cy = stacked ? rowTop + 24 : rowTop + rowH / 2;
      rowLabel(r.name, rowTop, cy);
      var xs = x(r.start);
      var xe = r.end === null ? x(nowPos) : x(r.end + 1);
      var w = Math.max(4, xe - xs - 1);
      var g = el('g', { 'class': 'tl-item', tabindex: '0', role: 'img',
        'aria-label': r.name + ': ' + fmt(r.start) + ' to ' + (r.end === null ? 'present' : fmt(r.end)) }, svg);
      el('rect', { 'class': 'tl-hit', x: xs - 4, y: cy - 12, width: w + 8, height: 24 }, g);
      el('rect', { 'class': 'tl-focus', x: xs - 3, y: cy - 8, width: w + 6, height: 16, rx: 6 }, g);
      el('rect', { 'class': 'tl-bar fill-' + r.cat, x: xs, y: cy - 5, width: w, height: 10, rx: Math.min(4, w / 2) }, g);
      tipFor(g, r, xs + w, cy);
    });

    if (events.length) {
      var rowTop = top + projects.length * rowH;
      var cy = stacked ? rowTop + 24 : rowTop + rowH / 2;
      rowLabel('Papers & posters', rowTop, cy, ' group');
      events.forEach(function (r) {
        var mid = r.end === null ? r.start + 0.5 : (r.start + r.end + 1) / 2;
        var cx = x(mid);
        var g = el('g', { 'class': 'tl-item', tabindex: '0', role: 'img', 'aria-label': r.name + ', ' + fmt(r.start) }, svg);
        el('circle', { 'class': 'tl-hit', cx: cx, cy: cy, r: 12 }, g);
        el('circle', { 'class': 'tl-focus', cx: cx, cy: cy, r: 9 }, g);
        el('circle', { 'class': 'tl-bar tl-marker fill-' + r.cat, cx: cx, cy: cy, r: 6 }, g);
        tipFor(g, r, cx, cy);
      });
    }
    host.appendChild(svg);
    host.removeAttribute('aria-hidden');
    host.setAttribute('role', 'group');
    host.setAttribute('aria-label', 'Research timeline, 2022 to ' + fmt(asOf) + '. The same data is in the table below.');
  }

  var tlDetails = document.querySelector('.tl-details');
  if (tlDetails) tlDetails.open = false;
  var lastKey = '';
  function redraw() {
    var host = document.getElementById('tl-chart');
    if (!host) return;
    var w = host.parentNode.clientWidth;
    if (!w) return;                                  /* the Research tab is hidden right now */
    var key = w < 560 ? 'stacked-' + Math.round(w) : 'wide';
    if (key === lastKey) return;
    lastKey = key;
    drawTimeline();
  }
  if ('ResizeObserver' in window) {
    var pending = false;
    new ResizeObserver(function () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () { pending = false; redraw(); });
    }).observe(document.querySelector('.tl-wrap'));
  } else {
    window.addEventListener('resize', redraw);
  }
  window.addEventListener('beforeprint', function () { lastKey = ''; drawTimeline(); });
  redraw();

  /* ---------- 7. Animated network behind the introduction ---------- */
  var canvas = document.querySelector('.hero-net');
  if (canvas && canvas.getContext) heroNetwork(canvas);

  function heroNetwork(cv) {
    var ctx = cv.getContext('2d');
    var W = 0, H = 0, nodes = [], linkDist = 120;
    var running = false, inView = true, raf = 0;
    var colA = '#7dd3fc', colB = '#a78bfa';
    function readColors() {
      var cs = getComputedStyle(root);
      colA = cs.getPropertyValue('--accent').trim() || colA;
      colB = cs.getPropertyValue('--accent-2').trim() || colB;
    }
    function rand(a, b) { return a + Math.random() * (b - a); }
    function resize() {
      var rect = cv.getBoundingClientRect();
      if (!rect.width || !rect.height) return false;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = rect.width; H = rect.height;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var target = Math.round(Math.max(14, Math.min(46, (W * H) / 11000)));
      while (nodes.length < target) {
        nodes.push({ x: rand(0, W), y: rand(0, H), vx: rand(-0.22, 0.22), vy: rand(-0.22, 0.22), hub: Math.random() < 0.14, deg: 0 });
      }
      nodes.length = target;
      nodes.forEach(function (n) { n.x = Math.min(n.x, W); n.y = Math.min(n.y, H); });
      linkDist = Math.max(90, Math.min(140, W / 7));
      return true;
    }
    function draw(move) {
      var i, j, a, b, dx, dy, d2, L2 = linkDist * linkDist;
      ctx.clearRect(0, 0, W, H);
      for (i = 0; i < nodes.length; i++) nodes[i].deg = 0;
      ctx.lineWidth = 1;
      ctx.strokeStyle = colA;
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        for (j = i + 1; j < nodes.length; j++) {
          b = nodes[j];
          dx = a.x - b.x; dy = a.y - b.y; d2 = dx * dx + dy * dy;
          if (d2 < L2) {
            a.deg++; b.deg++;
            ctx.globalAlpha = (1 - d2 / L2) * 0.5;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        ctx.globalAlpha = a.hub ? 0.95 : 0.8;
        ctx.fillStyle = a.hub ? colB : colA;
        ctx.beginPath();
        ctx.arc(a.x, a.y, (a.hub ? 2.2 : 1.4) + Math.min(a.deg, 6) * 0.35, 0, Math.PI * 2);
        ctx.fill();
        if (move) {
          a.x += a.vx; a.y += a.vy;
          if (a.x < 0 || a.x > W) { a.vx = -a.vx; a.x = Math.max(0, Math.min(W, a.x)); }
          if (a.y < 0 || a.y > H) { a.vy = -a.vy; a.y = Math.max(0, Math.min(H, a.y)); }
        }
      }
      ctx.globalAlpha = 1;
    }
    function loop() { draw(true); raf = requestAnimationFrame(loop); }
    function update() {
      var go = inView && !document.hidden && !reduceMotion;
      if (go && !running) { running = true; raf = requestAnimationFrame(loop); }
      else if (!go && running) { running = false; cancelAnimationFrame(raf); }
    }
    readColors();
    if (resize()) draw(false);
    if ('ResizeObserver' in window) {
      new ResizeObserver(function () { if (resize()) draw(false); }).observe(cv);
    } else {
      window.addEventListener('resize', function () { if (resize()) draw(false); });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[entries.length - 1].isIntersecting;
        update();
      }).observe(cv);
    }
    document.addEventListener('visibilitychange', update);
    document.addEventListener('themechange', function () { readColors(); if (!running && W) draw(false); });
    update();
  }

  /* ---------- 8. Footer year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
