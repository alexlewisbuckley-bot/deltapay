// Delta Pay marketing site: small interactions only. No data leaves the page.
(function () {
  // mobile menu
  var nav = document.querySelector('.nav');
  var mb = document.querySelector('.menu-btn');
  if (nav && mb) mb.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    mb.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // payment calculator
  var calc = document.querySelector('[data-calc]');
  if (calc) {
    // AED is pegged to the US dollar at 3.6725. Other pairs are quoted live by the team.
    var RATES = { AED: 3.6725, USD: 1 };
    var state = { amount: 250000, asset: 'USDT', cur: 'AED' };
    var range = calc.querySelector('input[type=range]');
    var send = calc.querySelector('[data-send]');
    var recv = calc.querySelector('[data-recv]');
    var rate = calc.querySelector('[data-rate]');
    var fmt = function (n) { return n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var draw = function () {
      send.textContent = fmt(state.amount);
      var r = RATES[state.cur];
      if (r) {
        recv.textContent = fmt(state.amount * r);
        rate.textContent = 'Δ 1 ' + state.asset + ' = ' + r.toFixed(4) + ' ' + state.cur;
      } else {
        recv.textContent = 'Quoted live';
        rate.textContent = 'Δ ' + state.asset + ' → ' + state.cur + ' on request';
      }
      range.style.setProperty('--p', ((state.amount - range.min) / (range.max - range.min) * 100) + '%');
    };
    range.addEventListener('input', function () { state.amount = +range.value; draw(); });
    calc.querySelectorAll('[data-asset]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.asset = b.dataset.asset;
        calc.querySelectorAll('[data-asset]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        draw();
      });
    });
    calc.querySelectorAll('[data-cur]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.cur = b.dataset.cur;
        calc.querySelectorAll('[data-cur]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        draw();
      });
    });
    calc.querySelectorAll('[role=tab]').forEach(function (t) {
      t.addEventListener('click', function () {
        calc.querySelectorAll('[role=tab]').forEach(function (x) { x.setAttribute('aria-selected', x === t); });
        calc.querySelector('[data-recv-label]').textContent = t.dataset.label;
      });
    });
    draw();
  }

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
