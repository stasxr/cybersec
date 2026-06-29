// CyberSec by Palanit — Personal Security Checklist portal.
// 100% client-side: local accounts (PBKDF2-hashed passwords in localStorage) + per-user progress.
// No backend, no network — accounts/progress live only in this browser.
(function () {
  "use strict";

  var LS_USERS = "cybersec_csl_users";
  var LS_SESSION = "cybersec_csl_session";
  var LS_PROG = "cybersec_csl_prog_";
  var PRIOS = ["essential", "optional", "advanced"];
  var SECTIONS = window.CHECKLIST || [];

  // per-section accent colours (matching the original project's palette)
  var COLORS = {
    "authentication": "#f5c518", "web-browsing": "#34d399", "email": "#2dd4bf",
    "messaging": "#22d3ee", "social-media": "#60a5fa", "networks": "#a78bfa",
    "mobile-devices": "#e879f9", "personal-computers": "#f472b6", "smart-home": "#fb7185",
    "personal-finance": "#c084fc", "human-aspect": "#818cf8", "physical-security": "#a3e635"
  };
  var ICONS = {
    "authentication": '<circle cx="8.5" cy="8.5" r="4"/><path d="M11.3 11.3 20 20"/><path d="M17 17l2-2"/><path d="M14.5 14.5l2-2"/>',
    "web-browsing": '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.6 2.6 2.6 15.4 0 18"/><path d="M12 3c-2.6 2.6-2.6 15.4 0 18"/>',
    "email": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M4 7l8 5.5L20 7"/>',
    "messaging": '<path d="M20 12a7.5 7.5 0 0 1-10.9 6.7L4.5 20l1.3-4.3A7.5 7.5 0 1 1 20 12z"/>',
    "social-media": '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.3 10.9 15.7 7.1"/><path d="M8.3 13.1l7.4 3.8"/>',
    "networks": '<rect x="3" y="4.5" width="18" height="6.5" rx="1.5"/><rect x="3" y="13" width="18" height="6.5" rx="1.5"/><path d="M6.5 7.7h.01"/><path d="M6.5 16.2h.01"/>',
    "mobile-devices": '<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M10.5 18h3"/>',
    "personal-computers": '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8"/><path d="M12 16v4"/>',
    "smart-home": '<path d="M3.5 11 12 4.5 20.5 11"/><path d="M5.5 9.7V19.5h13V9.7"/><path d="M9.7 14.2a3.2 3.2 0 0 1 4.6 0"/><path d="M12 16.7h.01"/>',
    "personal-finance": '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 9.5h18"/><path d="M6.5 14.5h4"/>',
    "human-aspect": '<circle cx="12" cy="7.5" r="3.3"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/>',
    "physical-security": '<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 7h.01"/><path d="M15 7h.01"/><path d="M9 11h.01"/><path d="M15 11h.01"/><path d="M10 21v-3.5h4V21"/>'
  };
  var GAUGE_COL = { essential: "#ff4326", optional: "#12a4c4", advanced: "#cdf546" };
  var ARC = 163.4; // length of the r=52 semicircle

  /* ---------------- storage helpers ---------------- */
  function getUsers() { try { return JSON.parse(localStorage.getItem(LS_USERS) || "{}"); } catch (e) { return {}; } }
  function saveUsers(u) { localStorage.setItem(LS_USERS, JSON.stringify(u)); }
  function getProgress(user) { try { return JSON.parse(localStorage.getItem(LS_PROG + user) || "{}"); } catch (e) { return {}; } }
  function saveProgress(user, p) { localStorage.setItem(LS_PROG + user, JSON.stringify(p)); }

  /* ---------------- crypto (PBKDF2-SHA256) ---------------- */
  function toHex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join(""); }
  function randSalt() { var a = new Uint8Array(16); crypto.getRandomValues(a); return toHex(a); }
  function hashPw(pw, salt) {
    var enc = new TextEncoder();
    return crypto.subtle.importKey("raw", enc.encode(pw), { name: "PBKDF2" }, false, ["deriveBits"])
      .then(function (key) {
        return crypto.subtle.deriveBits(
          { name: "PBKDF2", salt: enc.encode(salt), iterations: 100000, hash: "SHA-256" }, key, 256);
      })
      .then(toHex);
  }

  /* ---------------- helpers ---------------- */
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function itemId(slug, i) { return slug + "/" + i; }
  function icon(slug) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[slug] || "") + "</svg>"; }

  /* ---------------- elements ---------------- */
  var authView = document.getElementById("authView");
  var appView = document.getElementById("appView");
  var form = document.getElementById("authForm");
  var userEl = document.getElementById("cslUser");
  var passEl = document.getElementById("cslPass");
  var pass2El = document.getElementById("cslPass2");
  var confirmFld = document.getElementById("confirmFld");
  var errEl = document.getElementById("authErr");
  var submitEl = document.getElementById("authSubmit");
  var tabBtns = document.querySelectorAll(".auth__tabs button");

  var mode = "login";
  var currentUser = null;
  var progress = {};
  var built = false;
  var state = { filter: "all", hideDone: false };

  /* ---------------- auth UI ---------------- */
  function setMode(m) {
    mode = m;
    Array.prototype.forEach.call(tabBtns, function (b) { b.classList.toggle("is-active", b.getAttribute("data-tab") === m); });
    confirmFld.hidden = m !== "register";
    submitEl.textContent = m === "register" ? "Create account" : "Log in";
    passEl.setAttribute("autocomplete", m === "register" ? "new-password" : "current-password");
    hideErr();
  }
  function showErr(msg) { errEl.textContent = msg; errEl.hidden = false; }
  function hideErr() { errEl.hidden = true; }

  Array.prototype.forEach.call(tabBtns, function (b) { b.addEventListener("click", function () { setMode(b.getAttribute("data-tab")); }); });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    hideErr();
    var username = userEl.value.trim();
    var pw = passEl.value;
    userEl.classList.remove("invalid"); passEl.classList.remove("invalid");

    if (username.length < 2) { userEl.classList.add("invalid"); return showErr("Username must be at least 2 characters."); }
    if (pw.length < 4) { passEl.classList.add("invalid"); return showErr("Password must be at least 4 characters."); }
    if (!window.crypto || !crypto.subtle) { return showErr("This browser blocks secure hashing here. Open the site over HTTPS."); }

    var users = getUsers();
    submitEl.disabled = true;

    if (mode === "register") {
      if (users[username]) { submitEl.disabled = false; userEl.classList.add("invalid"); return showErr("That username is already taken on this device."); }
      if (pw !== pass2El.value) { submitEl.disabled = false; pass2El.classList.add("invalid"); return showErr("The two passwords don't match."); }
      var salt = randSalt();
      hashPw(pw, salt).then(function (h) { users[username] = { salt: salt, hash: h }; saveUsers(users); finishAuth(username); })
        .catch(function () { submitEl.disabled = false; showErr("Something went wrong. Please try again."); });
    } else {
      var rec = users[username];
      if (!rec) { submitEl.disabled = false; userEl.classList.add("invalid"); return showErr("No account with that username on this device. Try Register."); }
      hashPw(pw, rec.salt).then(function (h) {
        if (h !== rec.hash) { submitEl.disabled = false; passEl.classList.add("invalid"); return showErr("Wrong password."); }
        finishAuth(username);
      }).catch(function () { submitEl.disabled = false; showErr("Something went wrong. Please try again."); });
    }
  });

  function finishAuth(username) {
    submitEl.disabled = false;
    passEl.value = ""; pass2El.value = "";
    try { localStorage.setItem(LS_SESSION, username); } catch (e) { /* ignore */ }
    showApp(username);
  }

  /* ---------------- build: gauges ---------------- */
  function buildGauges() {
    var box = document.getElementById("gauges");
    PRIOS.forEach(function (p) {
      var g = el("div", "gauge"); g.setAttribute("data-prio", p);
      g.innerHTML =
        '<svg class="gauge__svg" viewBox="0 0 120 80">' +
          '<path class="gauge__track" d="M8 64 A52 52 0 0 1 112 64" fill="none" stroke-width="9" stroke-linecap="round"/>' +
          '<path class="gauge__fill" d="M8 64 A52 52 0 0 1 112 64" fill="none" stroke="' + GAUGE_COL[p] + '" stroke-width="9" stroke-linecap="round" stroke-dasharray="' + ARC + '" stroke-dashoffset="' + ARC + '"/>' +
          '<text class="gauge__num" x="60" y="58" text-anchor="middle">0%</text>' +
        "</svg>" +
        '<div class="gauge__label">' + cap(p) + "</div>" +
        '<div class="gauge__sub" data-sub>0 / 0</div>';
      box.appendChild(g);
    });
  }

  /* ---------------- build: card grid ---------------- */
  function buildItem(slug, it, ii) {
    var id = itemId(slug, ii);
    var item = el("div", "item"); item.setAttribute("data-id", id); item.setAttribute("data-priority", it.priority);
    var row = el("label", "item__row");
    var cb = el("input", "item__cb"); cb.type = "checkbox";
    var point = el("span", "item__point", it.point);
    var badge = el("span", "badge badge--" + it.priority, cap(it.priority));
    row.appendChild(cb); row.appendChild(point); row.appendChild(badge);
    var more = el("button", "item__more", "Details ▾"); more.type = "button";
    var details = el("div", "item__details"); var di = el("div", "item__detailsInner"); details.appendChild(di);
    cb.addEventListener("change", function () { toggleItem(id, cb.checked); });
    more.addEventListener("click", function () {
      if (!di.dataset.loaded) { di.innerHTML = it.details; di.dataset.loaded = "1"; }
      var open = item.classList.toggle("expanded");
      more.textContent = open ? "Hide details ▴" : "Details ▾";
    });
    item.appendChild(row); item.appendChild(more); item.appendChild(details);
    return item;
  }

  function buildGrid() {
    var grid = document.getElementById("grid");
    SECTIONS.forEach(function (sec) {
      var color = COLORS[sec.slug] || "#cdf546";
      var card = el("div", "sec-card"); card.setAttribute("data-slug", sec.slug);

      var head = el("button", "sec-card__head"); head.type = "button"; head.setAttribute("aria-expanded", "false");
      var ic = el("span", "sec-card__icon"); ic.style.color = color; ic.innerHTML = icon(sec.slug);
      var main = el("span", "sec-card__main");
      var top = el("span", "sec-card__top");
      var title = el("span", "sec-card__title", sec.title); title.style.color = color;
      var status = el("span", "sec-card__status", "Not yet started");
      top.appendChild(title); top.appendChild(status);
      var desc = el("span", "sec-card__desc", sec.description);
      var foot = el("span", "sec-card__foot");
      var count = el("span", "sec-card__count", sec.items.length + " items");
      var bar = el("span", "sec-card__bar"); var barFill = el("i"); barFill.style.background = color; bar.appendChild(barFill);
      foot.appendChild(count); foot.appendChild(bar);
      main.appendChild(top); main.appendChild(desc); main.appendChild(foot);
      head.appendChild(ic); head.appendChild(main);

      var bodyInner = el("div", "sec-card__bodyInner");
      if (sec.intro) { var intro = el("div", "sec-card__intro"); intro.innerHTML = sec.intro; bodyInner.appendChild(intro); }
      sec.items.forEach(function (it, ii) { bodyInner.appendChild(buildItem(sec.slug, it, ii)); });
      var body = el("div", "sec-card__body"); body.appendChild(bodyInner);

      head.addEventListener("click", function () {
        var open = card.classList.toggle("open");
        head.setAttribute("aria-expanded", open ? "true" : "false");
      });
      card.appendChild(head); card.appendChild(body);
      grid.appendChild(card);
    });
  }

  /* ---------------- progress / stats ---------------- */
  function applyProgressToDOM() {
    Array.prototype.forEach.call(document.querySelectorAll(".item"), function (item) {
      var on = !!progress[item.getAttribute("data-id")];
      item.classList.toggle("done", on);
      var cb = item.querySelector(".item__cb"); if (cb) cb.checked = on;
    });
    updateStats();
    refreshEmptyCards();
  }

  function toggleItem(id, checked) {
    if (checked) progress[id] = true; else delete progress[id];
    if (currentUser) saveProgress(currentUser, progress);
    var item = document.querySelector('.item[data-id="' + id.replace(/"/g, '\\"') + '"]');
    if (item) item.classList.toggle("done", checked);
    updateStats();
    if (state.hideDone) refreshEmptyCards();
  }

  function updateStats() {
    var total = 0, done = 0, byP = { essential: [0, 0], optional: [0, 0], advanced: [0, 0] };
    SECTIONS.forEach(function (sec) {
      var sTotal = sec.items.length, sDone = 0;
      sec.items.forEach(function (it, ii) {
        var on = !!progress[itemId(sec.slug, ii)];
        total++; if (on) done++;
        byP[it.priority][1]++; if (on) byP[it.priority][0]++;
        if (on) sDone++;
      });
      var card = document.querySelector('.sec-card[data-slug="' + sec.slug + '"]');
      if (card) {
        var pct = sTotal ? (sDone / sTotal * 100) : 0;
        card.querySelector(".sec-card__bar i").style.width = pct + "%";
        var st = card.querySelector(".sec-card__status");
        if (sDone === 0) { st.textContent = "Not yet started"; st.classList.remove("done"); }
        else if (sDone === sTotal) { st.textContent = "Completed ✓"; st.classList.add("done"); }
        else { st.textContent = sDone + " / " + sTotal + " done"; st.classList.remove("done"); }
      }
    });
    PRIOS.forEach(function (p) {
      var d = byP[p][0], t = byP[p][1], frac = t ? d / t : 0;
      var g = document.querySelector('.gauge[data-prio="' + p + '"]');
      if (g) {
        g.querySelector(".gauge__fill").style.strokeDashoffset = (ARC * (1 - frac));
        g.querySelector(".gauge__num").textContent = Math.round(frac * 100) + "%";
        g.querySelector("[data-sub]").textContent = d + " / " + t;
      }
    });
    var opct = total ? Math.round(done / total * 100) : 0;
    var ov = document.getElementById("overall");
    ov.textContent = ""; ov.appendChild(document.createTextNode(done + " of " + total + " completed · "));
    var b = document.createElement("b"); b.textContent = opct + "%"; ov.appendChild(b);
  }

  function refreshEmptyCards() {
    SECTIONS.forEach(function (sec) {
      var any = false;
      for (var ii = 0; ii < sec.items.length; ii++) {
        var it = sec.items[ii];
        if (state.filter !== "all" && it.priority !== state.filter) continue;
        if (state.hideDone && progress[itemId(sec.slug, ii)]) continue;
        any = true; break;
      }
      var card = document.querySelector('.sec-card[data-slug="' + sec.slug + '"]');
      if (card) card.classList.toggle("empty", !any);
    });
  }

  /* ---------------- controls ---------------- */
  function wireControls() {
    var grid = document.getElementById("grid");
    Array.prototype.forEach.call(document.querySelectorAll("#filters button"), function (b) {
      b.addEventListener("click", function () {
        Array.prototype.forEach.call(document.querySelectorAll("#filters button"), function (x) { x.classList.remove("is-active"); });
        b.classList.add("is-active");
        state.filter = b.getAttribute("data-filter");
        grid.classList.remove("f-essential", "f-optional", "f-advanced");
        if (state.filter !== "all") grid.classList.add("f-" + state.filter);
        refreshEmptyCards();
      });
    });
    document.getElementById("hideDone").addEventListener("change", function (e) {
      state.hideDone = e.target.checked;
      grid.classList.toggle("hide-done", state.hideDone);
      refreshEmptyCards();
    });
    document.getElementById("resetBtn").addEventListener("click", function () {
      if (!confirm("Reset all your checklist progress? This can't be undone.")) return;
      progress = {};
      if (currentUser) saveProgress(currentUser, progress);
      applyProgressToDOM();
    });
    document.getElementById("logoutBtn").addEventListener("click", logout);
  }

  /* ---------------- views ---------------- */
  function showApp(username) {
    currentUser = username;
    document.getElementById("appUser").textContent = username;
    if (!built) { buildGauges(); buildGrid(); wireControls(); built = true; }
    progress = getProgress(username);
    applyProgressToDOM();
    authView.hidden = true;
    appView.hidden = false;
    window.scrollTo(0, 0);
  }

  function logout() {
    try { localStorage.removeItem(LS_SESSION); } catch (e) { /* ignore */ }
    currentUser = null; progress = {};
    appView.hidden = true;
    authView.hidden = false;
    setMode("login");
    userEl.value = ""; passEl.value = "";
  }

  /* ---------------- init ---------------- */
  setMode("login");
  var session = null;
  try { session = localStorage.getItem(LS_SESSION); } catch (e) { /* ignore */ }
  if (session && getUsers()[session]) showApp(session);
})();
