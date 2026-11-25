// Team view of registrations. The key is kept for this browser tab only and sent as a header, never in the address.
(function () {
  var el = document.getElementById('adm'), out = document.getElementById('out'), key = sessionStorage.getItem('db_admin') || '';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var api = function (body, raw) {
    return fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key }, body: JSON.stringify(body) })
      .then(function (r) { if (raw && r.ok) return r.blob(); return r.json().then(function (j) { j._status = r.status; return j; }); });
  };
  var when = function (s) { return s ? new Date(s).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''; };
  var STEPS = ['You', 'Company', 'Address', 'What you need', 'Payments', 'Ownership', 'Documents', 'Review'];
  function gate(msg) {
    out.hidden = true;
    el.innerHTML = '<form class="gate"><h2>Team sign-in</h2><p class="lead" style="font-size:16px">Enter the admin key set in Vercel.</p><label class="f"><span>Admin key</span><input type="password" autocomplete="current-password" required></label>' + (msg ? '<div class="banner">' + msg + '</div>' : '') + '<button class="btn accent" type="submit">Open</button></form>';
    el.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); key = el.querySelector('input').value; sessionStorage.setItem('db_admin', key); list(); });
  }
  function fail(j) {
    if (j._status === 401) return gate('That key wasn’t accepted.');
    if (j.error === 'admin_not_configured') return gate('ADMIN_KEY isn’t set in Vercel yet.');
    if (j.error === 'storage_not_configured') return gate('Storage isn’t connected in Vercel yet.');
    el.innerHTML = '<div class="banner">Something went wrong. Try again.</div>';
  }
  function list() {
    el.innerHTML = '<p class="lead">Loading</p>';
    api({ action: 'list' }).then(function (j) {
      if (!j.ok) return fail(j);
      out.hidden = false;
      var sub = j.items.filter(function (x) { return x.status === 'submitted'; }).length;
      el.innerHTML = '<div class="bar"><h2>' + j.items.length + ' registrations</h2><span class="muted">' + sub + ' sent · ' + (j.items.length - sub) + ' part-way</span></div>' +
        (j.items.length ? '<table><thead><tr><th>Reference</th><th>Company</th><th>Contact</th><th>Status</th><th>Documents</th><th>Call</th><th>Updated</th></tr></thead><tbody>' +
        j.items.map(function (x) { return '<tr data-id="' + x.id + '"><td class="mono">' + esc(x.reference) + '</td><td>' + esc(x.company || '—') + '</td><td>' + esc(x.name) + '<br><span class="muted">' + esc(x.email) + '<br>' + esc(x.phone) + '</span></td><td>' +
          (x.status === 'submitted' ? '<span class="st ok">Sent</span>' : '<span class="st wait">Stopped at ' + esc(STEPS[x.step] || '') + '</span>') + '</td><td>' + x.files + ' of 3</td><td>' + (x.call ? 'Asked' : '') + '</td><td>' + when(x.updatedAt) + '</td></tr>'; }).join('') + '</tbody></table>' : '<p class="lead">Nothing yet.</p>');
    }).catch(function () { el.innerHTML = '<div class="banner">Couldn’t reach the server.</div>'; });
  }
  function detail(id) {
    api({ action: 'get', id: id }).then(function (j) {
      if (!j.ok) return fail(j);
      var r = j.record, d = r.data || {}, dl = function (o) { return '<dl>' + Object.keys(o).map(function (k) { return '<dt>' + k + '</dt><dd>' + esc(Array.isArray(o[k]) ? o[k].join(', ') : o[k]) + '</dd>'; }).join('') + '</dl>'; };
      el.innerHTML = '<div class="bar"><button class="btn sm line" data-back>Back to list</button><span class="mono">' + esc(r.reference) + ' · ' + (r.status === 'submitted' ? 'sent ' + when(r.submittedAt) : 'part-way, last change ' + when(r.updatedAt)) + '</span></div><h2>' + esc(d.company || d.name || 'Registration') + '</h2><div class="det">' +
        '<div><h4>Contact</h4>' + dl({ Name: d.name, Email: d.email, Mobile: (d.dial || '') + ' ' + (d.phone || ''), 'Reach by': d.reach, 'Call request': r.callRequest ? r.callRequest.day + ', around ' + r.callRequest.time : 'None' }) + '</div>' +
        '<div><h4>Company</h4>' + dl({ Name: d.company, 'Registered in': d.regCountry, 'Registration number': d.licence, 'Legal form': d.legal, Sector: d.sector, Website: d.website, Address: [d.addr1, d.area, d.city, d.pobox, d.addrCountry].filter(Boolean).join(', ') }) + '</div>' +
        '<div><h4>What they need</h4>' + dl({ Services: d.services || [], Stablecoins: d.coins || [], Networks: d.networks || [], Countries: d.payCountries || [], Currencies: d.currencies || [], 'Paid to': d.payee, Typical: d.typical ? 'USD ' + d.typical : '', Monthly: d.monthly, 'How often': d.freq }) + '</div>' +
        '<div><h4>Ownership and checks</h4>' + dl({ 'Source of funds': d.source, Detail: d.sourceNote, Owners: (d.owners || []).filter(function (o) { return o.name; }).map(function (o) { return o.name + ' (' + o.role + (o.pct ? ', ' + o.pct + '%' : '') + ')'; }), 'Public role': d.pep, Declared: d.declare ? 'Yes' : 'No' }) +
        '<h4 style="margin-top:18px">Documents</h4>' + ((r.files || []).length ? (r.files || []).map(function (f) { return '<p><button class="linkb" data-file="' + f.kind + '" data-name="' + esc(f.name) + '">' + esc(f.kind) + ': ' + esc(f.name) + '</button></p>'; }).join('') : '<p class="muted">None uploaded.</p>') + '</div></div>';
      el.setAttribute('data-open', id);
    });
  }
  el.addEventListener('click', function (e) {
    var tr = e.target.closest('tr[data-id]'); if (tr) return detail(tr.getAttribute('data-id'));
    if (e.target.closest('[data-back]')) return list();
    var f = e.target.closest('[data-file]');
    if (f) api({ action: 'file', id: el.getAttribute('data-open'), kind: f.getAttribute('data-file') }, true).then(function (b) {
      if (!(b instanceof Blob)) return; var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = f.getAttribute('data-file') + '-' + f.getAttribute('data-name'); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
    });
  });
  out.addEventListener('click', function () { key = ''; sessionStorage.removeItem('db_admin'); gate(); });
  if (key) list(); else gate();
})();
