/* EMB R7 EIA Screening: online shared POW log (Firebase) + map.
   Turns on only when firebase-config.js has real values. Otherwise the
   tool keeps using the local, per-device log from pow.js. */
(function () {
  var cfg = window.EMB_FIREBASE;
  if (!cfg || !cfg.apiKey || /PASTE|YOUR|XXXX/i.test(cfg.apiKey)) return;

  var FB = 'https://www.gstatic.com/firebasejs/10.12.2/';
  var LEAF = 'https://unpkg.com/leaflet@1.9.4/dist/';
  var STATUS = ['For screening', 'On-going', 'Approved'];
  var COLORS = { 'For screening': '#d97706', 'On-going': '#2563eb', 'Approved': '#0b6b3a' };
  var CEBU = [10.3157, 123.8854];

  var db = null, auth = null, user = null, rows = [], unsub = null;
  var curDate = null, showAll = false, tab = 'list', notice = '', loadFailed = false, denied = false;
  var mapObj = null, mapLayer = null;

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function z(n) { return (n < 10 ? '0' : '') + n; }
  function today() { var d = new Date(); return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()); }
  function $(id) { return document.getElementById(id); }
  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = function () { rej(new Error('load ' + src)); };
      document.head.appendChild(s);
    });
  }
  function loadCss(href) {
    if (document.querySelector('link[href="' + href + '"]')) return;
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l);
  }
  function hasXY(e) { return e.lat !== '' && e.lat != null && e.lng !== '' && e.lng != null && !isNaN(+e.lat) && !isNaN(+e.lng); }
  function modal() {
    var m = $('powModal');
    if (!m) { m = document.createElement('div'); m.id = 'powModal'; document.body.appendChild(m); }
    return m;
  }
  function cssOnline() {
    if ($('powOnlineCss')) return;
    var s = document.createElement('style'); s.id = 'powOnlineCss';
    s.textContent =
      '.pw-tabs{display:flex;gap:6px;margin:10px 0 0}.pw-tab{border:1px solid #c9d6ce;background:#fff;color:#1c2b25;border-radius:999px;padding:6px 16px;font:inherit;font-size:13px;font-weight:700;cursor:pointer}.pw-tab.on{background:#0b6b3a;color:#fff;border-color:#0b6b3a}' +
      '.pw-who{font-size:12px;color:#566860}.pw-who button{margin-left:8px}' +
      '.pw-login{max-width:380px;margin:30px auto;display:grid;gap:12px}.pw-login label{display:flex;flex-direction:column;font-size:12px;font-weight:600;gap:4px}.pw-login input{font:inherit;font-size:14px;padding:9px 10px;border:1px solid #c9d6ce;border-radius:8px}' +
      '.pw-err{color:#b45309;font-size:13px;font-weight:600;min-height:1.2em}.pw-ok{color:#0b6b3a}' +
      '#powMap{height:480px;border-radius:12px;border:1px solid #c9d6ce;margin-top:12px}' +
      '.pw-legend{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;margin-top:8px}.pw-legend i{display:inline-block;width:11px;height:11px;border-radius:50%;margin-right:5px;vertical-align:-1px}' +
      '#powPick{position:fixed;inset:0;z-index:1200;background:rgba(10,30,20,.6);display:none;align-items:center;justify-content:center;padding:12px}#powPick.show{display:flex}' +
      '.pw-pickbox{background:#fff;color:#1c2b25;border-radius:16px;width:100%;max-width:720px;padding:16px;max-height:96vh;overflow:auto}.pw-pickbox h3{margin:0 0 8px;font-size:17px}' +
      '#powPickMap{height:52vh;min-height:260px;border-radius:12px;border:1px solid #c9d6ce;margin:10px 0}' +
      '.pw-pickbar{display:flex;gap:8px;flex-wrap:wrap}.pw-pickbar input{flex:1;min-width:160px;font:inherit;font-size:14px;padding:8px 10px;border:1px solid #c9d6ce;border-radius:8px}' +
      '.pw-mini{font-size:12px;padding:3px 9px;border:1px solid #c9d6ce;border-radius:999px;background:#fff;cursor:pointer;margin-left:6px}' +
      '.pw-locrow{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}';
    document.head.appendChild(s);
  }

  /* ---------- boot ---------- */
  function boot() {
    cssOnline();
    var p = window.firebase ? Promise.resolve() :
      loadScript(FB + 'firebase-app-compat.js')
        .then(function () { return loadScript(FB + 'firebase-auth-compat.js'); })
        .then(function () { return loadScript(FB + 'firebase-firestore-compat.js'); });
    p.then(start).catch(function () { loadFailed = true; setBtn(); });
    setBtn();
  }

  function start() {
    if (!firebase.apps.length) firebase.initializeApp(cfg);
    auth = firebase.auth();
    db = firebase.firestore();
    try { db.enablePersistence({ synchronizeTabs: true }).catch(function () {}); } catch (e) {}
    auth.onAuthStateChanged(function (u) {
      user = u; denied = false;
      if (unsub) { unsub(); unsub = null; }
      rows = [];
      if (u) subscribe();
      setBtn(); redraw(true); refreshForm();
    });
  }

  function subscribe() {
    unsub = db.collection('applicants').onSnapshot(function (snap) {
      rows = snap.docs.map(function (d) { var o = d.data(); o.ref = d.id; return o; })
        .sort(function (a, b) { return (a.at || 0) - (b.at || 0); });
      denied = false; setBtn(); redraw(false);
    }, function (err) {
      if (err && err.code === 'permission-denied') denied = true;
      setBtn(); redraw(true);
    });
  }

  function setBtn() {
    var b = $('powBtn'); if (!b) return;
    if (loadFailed) b.textContent = 'Shared log (no connection)';
    else if (!user) b.textContent = 'Staff sign in';
    else if (denied) b.textContent = 'Not on staff list';
    else b.textContent = 'Shared log (' + rows.filter(function (e) { return e.date === today(); }).length + ')';
  }

  /* ---------- form under each result ---------- */
  function formHtml() {
    if (loadFailed) return '<div class="pow-form"><div class="pow-h">Shared log</div><p style="margin:0;font-size:13px">Could not reach the online service. Check your internet and reload the page.</p></div>';
    if (!user) return '<div class="pow-form"><div class="pow-h">Log this applicant (POW)</div><p style="margin:0 0 10px;font-size:13px">Staff sign-in is needed to save to the shared log.</p><button class="copy-btn" onclick="powOpen()">Staff sign in</button></div>';
    if (denied) return '<div class="pow-form"><div class="pow-h">Log this applicant (POW)</div><p style="margin:0;font-size:13px">This account is not on the staff list yet. Ask the EIA Section to add <b>' + esc(user.email) + '</b>.</p></div>';
    return '<div class="pow-form"><div class="pow-h">Log this applicant (POW) <span class="pw-who">Shared log · ' + esc(user.email) + '</span></div>' +
      '<div class="pow-grid">' +
      '<label>Project name *<input id="pwProj" placeholder="Name of the project itself, e.g. Sunrise Auto Care"></label>' +
      '<label>Proponent name *<input id="pwProp"></label>' +
      '<label>Contact number<input id="pwContact" inputmode="tel"></label>' +
      '<label>Type of business<input id="pwBiz" placeholder="e.g. auto repair shop, hog raising"></label>' +
      '<label>Latitude<input id="pwLat" inputmode="decimal" placeholder="e.g. 10.3157"></label>' +
      '<label>Longitude<input id="pwLng" inputmode="decimal" placeholder="e.g. 123.8854"></label>' +
      '<label>Notes (optional)<input id="pwNotes"></label>' +
      '</div><div class="pw-locrow"><button class="pow-btn alt" type="button" onclick="powPickForm()">📍 Locate the project on the map</button><button class="pow-btn alt" type="button" onclick="powGpsForm()">Use my current location</button></div>' +
      '<div class="pow-row"><button class="copy-btn" onclick="powSave()">Save to shared log</button><button class="pow-link" onclick="powOpen()">Open the shared log</button><span class="copy-status" id="pwMsg"></span></div></div>';
  }
  window.powRenderForm = function () {
    var slot = $('powLogSlot');
    if (!slot || typeof currentAnswer === 'undefined' || !currentAnswer || !activeItem) return;
    slot.innerHTML = formHtml();
  };
  function refreshForm() {
    var slot = $('powLogSlot');
    if (slot && slot.innerHTML && typeof currentAnswer !== 'undefined' && currentAnswer && typeof activeItem !== 'undefined' && activeItem) slot.innerHTML = formHtml();
  }

  /* ---------- save ---------- */
  function rand3() { var a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = ''; for (var i = 0; i < 3; i++) s += a[Math.floor(Math.random() * a.length)]; return s; }
  function makeRef(d) {
    var key = d.replace(/-/g, '');
    function fallback() { return 'POW-' + key + '-' + rand3(); }
    var t;
    try {
      var cref = db.collection('counters').doc(key);
      t = db.runTransaction(function (tx) {
        return tx.get(cref).then(function (s) {
          var n = (s.exists ? s.data().n : 0) + 1; tx.set(cref, { n: n }); return n;
        });
      }).then(function (n) { return 'POW-' + key + '-' + ('00' + n).slice(-3); });
    } catch (e) { return Promise.resolve(fallback()); }
    var timeout = new Promise(function (res) { setTimeout(function () { res(null); }, 4000); });
    return Promise.race([t, timeout]).then(function (r) { return r || fallback(); }).catch(fallback);
  }
  window.powSave = function () {
    var g = function (i) { return ($(i) || { value: '' }).value.trim(); };
    var msg = $('pwMsg');
    function say(t, bad) { msg.textContent = t; msg.style.color = bad ? '#b45309' : ''; }
    if (!user) { say('Sign in as staff first.', true); return; }
    if (!g('pwProp') || !g('pwProj')) { say('Project name and proponent name are required.', true); return; }
    var lat = g('pwLat'), lng = g('pwLng');
    if ((lat && isNaN(parseFloat(lat))) || (lng && isNaN(parseFloat(lng)))) { say('Latitude and longitude must be numbers (decimal degrees).', true); return; }
    var d = today(), item = activeItem, ans = currentAnswer;
    say('Saving...');
    makeRef(d).then(function (ref) {
      var doc = {
        ref: ref, date: d, proj: g('pwProj'), prop: g('pwProp'), contact: g('pwContact'), biz: g('pwBiz'),
        lat: lat, lng: lng, iis: '', notes: g('pwNotes'),
        thr: (item.code || '') + ' ' + (item.name || '') + ' (' + (ans.cat || '') + ')',
        cat: ans.cat, doc: window.__pow.docFor(ans.cat), status: 'For screening',
        by: user.email, at: Date.now()
      };
      var offline = navigator.onLine === false;
      db.collection('applicants').doc(ref).set(doc).then(function () {
        if (!offline) say('Saved to the shared log as ' + ref);
      }).catch(function (e) {
        say('Could not save: ' + (e && e.code === 'permission-denied' ? 'this account is not on the staff list.' : 'check your connection.'), true);
      });
      if (offline) say('Saved as ' + ref + ' on this device. It will go to the shared log when the internet is back. Keep this page open.');
      ['pwProp', 'pwProj', 'pwContact', 'pwBiz', 'pwLat', 'pwLng', 'pwNotes'].forEach(function (i) { var el = $(i); if (el) el.value = ''; });
    });
  };

  /* ---------- edits ---------- */
  window.powSet = function (ref, f, v) {
    var o = {}; o[f] = v; o.upBy = user.email; o.upAt = Date.now();
    db.collection('applicants').doc(ref).update(o).catch(function () { alert('Could not update. Check your connection.'); });
  };
  window.powDel = function (ref) {
    if (!confirm('Delete ' + ref + ' from the shared log? Everyone will lose it.')) return;
    db.collection('applicants').doc(ref).delete().catch(function () { alert('Could not delete. Check your connection.'); });
  };

  /* ---------- sign in ---------- */
  function loginView() {
    var m = modal();
    var why = loadFailed ? 'Could not reach the online service. Check your internet and reload.' : '';
    m.innerHTML = '<div class="pow-box"><div class="pow-top"><h2>Staff sign in</h2><button class="pow-btn x" onclick="powClose()">Close</button></div>' +
      '<div class="pw-login"><p style="margin:0;font-size:13px;color:#566860">Only EMB staff accounts can open the shared applicant log. The screening tool itself stays open to everyone.</p>' +
      '<label>Email<input id="pwEmail" type="email" autocomplete="username"></label>' +
      '<label>Password<input id="pwPass" type="password" autocomplete="current-password"></label>' +
      '<button class="pow-btn" id="pwGo" onclick="powLogin()">Sign in</button><div class="pw-err" id="pwErr">' + esc(why) + '</div>' +
      '<p style="margin:0;font-size:12px;color:#566860">No account yet? Ask the EIA Section to create one for you.</p></div></div>';
    m.classList.add('show');
    var p = $('pwPass'); if (p) p.addEventListener('keydown', function (e) { if (e.key === 'Enter') window.powLogin(); });
  }
  window.powLogin = function () {
    var err = $('pwErr'), em = ($('pwEmail').value || '').trim(), pw = $('pwPass').value || '';
    if (!auth) { err.textContent = 'Still connecting. Try again in a moment.'; return; }
    if (!em || !pw) { err.textContent = 'Enter your email and password.'; return; }
    err.textContent = 'Signing in...';
    auth.signInWithEmailAndPassword(em, pw).then(function () { powOpen(); }).catch(function (e) {
      var c = e && e.code || '';
      err.textContent = /invalid|wrong-password|user-not-found|invalid-email/.test(c) ? 'Wrong email or password.' :
        c === 'auth/too-many-requests' ? 'Too many tries. Wait a few minutes and try again.' :
        c === 'auth/network-request-failed' ? 'No internet connection.' : 'Could not sign in.';
    });
  };
  window.powLogout = function () { if (auth) auth.signOut().then(function () { powClose(); }); };

  /* ---------- the shared log window ---------- */
  function visible() {
    return rows.filter(function (e) { return showAll || e.date === curDate; });
  }
  window.powClose = function () { destroyMap(); modal().classList.remove('show'); };
  function destroyMap() { if (mapObj) { try { mapObj.remove(); } catch (e) {} } mapObj = null; mapLayer = null; }

  window.powOpen = function (d) {
    window.__pow.css();
    if (typeof d === 'string' && d) curDate = d; else if (!curDate) curDate = today();
    if (!user) { loginView(); return; }
    draw();
  };
  window.powTab = function (t) { tab = t; draw(); };
  window.powAll = function (v) { showAll = !!v; draw(); };

  function redraw(force) {
    var m = $('powModal');
    if (!m || !m.classList.contains('show')) return;
    if (!user) { if (force) loginView(); return; }
    var a = document.activeElement;
    if (!force && a && m.contains(a) && /INPUT/.test(a.tagName) && a.type !== 'date' && a.type !== 'checkbox') return; // don't wipe typing
    if (tab === 'map' && mapObj && !force) { renderMarkers(); updateCounts(); return; }
    draw();
  }

  function counts(list) {
    var by = {}; list.forEach(function (e) { by[e.status] = (by[e.status] || 0) + 1; });
    return '<div><b>' + list.length + '</b>applicants</div>' + STATUS.map(function (s) { return '<div><b>' + (by[s] || 0) + '</b>' + s + '</div>'; }).join('');
  }
  function updateCounts() { var el = $('pwSum'); if (el) el.innerHTML = counts(visible()); var n = $('pwMapN'); if (n) n.textContent = mapNote(); }
  function mapNote() { var v = visible(), w = v.filter(hasXY).length; return w + ' of ' + v.length + ' have map coordinates.'; }

  function draw() {
    var m = modal(), list = visible();
    destroyMap();
    var head = '<div class="pow-box"><div class="pow-top"><h2>Permitting on Wheels: shared applicant log</h2><div class="pw-who">' + esc(user.email) +
      '<button class="pow-btn x" onclick="powLogout()">Sign out</button> <button class="pow-btn x" onclick="powClose()">Close</button></div></div>';
    if (denied) { m.innerHTML = head + '<p style="margin:20px 0;font-size:14px">This account is not on the staff list yet. Ask the EIA Section to add <b>' + esc(user.email) + '</b>.</p></div>'; m.classList.add('show'); return; }
    var bar = '<div class="pow-bar"><label>Date <input type="date" value="' + curDate + '" onchange="powOpen(this.value)"' + (showAll ? ' disabled' : '') + '></label>' +
      '<label style="display:flex;gap:6px;align-items:center"><input type="checkbox" ' + (showAll ? 'checked ' : '') + 'onchange="powAll(this.checked)"> All days</label>' +
      '<button class="pow-btn" onclick="powExport(false)">Export (Excel)</button><button class="pow-btn x" onclick="window.print()">Print</button></div>';
    var tabs = '<div class="pw-tabs"><button class="pw-tab' + (tab === 'list' ? ' on' : '') + '" onclick="powTab(\'list\')">List</button><button class="pw-tab' + (tab === 'map' ? ' on' : '') + '" onclick="powTab(\'map\')">Map</button></div>';
    var sum = '<div class="pow-sum" id="pwSum">' + counts(list) + '</div>';
    var body;
    if (tab === 'map') {
      body = '<div class="pw-legend">' + STATUS.map(function (s) { return '<span><i style="background:' + COLORS[s] + '"></i>' + s + '</span>'; }).join('') + '<span id="pwMapN" style="color:#566860">' + mapNote() + '</span></div><div id="powMap"></div>';
    } else {
      var trs = list.map(function (e) {
        return '<tr><td>' + esc(e.ref) + '</td><td>' + esc(e.date) + '</td><td>' + esc(e.proj) + '</td><td>' + esc(e.prop) + '</td><td>' + esc(e.contact) + '</td><td>' + esc(e.thr) + '</td><td>' + esc(e.biz) + '</td>' +
          '<td>' + (hasXY(e) ? esc(e.lat) + ', ' + esc(e.lng) : '') + '<button class="pw-mini" onclick="powLocate(\'' + esc(e.ref) + '\')">' + (hasXY(e) ? 'Edit pin' : '📍 Locate') + '</button></td>' +
          '<td><select onchange="powSet(\'' + esc(e.ref) + '\',\'status\',this.value)">' + STATUS.map(function (s) { return '<option' + (s === e.status ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></td>' +
          '<td><input value="' + esc(e.iis) + '" placeholder="IIS No." onchange="powSet(\'' + esc(e.ref) + '\',\'iis\',this.value)"></td><td>' + esc(e.notes) + '</td><td>' + esc((e.by || '').split('@')[0]) + '</td>' +
          '<td><button class="pow-del" onclick="powDel(\'' + esc(e.ref) + '\')" title="Delete">&times;</button></td></tr>';
      }).join('') || '<tr><td colspan="13" style="padding:20px;color:#566860">No applicants logged for this ' + (showAll ? 'log yet' : 'date') + '.</td></tr>';
      body = '<div class="pow-tbl-w"><table class="pow-tbl"><thead><tr><th>Ref</th><th>Date</th><th>Project name</th><th>Proponent name</th><th>Contact</th><th>Project type (Annex A)</th><th>Type of business</th><th>Lat, Long</th><th>Status</th><th>IIS No.</th><th>Notes</th><th>By</th><th></th></tr></thead><tbody>' + trs + '</tbody></table></div>';
    }
    var local = localCount();
    var mig = local ? '<div class="pow-note" style="background:#fff7e6;border-color:#f3d9a4"><b>' + local + '</b> applicant(s) are saved only on this device from before. <button class="pow-btn alt" onclick="powMigrate()">Upload them to the shared log</button></div>' : '';
    var note = '<div class="pow-note">Shared with all signed-in staff in real time. Entries made without internet are sent when the connection returns, as long as this page stays open. Fill in the IIS Number once the application is forwarded.' + (notice ? ' <b>' + esc(notice) + '</b>' : '') + '</div>';
    m.innerHTML = head + bar + tabs + sum + body + mig + note + '</div>';
    m.classList.add('show');
    if (tab === 'map') initMap();
  }

  /* ---------- export ---------- */
  window.powExport = function (all) {
    var list = visible();
    window.__pow.dlb('POW-Log-' + (showAll ? 'ALL' : curDate) + '.xlsx', window.__pow.xlsx(list));
  };

  /* ---------- migrate local entries ---------- */
  function localRows() { try { var r = localStorage.getItem('emb7_pow_log_v1'); return r ? JSON.parse(r) : []; } catch (e) { return []; } }
  function localCount() { return localRows().length; }
  window.powMigrate = function () {
    var L = localRows(); if (!L.length) return;
    var existing = {}; rows.forEach(function (e) { existing[e.ref] = 1; });
    var batch = db.batch();
    L.forEach(function (e) {
      var id = existing[e.ref] ? e.ref + '-' + rand3() : e.ref;
      var o = Object.assign({}, e, { ref: id, by: user.email, at: Date.now() });
      batch.set(db.collection('applicants').doc(id), o);
    });
    batch.commit().then(function () {
      try { localStorage.setItem('emb7_pow_log_v1_uploaded', localStorage.getItem('emb7_pow_log_v1')); localStorage.removeItem('emb7_pow_log_v1'); } catch (e) {}
      notice = 'Uploaded ' + L.length + ' entries.'; draw();
    }).catch(function () { alert('Could not upload. Check your connection.'); });
  };

  /* ---------- map ---------- */
  function withLeaflet() {
    if (window.L) return Promise.resolve();
    loadCss(LEAF + 'leaflet.css');
    return loadScript(LEAF + 'leaflet.js');
  }
  function initMap() {
    var box = $('powMap');
    withLeaflet().then(function () {
      var el = $('powMap'); if (!el || tab !== 'map') return;
      mapObj = L.map(el).setView(CEBU, 9);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(mapObj);
      mapLayer = L.layerGroup().addTo(mapObj);
      renderMarkers(true);
    }).catch(function () { if (box) box.innerHTML = '<p style="padding:20px;font-size:13px">The map could not load. It needs an internet connection.</p>'; });
  }
  function renderMarkers(fit) {
    if (!mapObj || !mapLayer) return;
    mapLayer.clearLayers();
    var pts = [];
    visible().filter(hasXY).forEach(function (e) {
      var ll = [+e.lat, +e.lng]; pts.push(ll);
      L.circleMarker(ll, { radius: 9, color: '#fff', weight: 2, fillColor: COLORS[e.status] || '#555', fillOpacity: .95 })
        .bindPopup('<b>' + esc(e.proj) + '</b><br>' + esc(e.prop) + (e.contact ? '<br>' + esc(e.contact) : '') + '<br>' + esc(e.thr) + '<br><i>' + esc(e.status) + '</i> · ' + esc(e.ref))
        .addTo(mapLayer);
    });
    if (fit && pts.length) mapObj.fitBounds(pts, { padding: [30, 30], maxZoom: 15 });
  }

  /* ---------- location picker (used by the form and by the list) ---------- */
  var pick = { map: null, marker: null, cb: null, ll: null };
  function pickModal() {
    var p = $('powPick');
    if (!p) {
      p = document.createElement('div'); p.id = 'powPick';
      p.innerHTML = '<div class="pw-pickbox"><h3>Locate the project</h3>' +
        '<div class="pw-pickbar"><input id="pkQ" placeholder="Search a place, barangay or landmark"><button class="pow-btn alt" onclick="powPickSearch()">Search</button><button class="pow-btn alt" onclick="powPickGps()">Use my location</button></div>' +
        '<div id="powPickMap"></div><div id="pkInfo" style="font-size:13px;color:#566860">Tap the map to drop the pin. You can drag it to adjust.</div>' +
        '<div class="pow-row"><button class="copy-btn" onclick="powPickOk()">Use this location</button><button class="pow-link" onclick="powPickClose()">Cancel</button></div></div>';
      document.body.appendChild(p);
      $('pkQ').addEventListener('keydown', function (e) { if (e.key === 'Enter') window.powPickSearch(); });
    }
    return p;
  }
  function setPin(ll, zoom) {
    pick.ll = ll;
    if (!pick.marker) {
      pick.marker = L.marker(ll, { draggable: true }).addTo(pick.map);
      pick.marker.on('dragend', function () { var p = pick.marker.getLatLng(); setPin([p.lat, p.lng]); });
    } else pick.marker.setLatLng(ll);
    if (zoom) pick.map.setView(ll, zoom);
    $('pkInfo').textContent = 'Pin: ' + ll[0].toFixed(6) + ', ' + ll[1].toFixed(6);
  }
  function openPicker(start, cb) {
    cssOnline();
    var p = pickModal(); p.classList.add('show'); pick.cb = cb; pick.ll = null;
    withLeaflet().then(function () {
      if (pick.map) { try { pick.map.remove(); } catch (e) {} pick.map = null; pick.marker = null; }
      pick.map = L.map('powPickMap').setView(start || CEBU, start ? 16 : 10);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(pick.map);
      if (start) setPin(start);
      pick.map.on('click', function (e) { setPin([e.latlng.lat, e.latlng.lng]); });
      setTimeout(function () { pick.map.invalidateSize(); }, 150);
    }).catch(function () { $('pkInfo').textContent = 'The map needs an internet connection. You can still type the latitude and longitude.'; });
  }
  window.powPickClose = function () { var p = $('powPick'); if (p) p.classList.remove('show'); if (pick.map) { try { pick.map.remove(); } catch (e) {} pick.map = null; pick.marker = null; } };
  window.powPickOk = function () {
    if (!pick.ll) { $('pkInfo').textContent = 'Tap the map first to drop the pin.'; return; }
    var ll = pick.ll, cb = pick.cb; powPickClose(); if (cb) cb(ll);
  };
  window.powPickGps = function () {
    if (!navigator.geolocation) { $('pkInfo').textContent = 'This device cannot share its location.'; return; }
    $('pkInfo').textContent = 'Finding your location...';
    navigator.geolocation.getCurrentPosition(function (p) { setPin([p.coords.latitude, p.coords.longitude], 17); },
      function () { $('pkInfo').textContent = 'Could not get your location. Allow location access, or tap the map instead.'; },
      { enableHighAccuracy: true, timeout: 15000 });
  };
  window.powPickSearch = function () {
    var q = ($('pkQ').value || '').trim(); if (!q) return;
    $('pkInfo').textContent = 'Searching...';
    fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ph&q=' + encodeURIComponent(q))
      .then(function (r) { return r.json(); })
      .then(function (a) {
        if (!a.length) { $('pkInfo').textContent = 'No match. Try a nearby landmark or tap the map.'; return; }
        setPin([+a[0].lat, +a[0].lon], 16);
      }).catch(function () { $('pkInfo').textContent = 'Search needs an internet connection.'; });
  };
  window.powPickForm = function () {
    var la = parseFloat(($('pwLat') || {}).value), ln = parseFloat(($('pwLng') || {}).value);
    openPicker(isNaN(la) || isNaN(ln) ? null : [la, ln], function (ll) { $('pwLat').value = ll[0].toFixed(6); $('pwLng').value = ll[1].toFixed(6); });
  };
  window.powGpsForm = function () {
    var msg = $('pwMsg');
    if (!navigator.geolocation) { msg.textContent = 'This device cannot share its location.'; return; }
    msg.textContent = 'Finding your location...';
    navigator.geolocation.getCurrentPosition(function (p) {
      $('pwLat').value = p.coords.latitude.toFixed(6); $('pwLng').value = p.coords.longitude.toFixed(6); msg.textContent = 'Location filled in.';
    }, function () { msg.textContent = 'Could not get your location. Allow location access, or use the map.'; }, { enableHighAccuracy: true, timeout: 15000 });
  };
  window.powLocate = function (ref) {
    var e = rows.filter(function (r) { return r.ref === ref; })[0]; if (!e) return;
    openPicker(hasXY(e) ? [+e.lat, +e.lng] : null, function (ll) {
      window.powSet(ref, 'lat', ll[0].toFixed(6)); window.powSet(ref, 'lng', ll[1].toFixed(6));
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.__powOnline = true;
})();
