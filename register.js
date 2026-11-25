// Delta Bridge registration flow. Saves to this browser as you type and to the server once an email is given.
(function () {
  var KEY = 'db_reg_v1';
  var app = document.getElementById('app');
  if (!app) return;

  // ---------- data ----------
  // code, name, dial, national length range, grouping
  var CC = [['AE','United Arab Emirates','+971',[9,9],[2,3,4]],['GB','United Kingdom','+44',[10,10],[4,6]],['SA','Saudi Arabia','+966',[9,9],[2,3,4]],['US','United States','+1',[10,10],[3,3,4]],
    ['QA','Qatar','+974',[8,8],[4,4]],['KW','Kuwait','+965',[8,8],[4,4]],['BH','Bahrain','+973',[8,8],[4,4]],['OM','Oman','+968',[8,8],[4,4]],
    ['DE','Germany','+49',[10,11],[3,4,4]],['FR','France','+33',[9,9],[1,2,2,2,2]],['ES','Spain','+34',[9,9],[3,3,3]],['IT','Italy','+39',[9,10],[3,3,4]],['NL','Netherlands','+31',[9,9],[2,3,4]],
    ['CH','Switzerland','+41',[9,9],[2,3,4]],['TR','Türkiye','+90',[10,10],[3,3,4]],['IN','India','+91',[10,10],[5,5]],['PK','Pakistan','+92',[10,10],[3,7]],['CN','China','+86',[11,11],[3,4,4]],
    ['HK','Hong Kong','+852',[8,8],[4,4]],['SG','Singapore','+65',[8,8],[4,4]],['EG','Egypt','+20',[10,10],[3,3,4]],['NG','Nigeria','+234',[10,10],[3,3,4]],['ZA','South Africa','+27',[9,9],[2,3,4]],
    ['KE','Kenya','+254',[9,9],[3,3,3]],['CA','Canada','+1',[10,10],[3,3,4]],['AU','Australia','+61',[9,9],[3,3,3]],['JP','Japan','+81',[10,10],[2,4,4]],['BR','Brazil','+55',[10,11],[2,5,4]],
    ['IE','Ireland','+353',[9,9],[2,3,4]],['PT','Portugal','+351',[9,9],[3,3,3]],['BE','Belgium','+32',[9,9],[3,2,2,2]],['SE','Sweden','+46',[9,9],[2,3,4]],['PL','Poland','+48',[9,9],[3,3,3]],
    ['GR','Greece','+30',[10,10],[3,3,4]],['CY','Cyprus','+357',[8,8],[4,4]],['MT','Malta','+356',[8,8],[4,4]],['JO','Jordan','+962',[9,9],[2,3,4]],['LB','Lebanon','+961',[7,8],[2,3,3]],
    ['MA','Morocco','+212',[9,9],[3,3,3]],['GH','Ghana','+233',[9,9],[2,3,4]],['MY','Malaysia','+60',[9,10],[2,4,4]],['TH','Thailand','+66',[9,9],[2,3,4]],['ID','Indonesia','+62',[9,11],[3,4,4]],
    ['PH','Philippines','+63',[10,10],[3,3,4]],['VN','Vietnam','+84',[9,9],[2,3,4]],['KR','South Korea','+82',[9,10],[2,4,4]],['MX','Mexico','+52',[10,10],[2,4,4]],['AR','Argentina','+54',[10,10],[2,4,4]]];
  var byCode = {}; CC.forEach(function (c) { byCode[c[0]] = c; });
  var NAMES = CC.map(function (c) { return c[1]; }).sort();
  var GROUPS = [[0], [1, 2], [3], [4], [5, 6], [7]];
  var RAIL = [['You', 'Name and contact'], ['Company', 'Details and address'], ['What you need', 'Services and assets'], ['Payments', 'Where and how much'], ['Ownership and checks', 'Funds, owners, documents'], ['Review', 'Check and send']];
  var TOP = ['Step 1 of 6', 'Step 2 of 6 · part 1 of 2', 'Step 2 of 6 · part 2 of 2', 'Step 3 of 6', 'Step 4 of 6', 'Step 5 of 6 · part 1 of 2', 'Step 5 of 6 · part 2 of 2', 'Step 6 of 6 · last one'];
  var DOCS = [['licence', 'Trade licence'], ['id', 'Passport or Emirates ID of one director'], ['address', 'Proof of address']];
  var blank = function () {
    return { name: '', email: '', cc: 'AE', phone: '', reach: 'WhatsApp', regCountry: 'United Arab Emirates', company: '', licence: '', website: '', legal: '', sector: '',
      addr1: '', area: '', city: '', addrCountry: 'United Arab Emirates', pobox: '', services: [], coins: [], networks: [], payCountries: [], currencies: [], payee: '', typical: '', monthly: '', freq: '',
      source: '', sourceNote: '', owners: [{ name: '', role: 'Director', pct: '' }], pep: '', declare: false };
  };
  var d = blank(), meta = { id: null, ref: null, step: 0, status: 'draft', files: {} };
  var tried = false, returnTo = null, view = 'form', sendError = '', call = { day: '', time: '', sent: false, err: '' };

  // ---------- helpers ----------
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var ICO = { check: 'M5 12.5 10 17.5 19 7', doc: 'M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5', upload: 'M12 16V5M7 10l5-5 5 5M5 19h14', lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3' };
  var ic = function (n) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="' + ICO[n] + '"/></svg>'; };
  var digits = function (s) { return String(s || '').replace(/\D/g, ''); };
  var emailOk = function (s) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(s || '').trim()); };
  function fmtPhone(v, cc) {
    var g = (byCode[cc] || CC[0])[4], n = digits(v).replace(/^0+/, '').slice(0, 13), out = [], i = 0;
    g.forEach(function (len) { if (i < n.length) { out.push(n.slice(i, i + len)); i += len; } });
    if (i < n.length) out.push(n.slice(i));
    return out.join(' ');
  }
  var phoneLooksRight = function () { var r = (byCode[d.cc] || CC[0])[3], n = digits(d.phone).length; return n >= r[0] && n <= r[1]; };
  var fmtMoney = function (v) { var n = digits(v).slice(0, 12); return n ? Number(n).toLocaleString('en-GB') : ''; };
  var ownerTotal = function () { return d.owners.reduce(function (a, o) { return a + (parseFloat(o.pct) || 0); }, 0); };
  var size = function (b) { return b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; };

  // ---------- saving ----------
  var saveEl = document.querySelector('.rsave'), saveTxt = document.getElementById('saved'), timer = null, inflight = null;
  function setSaved(state) {
    if (!saveEl) return;
    saveEl.className = 'rsave' + (state === 'busy' ? ' busy' : state === 'local' ? ' local' : '');
    saveTxt.textContent = state === 'busy' ? 'Saving' : state === 'local' ? 'Saved on this device' : state === 'idle' ? 'Saves as you go' : 'Saved a moment ago';
  }
  function local() { d.dial = (byCode[d.cc] || CC[0])[2]; try { localStorage.setItem(KEY, JSON.stringify({ d: d, meta: meta })); } catch (e) {} }
  function post(url, body) {
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { j._ok = r.ok; j._status = r.status; return j; }); })
      .catch(function () { return { _ok: false, _status: 0 }; });
  }
  function push(extra) {
    var run = function () {
      return post('/api/save', Object.assign({ id: meta.id || undefined, data: d, step: meta.step }, extra || {})).then(function (j) {
        if (j._ok) { meta.id = j.id; meta.ref = j.reference; meta.status = j.status; local(); setSaved('ok'); }
        else setSaved('local');
        return j;
      });
    };
    inflight = (inflight || Promise.resolve()).then(run, run);
    return inflight;
  }
  function persist() {
    if (meta.status === 'submitted') return;
    local();
    if (!emailOk(d.email)) { setSaved(d.name ? 'local' : 'idle'); return; }
    setSaved('busy');
    clearTimeout(timer);
    timer = setTimeout(function () { push(); }, 900);
  }

  // ---------- small render pieces ----------
  var bad = function (k) { return tried && errs()[k] ? ' bad' : ''; };
  function field(k, label, o) {
    o = o || {};
    return '<label class="f' + bad(k) + '"><span>' + label + '</span><input data-k="' + k + '" type="' + (o.type || 'text') + '" value="' + esc(d[k]) + '"' +
      (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + (o.auto ? ' autocomplete="' + o.auto + '"' : '') + (o.mode ? ' inputmode="' + o.mode + '"' : '') + '><em>' + (o.err || 'Please fill this in.') + '</em></label>';
  }
  function select(k, label, opts) {
    return '<label class="f' + bad(k) + '"><span>' + label + '</span><select data-k="' + k + '">' + opts.map(function (v) { return '<option' + (d[k] === v ? ' selected' : '') + '>' + esc(v) + '</option>'; }).join('') + '</select><em>Please choose one.</em></label>';
  }
  function chips(k, opts, o) {
    o = o || {};
    var multi = Array.isArray(d[k]);
    return '<div class="' + (o.seg ? 'segc' : 'chips') + '">' + opts.map(function (v) {
      var on = multi ? d[k].indexOf(v) > -1 : d[k] === v;
      return '<button type="button" class="chip" data-chip="' + k + '" data-v="' + esc(v) + '" aria-pressed="' + on + '">' + esc(v) + '</button>';
    }).join('') + '</div>';
  }
  var group = function (k, label, inner, err) { return '<div class="' + bad(k).trim() + '"><span class="lbl">' + label + '</span>' + inner + '<div class="errline">' + (err || 'Please choose one.') + '</div></div>'; };
  var side = function (title, html) { return '<aside class="side"><h4>' + title + '</h4>' + html + '</aside>'; };
  var ticks = function (a) { return '<ul>' + a.map(function (t) { return '<li>' + ic('check') + '<span>' + t + '</span></li>'; }).join('') + '</ul>'; };

  // ---------- validation ----------
  function errs(step) {
    var s = step == null ? meta.step : step, e = {};
    if (s === 0) { if (d.name.trim().length < 2) e.name = 1; if (!emailOk(d.email)) e.email = 1; if (digits(d.phone).length < 7) e.phone = 1; }
    if (s === 1) { ['company', 'licence', 'legal'].forEach(function (k) { if (!String(d[k]).trim()) e[k] = 1; }); }
    if (s === 2) { ['addr1', 'city'].forEach(function (k) { if (!String(d[k]).trim()) e[k] = 1; }); }
    if (s === 3) { if (!d.services.length) e.services = 1; }
    if (s === 4) { if (!d.payCountries.length) e.payCountries = 1; if (!d.currencies.length) e.currencies = 1; if (!d.monthly) e.monthly = 1; }
    if (s === 5) { if (!d.source) e.source = 1; if (!d.owners.some(function (o) { return o.name.trim(); })) e.owners = 1; if (!d.pep) e.pep = 1; }
    if (s === 7) { if (!d.declare) e.declare = 1; }
    return e;
  }

  // ---------- screens ----------
  var S = [];
  S[0] = function () {
    return head('Let’s get your business set up.', 'A few minutes. We save every answer as you go, so you can stop and come back.') +
      '<div class="row2">' + field('name', 'Full name', { auto: 'name' }) + field('email', 'Work email', { type: 'email', auto: 'email', err: 'Enter a valid email address.' }) + '</div>' +
      '<div class="' + bad('phone').trim() + '"><span class="lbl">Mobile number</span><div class="tel"><label class="f"><select data-k="cc" aria-label="Country code">' +
      CC.map(function (c) { return '<option value="' + c[0] + '"' + (d.cc === c[0] ? ' selected' : '') + '>' + c[0] + ' ' + c[2] + '</option>'; }).join('') +
      '</select></label><div class="telw f"><input data-k="phone" type="tel" inputmode="tel" autocomplete="tel-national" value="' + esc(d.phone) + '" aria-label="Mobile number"><span class="tok' + (phoneLooksRight() ? ' show' : '') + '">' + ic('check') + 'Looks right</span></div></div>' +
      '<div class="errline">Enter your mobile number.</div><p class="hint">Pick your country code. The number formats itself as you type.</p></div>' +
      group('reach', 'How should we reach you?', chips('reach', ['WhatsApp', 'Phone call', 'Email'])) +
      '<p class="check" style="cursor:default">' + ic('lock').replace('class="ic"', 'class="ic" style="color:var(--blue);margin-top:0"') + '<span>Used only for this application. By continuing you agree to the privacy notice.</span></p>' +
      '</div>' + side('Have these to hand', ticks(['Your company name and licence number', 'Roughly what you pay, and where', 'Your trade licence, a director’s ID and proof of address']));
  };
  S[1] = function () {
    return head('Tell us about your company.', 'Just the basics, as they appear on your trade licence.') +
      '<div class="row2">' + select('regCountry', 'Registered in', NAMES) + field('company', 'Company legal name', { auto: 'organization' }) + '</div>' +
      '<div class="row2">' + field('licence', 'Licence or registration number') + field('website', 'Website (optional)', { ph: 'yourcompany.com', auto: 'url' }) + '</div>' +
      group('legal', 'Legal form', chips('legal', ['Free zone company', 'Mainland LLC', 'Offshore', 'Other'])) +
      group('sector', 'What does the business do?', chips('sector', ['Metals and commodities', 'Watches and luxury goods', 'Logistics', 'Software', 'Something else'])) +
      '</div>' + side('Where to find these', '<p>The name, number and legal form are all on the first page of your trade licence.</p>');
  };
  S[2] = function () {
    return head('Where do you trade from?', 'The address your business actually works from.') +
      field('addr1', 'Building and street', { auto: 'address-line1' }) +
      '<div class="row2">' + field('area', 'Area (optional)', { auto: 'address-line2' }) + field('city', 'City', { auto: 'address-level2' }) + '</div>' +
      '<div class="row2">' + select('addrCountry', 'Country', NAMES) + field('pobox', 'P.O. Box (optional)') + '</div>' +
      '</div>' + side('Why we ask', '<p>Our banking partners need a trading address for every business. A P.O. Box on its own isn’t enough.</p>');
  };
  var SERV = [['Stablecoins to local currency', 'USDT → AED', 'Turn USDT or USDC into money in a bank account.'], ['Local currency to stablecoins', 'AED → USDT', 'Send a bank transfer, receive stablecoins at your wallet.'], ['Pay suppliers directly', 'USDT → SUPPLIER', 'We pay your supplier in their currency, with your reference.']];
  S[3] = function () {
    return head('What do you need Delta Bridge for?', 'Pick everything that applies. You can change this later.') +
      '<div class="' + bad('services').trim() + '"><div class="cards3">' + SERV.map(function (s) {
        return '<button type="button" class="cardsel" data-chip="services" data-v="' + s[0] + '" aria-pressed="' + (d.services.indexOf(s[0]) > -1) + '"><small>' + s[1] + '</small><b>' + s[0] + '</b><span>' + s[2] + '</span></button>';
      }).join('') + '</div><div class="errline">Pick at least one.</div></div>' +
      '<div class="row2">' + group('coins', 'Which stablecoins?', chips('coins', ['USDT', 'USDC'])) + group('networks', 'On which networks?', chips('networks', ['Tron', 'Ethereum', 'Solana', 'Not sure yet'])) + '</div>' +
      '<p class="hint" style="margin-top:-12px">We confirm the network with every quote, so nothing is sent to the wrong place.</p>' +
      '</div>' + side('Good to know', '<p>You only answer questions about the services you pick here.</p>');
  };
  function tagsHtml() {
    return d.payCountries.map(function (n, i) { var c = CC.filter(function (x) { return x[1] === n; })[0]; return '<span class="tag">' + (c ? '<i>' + c[0] + '</i>' : '') + esc(n) + '<button type="button" data-rmtag="' + i + '" aria-label="Remove ' + esc(n) + '">×</button></span>'; }).join('');
  }
  S[4] = function () {
    var out = d.services.length && d.services.every(function (s) { return s === 'Local currency to stablecoins'; });
    return head('Roughly what will you move?', 'Estimates are fine. Nothing here is binding.') +
      '<div class="' + bad('payCountries').trim() + '"><span class="lbl">' + (out ? 'Which countries will you send from?' : 'Which countries do you pay into?') + '</span><div class="tags" id="tags">' + tagsHtml() +
      '<input id="tagin" type="text" placeholder="' + (d.payCountries.length ? 'Add another' : 'Start typing a country') + '" autocomplete="off" aria-label="Add a country"><div class="sugg" id="sugg"></div></div><div class="errline">Add at least one country.</div></div>' +
      group('currencies', 'In which currencies?', chips('currencies', ['AED', 'EUR', 'GBP', 'USD']), 'Pick at least one.') +
      (out ? '' : group('payee', 'Who receives it?', chips('payee', ['Suppliers', 'Our own accounts', 'Both'], { seg: true }))) +
      '<div><span class="lbl">A typical payment (optional)</span><div class="money"><div class="inwrap f"><span>USD</span><input data-k="typical" inputmode="numeric" value="' + esc(d.typical) + '" aria-label="Typical payment in US dollars"></div>' +
      '<div class="chips">' + [['50k', '50,000'], ['100k', '100,000'], ['250k', '250,000'], ['500k', '500,000'], ['1m+', '1,000,000']].map(function (q) { return '<button type="button" class="chip" data-quick="' + q[1] + '" aria-pressed="' + (d.typical === q[1]) + '">' + q[0] + '</button>'; }).join('') + '</div></div></div>' +
      group('monthly', 'In a normal month, in total (USD)', chips('monthly', ['Under 100k', '100k to 500k', '500k to 2m', '2m to 10m', 'Over 10m'])) +
      group('freq', 'How often? (optional)', chips('freq', ['Most days', 'Weekly', 'Monthly', 'Now and then'], { seg: true })) +
      '</div>' + side('Why we ask', '<p>It tells us which currencies to have ready and which banking partner suits you. Your quote confirms the rate and fee.</p>');
  };
  function ownersHtml() {
    return d.owners.map(function (o, i) {
      return '<div class="owner f"><input data-o="' + i + '" data-ok="name" value="' + esc(o.name) + '" placeholder="Full name" aria-label="Owner name"><select data-o="' + i + '" data-ok="role" aria-label="Role">' +
        ['Director', 'Shareholder', 'Director and shareholder'].map(function (r) { return '<option' + (o.role === r ? ' selected' : '') + '>' + r + '</option>'; }).join('') +
        '</select><input data-o="' + i + '" data-ok="pct" value="' + esc(o.pct) + '" placeholder="%" inputmode="decimal" aria-label="Percentage owned">' +
        (d.owners.length > 1 ? '<button type="button" class="rm" data-rmowner="' + i + '" aria-label="Remove owner">×</button>' : '<span></span>') + '</div>';
    }).join('');
  }
  function totHtml() { var t = ownerTotal(); return '<span class="tot' + (t === 100 ? ' ok' : '') + '" id="tot">' + (t === 100 ? '100% of ownership accounted for' : t ? t + '% listed so far' : '') + '</span>'; }
  S[5] = function () {
    return head('Funds and ownership.', 'Where the money comes from, and who owns the business.') +
      group('source', 'Main source of funds', chips('source', ['Trading revenue', 'Investment', 'Asset sale', 'Digital assets', 'Other'])) +
      field('sourceNote', 'In a sentence (optional)', { ph: 'For example: metal sales to manufacturers in the UK.' }) +
      '<div class="' + bad('owners').trim() + '"><span class="lbl">Owners with 25% or more</span><div id="owners">' + ownersHtml() + '</div>' +
      '<div class="addrow"><button type="button" class="linkb" data-addowner>+ Add an owner</button>' + totHtml() + '</div><div class="errline">Add at least one owner.</div></div>' +
      group('pep', 'Has any owner held a prominent public role?', chips('pep', ['No', 'Yes'], { seg: true }) + '<p class="hint">For example a minister, senior official, judge or senior military officer, or their close family.</p>', 'Please answer yes or no.') +
      '</div>' + side('Why we ask', '<p>Banks need to know who ultimately owns a business and where its money comes from. One clear sentence is enough.</p>');
  };
  function docsHtml() {
    return DOCS.map(function (x) {
      var f = meta.files[x[0]];
      if (f && f.state === 'done') return '<div class="dz">' + ic('doc') + '<div><b>' + x[1] + '</b><small>' + esc(f.name) + ' · ' + size(f.size) + '</small></div><span><span class="st ok">Uploaded</span> <button type="button" class="linkb" data-pick="' + x[0] + '" style="font-size:13px;margin-left:10px">Replace</button></span></div>';
      if (f && f.state === 'busy') return '<div class="dz">' + ic('upload') + '<div><b>' + x[1] + '</b><small>Uploading ' + esc(f.name) + '</small></div><span class="st run">Sending</span></div>';
      return '<div class="dz empty' + (f && f.state === 'err' ? ' err' : '') + '" data-pick="' + x[0] + '" data-drop="' + x[0] + '" role="button" tabindex="0">' + ic('upload') + '<div><b>' + x[1] + '</b><small>' +
        (f && f.state === 'err' ? esc(f.msg) : 'Drop a file here or browse. PDF, JPG or PNG, up to 4 MB.') + '</small></div><span></span></div>';
    }).join('');
  }
  S[6] = function () {
    return head('Upload three documents.', 'Photos or PDFs are fine. You can also send them later.') +
      '<div id="docs">' + docsHtml() + '</div><input type="file" id="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" hidden>' +
      '</div>' + side('Kept private', '<p>Files are stored securely and seen only by our onboarding team.</p>');
  };
  S[7] = function () {
    var cc = byCode[d.cc] || CC[0], owners = d.owners.filter(function (o) { return o.name.trim(); }).map(function (o) { return esc(o.name) + (o.pct ? ' ' + esc(o.pct) + '%' : ''); }).join(' · ');
    var up = DOCS.filter(function (x) { return meta.files[x[0]] && meta.files[x[0]].state === 'done'; }).map(function (x) { return x[1]; });
    var card = function (title, step, lines, wide) { return '<div' + (wide ? ' class="wide"' : '') + '><header><span>' + title + '</span><button type="button" class="linkb" data-edit="' + step + '" style="font-size:14px">Edit</button></header>' + lines.filter(Boolean).map(function (l) { return '<p>' + l + '</p>'; }).join('') + '</div>'; };
    return head('Check and send.', 'Everything you’ve told us. Edit anything before it goes.') +
      (sendError ? '<div class="banner" role="alert">' + sendError + '</div>' : '') +
      '<div class="rev">' +
      card('You', 0, [esc(d.name), esc(d.email), esc(cc[2] + ' ' + d.phone) + ' · ' + esc(d.reach)]) +
      card('Company', 1, [esc(d.company), esc(d.licence) + (d.legal ? ' · ' + esc(d.legal) : ''), esc([d.addr1, d.area, d.city, d.addrCountry].filter(Boolean).join(', '))]) +
      card('What you need', 3, [d.services.map(esc).join(', ') || 'Not chosen', [d.coins.join(' and '), d.networks.length ? 'on ' + d.networks.join(', ') : ''].filter(Boolean).map(esc).join(' ')]) +
      card('Payments', 4, [d.payCountries.map(esc).join(', ') || 'No countries added', d.currencies.join(', ') + (d.typical ? ' · USD ' + esc(d.typical) + ' typical' : ''), [d.monthly ? esc(d.monthly) + ' a month' : '', esc(d.freq)].filter(Boolean).join(' · ')]) +
      card('Ownership and checks', 5, [owners || 'No owners added', 'Funds: ' + esc(d.source || 'not given') + ' · Public role: ' + esc(d.pep || 'not answered'), up.length ? 'Documents: ' + up.join(', ') : 'Documents: to follow'], true) +
      '</div><label class="check' + bad('declare') + '"><input type="checkbox" data-check="declare"' + (d.declare ? ' checked' : '') + '><span>I confirm this is accurate and that I’m authorised to apply for ' + esc(d.company || 'this company') + '.<em class="errline" style="font-style:normal">Please tick to confirm.</em></span></label>' +
      '</div>' + side('What happens next', '<ol class="steps3"><li><i>1</i><span>We review your application</span></li><li><i>2</i><span>Your account manager gets in touch</span></li><li><i>3</i><span>You get your first quote in writing</span></li></ol>');
  };
  function head(t, s) { return '<div class="col"><div class="intro"><h1>' + t + '</h1><p class="sub">' + s + '</p></div>'; }

  // ---------- frame ----------
  function rail(step, all) {
    var g = all ? 6 : GROUPS.findIndex(function (x) { return x.indexOf(step) > -1; });
    var el = document.getElementById('rail');
    if (el) el.innerHTML = RAIL.map(function (r, i) { return '<li class="' + (i < g ? 'done' : i === g ? 'now' : '') + '"><i></i><div><b>' + r[0] + '</b><small>' + r[1] + '</small></div></li>'; }).join('');
    var p = document.getElementById('prog'); if (p) p.style.width = (all ? 100 : Math.round((step + 0.5) / 8 * 100)) + '%';
  }
  function draw(focusFirst) {
    var top = document.getElementById('toplabel');
    if (saveEl) saveEl.style.visibility = view === 'form' ? 'visible' : 'hidden';
    if (view === 'resume') return drawResume();
    if (view === 'done') return drawDone();
    var s = meta.step;
    rail(s); top.textContent = TOP[s];
    app.innerHTML = '<div class="scr" data-step="' + s + '">' + S[s]() + '</div><div class="rfoot">' +
      (s > 0 ? '<button type="button" class="back" data-back>Back</button>' : '') + (s === 6 ? '<button type="button" class="later" data-next>I’ll do this later</button>' : '') +
      '<span class="sp"></span><small>or press Enter</small><button type="button" class="btn accent" data-next>' + (s === 7 ? 'Send application' : returnTo != null ? 'Save and return' : 'Continue') + '</button></div>';
    if (focusFirst) { var f = app.querySelector('.bad input, .bad select') || (s === 0 && !d.name ? app.querySelector('input') : null); if (f) f.focus(); window.scrollTo(0, 0); }
  }
  function drawResume() {
    rail(meta.step); document.getElementById('toplabel').textContent = 'Welcome back';
    var g = GROUPS.findIndex(function (x) { return x.indexOf(meta.step) > -1; });
    app.innerHTML = '<div class="center"><div class="wb"><span class="lbl" style="margin:0">Welcome back</span><h1>Pick up where you left off' + (d.name ? ', ' + esc(d.name.split(' ')[0]) : '') + '.</h1>' +
      '<div class="bar"><i style="width:' + Math.round(g / 6 * 100) + '%"></i></div><small class="hint" style="margin:0">' + g + ' of 6 steps done</small><ul>' +
      RAIL.slice(0, g + 1).map(function (r, i) { return '<li class="' + (i === g ? 'next' : '') + '"><i></i>' + r[0] + (i === g ? ' <span class="cc" style="margin-left:6px">NEXT</span>' : '') + '</li>'; }).join('') +
      '</ul><button type="button" class="btn accent block" data-resume>Continue to ' + RAIL[g][0] + '</button><button type="button" class="linkb" data-restart style="color:var(--graphite);align-self:center">Start again</button></div></div>';
  }
  function days() {
    var out = [], x = new Date();
    while (out.length < 5) { x.setDate(x.getDate() + 1); if (x.getDay() === 0 || x.getDay() === 6) continue; out.push({ wd: x.toLocaleDateString('en-GB', { weekday: 'short' }), n: x.getDate(), full: x.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) }); }
    return out;
  }
  function drawDone() {
    rail(0, true); document.getElementById('toplabel').textContent = 'Application sent';
    var dd = days();
    app.innerHTML = '<div class="scr"><div class="col"><div class="intro"><h1>That’s everything' + (d.name ? ', ' + esc(d.name.split(' ')[0]) : '') + '.</h1><p class="sub">Your application is with our onboarding team. A person replies within 15 minutes.</p></div>' +
      '<span class="refchip">Reference ' + esc(meta.ref || '') + '</span>' +
      '<div class="callbox">' + (call.sent ? '<h3>Call requested.</h3><p class="sub" style="margin:0">' + esc(call.day) + ', around ' + esc(call.time) + '. We’ll confirm it by WhatsApp or email.</p>' :
        '<div><h3>Want to talk it through?</h3><p class="hint">Pick a time that suits. We’ll confirm it by WhatsApp or email.</p></div>' +
        '<div><span class="lbl">Pick a day</span><div class="days5">' + dd.map(function (x) { return '<button type="button" class="chip" data-day="' + x.full + '" aria-pressed="' + (call.day === x.full) + '"><small>' + x.wd + '</small><b>' + x.n + '</b></button>'; }).join('') + '</div></div>' +
        '<div><span class="lbl">Pick a time · Gulf Standard Time</span><div class="times4">' + ['09:30', '11:30', '14:00', '16:30'].map(function (t) { return '<button type="button" class="chip" data-time="' + t + '" aria-pressed="' + (call.time === t) + '">' + t + '</button>'; }).join('') + '</div></div>' +
        (call.err ? '<div class="banner" role="alert">' + call.err + '</div>' : '') +
        '<div class="confirm" style="display:flex;justify-content:space-between;align-items:center;gap:16px"><span style="font-size:14px;font-weight:500">' + (call.day && call.time ? esc(call.day) + ', around ' + esc(call.time) : 'Choose a day and a time') + '</span><button type="button" class="btn sm accent" data-call' + (call.day && call.time ? '' : ' disabled style="opacity:.4;cursor:default"') + '>Request call</button></div>') +
      '</div><a class="tlink" href="/">Back to the Delta Bridge site</a></div>' +
      side('While you wait', ticks(['Keep your reference handy', 'We’ll tell you if anything is missing', 'Nothing else is needed from you today'])) + '</div>';
  }

  // ---------- flow ----------
  function next() {
    var e = errs();
    if (Object.keys(e).length) { tried = true; draw(true); return; }
    tried = false;
    if (meta.step === 7) return submit();
    if (returnTo != null) { meta.step = returnTo; returnTo = null; } else meta.step += 1;
    persist(); draw(true);
  }
  function submit() {
    var b = app.querySelector('[data-next].btn'); if (b) { b.disabled = true; b.textContent = 'Sending'; }
    clearTimeout(timer);
    push({ submit: true }).then(function (j) {
      if (j._ok && j.status === 'submitted') { view = 'done'; sendError = ''; local(); draw(); window.scrollTo(0, 0); }
      else { sendError = 'We couldn’t send your application just now. Your answers are saved on this device. Please try again in a moment, or contact us and quote your details.'; draw(); }
    });
  }
  function upload(kind, file) {
    var set = function (o) { meta.files[kind] = o; var el = document.getElementById('docs'); if (el) el.innerHTML = docsHtml(); local(); };
    if (!file) return;
    if (!/\.(pdf|jpe?g|png)$/i.test(file.name)) return set({ state: 'err', msg: 'That file type isn’t accepted. Use a PDF, JPG or PNG.' });
    if (file.size > 4 * 1024 * 1024) return set({ state: 'err', msg: 'That file is over 4 MB. Try a smaller photo or PDF.' });
    set({ state: 'busy', name: file.name });
    var go = function () {
      if (!meta.id) return set({ state: 'err', msg: 'Uploads aren’t available right now. You can send documents later.' });
      fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/octet-stream', 'x-reg-id': meta.id, 'x-doc-kind': kind, 'x-file-name': encodeURIComponent(file.name) }, body: file })
        .then(function (r) { return r.json().then(function (j) { return r.ok ? j : Promise.reject(j); }); })
        .then(function (j) { set({ state: 'done', name: j.name, size: j.size }); })
        .catch(function () { set({ state: 'err', msg: 'That didn’t upload. Try again, or send it later.' }); });
    };
    (meta.id ? Promise.resolve() : push()).then(go);
  }
  function suggest(q) {
    var box = document.getElementById('sugg'); if (!box) return;
    q = q.trim().toLowerCase();
    var m = q ? NAMES.filter(function (n) { return n.toLowerCase().indexOf(q) > -1 && d.payCountries.indexOf(n) < 0; }).sort(function (a, b) { return a.toLowerCase().indexOf(q) - b.toLowerCase().indexOf(q); }).slice(0, 5) : [];
    box.innerHTML = m.map(function (n, i) { var c = CC.filter(function (x) { return x[1] === n; })[0]; return '<button type="button" class="' + (i === 0 ? 'hi' : '') + '" data-addtag="' + esc(n) + '"><span class="cc">' + c[0] + '</span>' + esc(n) + '</button>'; }).join('');
    box.className = 'sugg' + (m.length ? ' show' : '');
  }
  function addTag(n) { if (n && d.payCountries.indexOf(n) < 0) d.payCountries.push(n); persist(); draw(); var t = document.getElementById('tagin'); if (t) t.focus(); }
  function exitPanel() {
    var link = meta.id ? location.origin + '/register?r=' + meta.id : '';
    var m = document.createElement('div'); m.className = 'modal';
    m.innerHTML = '<div role="dialog" aria-modal="true" aria-label="Save and exit"><h2>Saved.</h2>' + (link ?
      '<p class="sub" style="margin:0">Keep this link to carry on later, on any device.</p><div class="copyrow"><input readonly value="' + esc(link) + '" aria-label="Your link"><button type="button" class="btn sm ink" data-copy>Copy link</button></div>' :
      '<p class="sub" style="margin:0">Your answers are saved in this browser. Come back to this page on the same device to carry on.</p>') +
      '<div class="actions"><a class="btn sm line" href="/">Leave for now</a><button type="button" class="btn sm accent" data-close>Keep going</button></div></div>';
    document.body.appendChild(m);
    m.addEventListener('click', function (e) {
      if (e.target === m || e.target.closest('[data-close]')) m.remove();
      var c = e.target.closest('[data-copy]');
      if (c) { var i = m.querySelector('input'); i.select(); (navigator.clipboard ? navigator.clipboard.writeText(i.value) : Promise.reject()).catch(function () { document.execCommand('copy'); }); c.textContent = 'Copied'; }
    });
  }

  // ---------- events ----------
  app.addEventListener('input', function (e) {
    var t = e.target, k = t.getAttribute('data-k');
    if (t.id === 'tagin') return suggest(t.value);
    if (t.hasAttribute('data-o')) {
      d.owners[+t.getAttribute('data-o')][t.getAttribute('data-ok')] = t.value;
      var tot = document.getElementById('tot'); if (tot) tot.outerHTML = totHtml();
      return persist();
    }
    if (!k) return;
    var bd = t.closest('.bad'); if (bd) bd.classList.remove('bad');
    if (k === 'phone') { t.value = d.phone = fmtPhone(t.value, d.cc); var ok = app.querySelector('.tel .tok'); if (ok) ok.className = 'tok' + (phoneLooksRight() ? ' show' : ''); }
    else if (k === 'typical') { t.value = d.typical = fmtMoney(t.value); app.querySelectorAll('[data-quick]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-quick') === d.typical); }); }
    else d[k] = t.value;
    persist();
  });
  app.addEventListener('change', function (e) {
    var t = e.target;
    if (t.id === 'file') { upload(t.getAttribute('data-kind'), t.files[0]); t.value = ''; return; }
    if (t.getAttribute('data-check')) { d[t.getAttribute('data-check')] = t.checked; return persist(); }
    if (t.getAttribute('data-k') === 'cc') { d.cc = t.value; d.phone = fmtPhone(d.phone, d.cc); persist(); draw(); }
  });
  app.addEventListener('click', function (e) {
    var t = e.target.closest('button, [data-pick]'); if (!t) return;
    var a = function (n) { return t.getAttribute(n); };
    if (t.hasAttribute('data-chip')) {
      var k = a('data-chip'), v = a('data-v');
      if (Array.isArray(d[k])) { var i = d[k].indexOf(v); if (i > -1) d[k].splice(i, 1); else d[k].push(v); } else d[k] = d[k] === v && k !== 'reach' ? '' : v;
      persist(); draw(); var again = app.querySelector('[data-chip="' + k + '"][data-v="' + v.replace(/"/g, '\\"') + '"]'); if (again) again.focus();
    } else if (t.hasAttribute('data-next')) next();
    else if (t.hasAttribute('data-back')) { tried = false; returnTo = null; meta.step = Math.max(0, meta.step - 1); local(); draw(true); }
    else if (t.hasAttribute('data-edit')) { returnTo = 7; tried = false; meta.step = +a('data-edit'); draw(true); }
    else if (t.hasAttribute('data-quick')) { d.typical = a('data-quick'); persist(); draw(); }
    else if (t.hasAttribute('data-addtag')) addTag(a('data-addtag'));
    else if (t.hasAttribute('data-rmtag')) { d.payCountries.splice(+a('data-rmtag'), 1); persist(); draw(); }
    else if (t.hasAttribute('data-addowner')) { d.owners.push({ name: '', role: 'Shareholder', pct: '' }); persist(); draw(); var ins = app.querySelectorAll('.owner input[data-ok=name]'); ins[ins.length - 1].focus(); }
    else if (t.hasAttribute('data-rmowner')) { d.owners.splice(+a('data-rmowner'), 1); persist(); draw(); }
    else if (t.hasAttribute('data-pick')) { var f = document.getElementById('file'); f.setAttribute('data-kind', a('data-pick')); f.click(); }
    else if (t.hasAttribute('data-resume')) { view = 'form'; draw(true); }
    else if (t.hasAttribute('data-restart')) { try { localStorage.removeItem(KEY); } catch (x) {} d = blank(); meta = { id: null, ref: null, step: 0, status: 'draft', files: {} }; view = 'form'; setSaved('idle'); draw(true); }
    else if (t.hasAttribute('data-day')) { call.day = a('data-day'); draw(); }
    else if (t.hasAttribute('data-time')) { call.time = a('data-time'); draw(); }
    else if (t.hasAttribute('data-call') && call.day && call.time) {
      t.disabled = true; t.textContent = 'Sending';
      post('/api/save', { id: meta.id, callRequest: { day: call.day, time: call.time } }).then(function (j) { if (j._ok) { call.sent = true; call.err = ''; } else call.err = 'That didn’t go through. Please try again, or message us.'; draw(); });
    }
  });
  app.addEventListener('keydown', function (e) {
    var t = e.target;
    if (t.id === 'tagin') {
      if (e.key === 'Enter') { e.preventDefault(); var hi = document.querySelector('#sugg .hi'); if (hi) addTag(hi.getAttribute('data-addtag')); else if (!t.value.trim()) next(); return; }
      if (e.key === 'Backspace' && !t.value && d.payCountries.length) { d.payCountries.pop(); persist(); draw(); document.getElementById('tagin').focus(); }
      return;
    }
    if (e.key === 'Enter' && t.tagName === 'INPUT' && view === 'form') { e.preventDefault(); next(); }
    if ((e.key === 'Enter' || e.key === ' ') && t.hasAttribute && t.hasAttribute('data-pick') && t.tagName !== 'BUTTON') { e.preventDefault(); t.click(); }
  });
  app.addEventListener('dragover', function (e) { var z = e.target.closest('[data-drop]'); if (z) { e.preventDefault(); z.classList.add('over'); } });
  app.addEventListener('dragleave', function (e) { var z = e.target.closest('[data-drop]'); if (z) z.classList.remove('over'); });
  app.addEventListener('drop', function (e) { var z = e.target.closest('[data-drop]'); if (z) { e.preventDefault(); upload(z.getAttribute('data-drop'), e.dataTransfer.files[0]); } });
  var ex = document.getElementById('exit');
  if (ex) ex.addEventListener('click', function () { local(); if (emailOk(d.email) && meta.status !== 'submitted') { clearTimeout(timer); push().then(exitPanel); } else exitPanel(); });

  // ---------- start ----------
  function adopt(saved) {
    d = Object.assign(blank(), saved.d || {}); if (!Array.isArray(d.owners) || !d.owners.length) d.owners = blank().owners;
    meta = Object.assign({ id: null, ref: null, step: 0, status: 'draft', files: {} }, saved.meta || {});
    Object.keys(meta.files).forEach(function (k) { if (meta.files[k].state !== 'done') delete meta.files[k]; });
    meta.step = Math.max(0, Math.min(7, meta.step | 0));
  }
  var r = (new URLSearchParams(location.search).get('r') || '').toLowerCase(), stored = null;
  try { stored = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  function begin() {
    if (meta.status === 'submitted') view = 'done';
    else if (meta.step > 0 || d.name || d.email) view = 'resume';
    setSaved(meta.id ? 'ok' : d.name ? 'local' : 'idle');
    draw(view === 'form');
  }
  if (/^[a-f0-9]{32}$/.test(r)) {
    history.replaceState(null, '', location.pathname);
    app.innerHTML = '<div class="center"><p class="sub">Finding your application</p></div>';
    post('/api/load', { id: r }).then(function (j) {
      if (j._ok) {
        var files = {}; (j.files || []).forEach(function (f) { files[f.kind] = { state: 'done', name: f.name, size: f.size }; });
        adopt({ d: j.data, meta: { id: j.id, ref: j.reference, step: j.step, status: j.status, files: files } }); local();
      } else if (stored) adopt(stored);
      begin();
    });
  } else { if (stored) adopt(stored); begin(); }
})();
