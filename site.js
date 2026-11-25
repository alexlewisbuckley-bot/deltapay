// Delta Bridge marketing site: small interactions only. No data leaves the page.
(function () {
  // mobile menu: animated open and close, closes on link tap or Escape
  var nav = document.querySelector('.nav');
  var mb = document.querySelector('.menu-btn');
  var setMenu = function (open) {
    nav.classList.toggle('open', open);
    mb.setAttribute('aria-expanded', open ? 'true' : 'false');
    mb.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  if (nav && mb) {
    mb.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
    nav.querySelectorAll('.nav-links a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    // logo collapses to the monogram once the page is scrolled
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 80); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }

  // gentle reveal for things below the fold
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.remove('pre'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('section .head, .pain>div, .cmp, .svc, .reverse, .steps>div, .calc, .show, .feats>*, .ind, .said blockquote, .booking, .flow>div, .faq details, .cards>*, .frow .vis, .frow .copy, .timeline>div, .rules>div, .facts>div, .cta-phones .phone').forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight) return;
      var i = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.classList.add('rvl', 'pre'); el.style.transitionDelay = Math.min(i, 5) * 70 + 'ms';
      io.observe(el);
    });
  }

  // payment calculators (hero quick quote and the larger one further down)
  // PLACEHOLDER RATES: value of one unit in US dollars. AED is the official peg (3.6725).
  // EUR and GBP are rough sample figures. Replace this table with the live pricing feed.
  var USD_VALUE = { USDT: 1, USDC: 1, USD: 1, AED: 1 / 3.6725, EUR: 1 / 0.86, GBP: 1 / 0.75 };
  var fmt = function (n) { return n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var parse = function (v) { var n = parseFloat(String(v).replace(/[^0-9.]/g, '')); return isNaN(n) ? 0 : n; };
  document.querySelectorAll('[data-pair]').forEach(function (el) { var p = el.getAttribute('data-pair').split('/'); el.textContent = (USD_VALUE[p[0]] / USD_VALUE[p[1]]).toFixed(4); });
  document.querySelectorAll('[data-calc]').forEach(function (calc) {
    var amt = calc.querySelector('[data-amount]');
    var range = calc.querySelector('input[type=range]');
    var recv = calc.querySelector('[data-recv]');
    var rate = calc.querySelector('[data-rate]');
    var sendSel = calc.querySelector('select[data-send]');
    var recvSel = calc.querySelector('select[data-recv-unit]');
    var pressed = function (attr) { var b = calc.querySelector('[' + attr + '][aria-pressed=true]'); return b ? b.getAttribute(attr) : null; };
    var units = function () { return { s: sendSel ? sendSel.value : pressed('data-asset'), r: recvSel ? recvSel.value : pressed('data-cur') }; };
    var draw = function () {
      var u = units(), n = parse(amt.value), r = USD_VALUE[u.s] / USD_VALUE[u.r];
      recv.textContent = fmt(n * r);
      rate.textContent = '\u0394 1 ' + u.s + ' = ' + r.toFixed(4) + ' ' + u.r;
      if (range) {
        range.value = Math.min(Math.max(n, +range.min), +range.max);
        range.style.setProperty('--p', ((range.value - range.min) / (range.max - range.min) * 100) + '%');
      }
    };
    amt.addEventListener('input', draw);
    amt.addEventListener('focus', function () { amt.select(); });
    amt.addEventListener('blur', function () { amt.value = fmt(parse(amt.value)); });
    amt.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); amt.blur(); } });
    if (range) range.addEventListener('input', function () { amt.value = fmt(+range.value); draw(); });
    [sendSel, recvSel].forEach(function (s) { if (s) s.addEventListener('change', draw); });
    ['data-asset', 'data-cur'].forEach(function (attr) {
      var items = calc.querySelectorAll('[' + attr + ']');
      items.forEach(function (b) { b.addEventListener('click', function () { items.forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); draw(); }); });
    });
    var swap = calc.querySelector('[data-swap]');
    if (swap && sendSel && recvSel) swap.addEventListener('click', function () {
      var a = sendSel.innerHTML, av = sendSel.value, bv = recvSel.value, out = parse(recv.textContent);
      sendSel.innerHTML = recvSel.innerHTML; recvSel.innerHTML = a;
      sendSel.value = bv; recvSel.value = av;
      amt.value = fmt(out);
      draw();
    });
    calc.querySelectorAll('[role=tab]').forEach(function (t) {
      t.addEventListener('click', function () {
        calc.querySelectorAll('[role=tab]').forEach(function (x) { x.setAttribute('aria-selected', x === t); });
        calc.querySelector('[data-recv-label]').textContent = t.dataset.label;
      });
    });
    draw();
  });

  // booking picker
  document.querySelectorAll('[data-booking]').forEach(function (bk) {
    var sel = { name: '', role: '', day: '', time: '' };
    var out = bk.querySelector('[data-summary]');
    var side = document.querySelector('[data-selected-person]');
    var group = function (attr, key, after) {
      var items = bk.querySelectorAll('[' + attr + ']');
      items.forEach(function (b) {
        if (b.getAttribute('aria-pressed') === 'true') { sel[key] = b.getAttribute(attr); if (after) after(b, true); }
        b.addEventListener('click', function () {
          items.forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
          sel[key] = b.getAttribute(attr);
          if (after) after(b);
          draw();
        });
      });
    };
    // next five working days (Mon to Fri), starting tomorrow
    var daysEl = bk.querySelector('[data-days]');
    if (daysEl) {
      var d = new Date(), n = 0, first = null;
      while (n < 5) {
        d.setDate(d.getDate() + 1);
        if (d.getDay() === 0 || d.getDay() === 6) continue;
        if (!first) first = new Date(d);
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'day';
        var wd = d.toLocaleDateString('en-GB', { weekday: 'short' });
        b.setAttribute('data-day', wd + ' ' + d.getDate() + ' ' + d.toLocaleDateString('en-GB', { month: 'short' }));
        b.setAttribute('aria-pressed', n === 0 ? 'true' : 'false');
        b.innerHTML = '<small>' + wd + '</small><b>' + d.getDate() + '</b>';
        daysEl.appendChild(b); n++;
      }
      var m = bk.querySelector('[data-month]');
      if (m) m.textContent = first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    }
    var draw = function () { out.textContent = sel.day + ', ' + sel.time + ' · 20 min video call with ' + sel.role; };
    group('data-role', 'role', function (b) {
      if (!side) return;
      side.querySelector('img').src = b.querySelector('img').src;
      side.querySelector('[data-role-out]').textContent = b.dataset.title;
    });
    group('data-day', 'day');
    group('data-time', 'time');
    draw();
  });

  // forms are not connected yet: show a plain notice instead of sending anything
  document.querySelectorAll('form[data-demo]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = f.querySelector('.note');
      if (n) n.classList.add('show');
    });
  });
})();
